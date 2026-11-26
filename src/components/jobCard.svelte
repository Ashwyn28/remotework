<script lang="ts">
	import { ago, getCategory, MATCH_THRESHOLD, NEW_DAYS, seniorityLabel } from '$lib/board';
	import type { Job } from '$lib/board';
	import { setStatus, tracked } from '$lib/personal';
	import { slide } from 'svelte/transition';
	import Avatar from './avatar.svelte';
	import SaveButton from './saveButton.svelte';

	export let job: Job;
	/** 0–100, or null to hide the badge */
	export let score: number | null = null;

	let open = false;

	$: industry = getCategory(job.company.industry, 'industry');
	$: details = [job.salary, seniorityLabel(job.seniority), job.arrangement, job.region].filter(
		Boolean
	);
	$: scoreClass =
		score !== null && score >= 80
			? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
			: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200';
</script>

<article
	class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5"
>
	<div class="flex items-start gap-4">
		<a
			href="/company/{job.company.id}"
			class="shrink-0 hover:no-underline"
			aria-label="{job.company.name} profile"
		>
			<Avatar company={job.company} size="md" />
		</a>
		<div class="min-w-0 flex-1">
			<p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
				<a
					href="/company/{job.company.id}"
					class="font-semibold text-slate-700 hover:underline dark:text-slate-200"
					>{job.company.name}</a
				>
				<a
					href="/category/{industry.slug}"
					class="rounded-full px-2 py-0.5 text-[11px] font-semibold hover:no-underline {industry.chip}"
					>{industry.name}</a
				>
			</p>
			<button
				type="button"
				class="mt-1 block w-full text-left"
				aria-expanded={open}
				on:click={() => (open = !open)}
			>
				<span
					class="block text-base font-bold text-slate-900 dark:text-white sm:text-lg"
				>
					{job.title}
				</span>
				<span class="mt-1 flex flex-wrap items-center gap-2 leading-tight empty:hidden">
					{#if job.postedDays !== null && job.postedDays <= NEW_DAYS}
						<span
							class="rounded bg-send-green px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
							>New</span
						>
					{/if}
					{#if score !== null && score >= MATCH_THRESHOLD}
						<span
							class="rounded px-1.5 py-0.5 text-[11px] font-bold {scoreClass}"
							title="How well this role fits your answers">{score}% match</span
						>
					{/if}
					{#if $tracked[job.id]?.status === 'applied'}
						<span
							class="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
							>Applied</span
						>
					{/if}
				</span>
				<span class="mt-1 block text-sm text-slate-500 dark:text-slate-400">
					{#if job.salary}<span class="font-semibold text-slate-800 dark:text-slate-100"
							>{job.salary}</span
						>{/if}{details
						.slice(job.salary ? 1 : 0)
						.map((part, i) => (i || job.salary ? ' · ' : '') + part)
						.join('')}
				</span>
				{#if job.postedDays !== null || job.verifiedDays !== null}
					<span class="mt-0.5 block text-xs text-slate-400">
						{#if job.postedDays !== null}<span>Posted {ago(job.postedDays)}</span>{/if}
						{#if job.postedDays !== null && job.verifiedDays !== null}<span aria-hidden="true">
								·
							</span>{/if}
						{#if job.verifiedDays !== null}<span class="text-emerald-600 dark:text-emerald-400"
								>✓ <span class="sm:hidden">Still open</span><span class="hidden sm:inline"
									>Listed on their careers site {ago(job.verifiedDays)}</span
								></span
							>{/if}
					</span>
				{/if}
			</button>
		</div>
		<div class="flex shrink-0 items-center gap-2">
			{#if job.applyUrl}
				<a
					href={job.applyUrl}
					target="_blank"
					rel="noopener noreferrer"
					on:click={() => setStatus(job.id, 'applied')}
					class="hidden rounded bg-send-green px-4 py-1 text-sm font-semibold text-white ring-send-green transition hover:bg-transparent hover:text-send-green hover:no-underline hover:ring-2 sm:inline-block"
					>Apply</a
				>
			{/if}
			<SaveButton jobId={job.id} />
		</div>
	</div>
	{#if open}
		<div transition:slide|local class="pt-3 sm:pl-16">
			{#if job.description}
				<p class="text-sm text-slate-600 dark:text-slate-300">{job.description}</p>
			{/if}
			{#if job.applyUrl}
				<a
					href={job.applyUrl}
					target="_blank"
					rel="noopener noreferrer"
					on:click={() => setStatus(job.id, 'applied')}
					class="mt-3 inline-block text-sm font-semibold text-send-green hover:underline"
					>Read the full role and apply ↗</a
				>
			{/if}
		</div>
	{/if}
	{#if job.applyUrl}
		<a
			href={job.applyUrl}
			target="_blank"
			rel="noopener noreferrer"
			on:click={() => setStatus(job.id, 'applied')}
			class="mt-3 block rounded bg-send-green px-4 py-1.5 text-center text-sm font-semibold text-white hover:no-underline sm:hidden"
			>Apply</a
		>
	{/if}
</article>
