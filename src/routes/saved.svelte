<script context="module" lang="ts">
	import { loadBoard } from '$lib/board';
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ fetch }) => {
		const { jobs, offline } = await loadBoard(fetch);
		return { props: { jobs, offline } };
	};
</script>

<script lang="ts">
	import { roleFacts, track } from '$lib/analytics';
	import { ago, getCategory } from '$lib/board';
	import type { Job } from '$lib/board';
	import { setStatus, tracked } from '$lib/personal';
	import { account } from '$lib/account';
	import type { Status } from '$lib/personal';
	import Avatar from '../components/avatar.svelte';
	import Salary from '../components/salary.svelte';

	export let jobs: Job[];
	export let offline: boolean;

	const DAY = 24 * 60 * 60 * 1000;
	const columns: { status: Status; title: string; empty: string }[] = [
		{ status: 'saved', title: 'Saved', empty: 'Bookmark roles on the board to keep them here.' },
		{ status: 'applied', title: 'Applied', empty: 'Roles you apply to move here.' }
	];

	$: byId = new Map(jobs.map((j) => [j.id, j]));
	$: rows = Object.entries($tracked)
		.map(([id, t]) => ({ job: byId.get(id), ...t }))
		.filter((r): r is { job: Job } & typeof r => Boolean(r.job))
		.sort((a, b) => b.at - a.at);
	// tracked roles no longer on the board (filled, or the company dropped off)
	$: gone = offline ? 0 : Object.keys($tracked).filter((id) => !byId.has(id)).length;
</script>

<svelte:head>
	<title>Saved roles · orbbits job</title>
</svelte:head>

<section class="pb-5 pt-6 sm:py-12">
	<h1 class="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
		Saved roles
	</h1>
	<p class="mt-2 text-slate-500 dark:text-slate-400">
		Your shortlist and applications.
		{#if $account.status === 'signed-in'}
			Saved to your account, on every device.
		{:else}
			Kept in this browser. <a href="/login" class="font-semibold text-send-green hover:underline"
				>Sign in</a
			> to keep them on every device.
		{/if}
	</p>
</section>

{#if offline}
	<p class="text-sm text-slate-500 dark:text-slate-400">
		Can't reach the listings API right now. Start the backend and reload.
	</p>
{:else}
	<div class="grid gap-6 md:grid-cols-2">
		{#each columns as col (col.status)}
			{@const items = rows.filter((r) => r.status === col.status)}
			<section>
				<h2
					class="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
				>
					{col.title}
					<span
						class="rounded-full bg-slate-200 px-2 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200"
						>{items.length}</span
					>
				</h2>
				<ul class="space-y-3">
					{#each items as { job, at } (job.id)}
						<li
							class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
						>
							<div class="flex items-start gap-3">
								<Avatar company={job.company} size="md" />
								<div class="min-w-0 flex-1">
									<p class="font-semibold text-slate-900 dark:text-white">{job.title}</p>
									<p class="text-sm text-slate-500 dark:text-slate-400">
										<a href="/company/{job.company.id}" class="hover:underline"
											>{job.company.name}</a
										>
										· {getCategory(job.workType, 'work').name}
									</p>
									{#if job.salary}<p class="mt-1.5"><Salary {job} /></p>{/if}
									<p class="mt-1 text-xs text-slate-400">
										{col.status === 'applied' ? 'Applied' : 'Saved'}
										{ago(Math.floor((Date.now() - at) / DAY))}
									</p>
								</div>
							</div>
							<div
								class="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800"
							>
								{#if col.status === 'saved'}
									{#if job.applyUrl}
										<a
											href={job.applyUrl}
											target="_blank"
											rel="noopener noreferrer"
											on:click={() => { setStatus(job.id, 'applied'); track('apply_clicked', { ...roleFacts(job), source: 'saved' }); }}
											class="btn3d btn3d-primary btn3d-sm"><span>Apply ↗</span></a
										>
									{/if}
									<button
										type="button"
										class="rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
										on:click={() => setStatus(job.id, 'applied')}>Mark applied</button
									>
								{:else}
									<button
										type="button"
										class="rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
										on:click={() => setStatus(job.id, 'saved')}>Move back to saved</button
									>
								{/if}
								<button
									type="button"
									class="ml-auto rounded px-2 py-1 text-xs font-semibold text-slate-400 hover:text-rose-600"
									on:click={() => setStatus(job.id, null)}>Remove</button
								>
							</div>
						</li>
					{:else}
						<li
							class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-600"
						>
							{col.empty}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
	{#if gone}
		<p class="mt-6 text-xs text-slate-400">
			{gone} tracked {gone === 1 ? 'role is' : 'roles are'} no longer on the board.
		</p>
	{/if}
{/if}
