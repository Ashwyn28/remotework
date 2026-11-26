<script context="module" lang="ts">
	import { loadBoard, topCompanies } from '$lib/board';
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ params, fetch }) => {
		const { jobs } = await loadBoard(fetch);
		const groups = topCompanies(jobs);
		const group = groups.find((g) => g.company.id === params.id);
		if (!group) {
			return { status: 404, error: new Error('This company is not on the board') };
		}
		// other top companies in the same industry, for "similar companies"
		const similar = groups
			.filter((g) => g.company.industry === group.company.industry && g.company.id !== params.id)
			.map((g) => ({ company: g.company, roles: g.jobs.length }));
		return { props: { group, similar } };
	};
</script>

<script lang="ts">
	import { getCategory, stageLabel } from '$lib/board';
	import type { Company, CompanyGroup } from '$lib/board';
	import Avatar from '../../components/avatar.svelte';
	import CompanyBlock from '../../components/companyBlock.svelte';

	export let group: CompanyGroup;
	export let similar: { company: Company; roles: number }[];

	$: ({ company, jobs } = group);
	$: industry = getCategory(company.industry, 'industry');
	$: facts = [
		['Stage', stageLabel(company.stage)],
		['Funding', company.funding],
		['Founded', company.founded ? String(company.founded) : ''],
		['Team', company.size],
		['HQ', company.location]
	].filter(([, value]) => value);
	$: website = /^https?:\/\//.test(company.website) ? company.website : '';
</script>

<svelte:head>
	<title>{company.name} careers · orbbits job</title>
</svelte:head>

<section class="pb-5 pt-6 sm:py-12">
	<a
		href="/category/{industry.slug}"
		class="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
		>← {industry.name}</a
	>
	<div class="mt-4 flex items-start gap-4 sm:mt-5 sm:gap-5">
		<Avatar {company} size="lg" />
		<div class="min-w-0">
			<h1
				class="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
			>
				{company.name}
				{#if company.verified}
					<svg
						viewBox="0 0 20 20"
						class="h-6 w-6 shrink-0 text-send-green"
						fill="currentColor"
						role="img"
						aria-label="Verified company"
					>
						<title>Verified company</title>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
			</h1>
			<p class="mt-1 text-slate-600 dark:text-slate-300 sm:text-lg">{company.blurb}</p>
			<p class="mt-1 text-sm text-slate-400">
				{industry.name}
				{#if website}
					· <a
						href={website}
						target="_blank"
						rel="noopener noreferrer"
						class="text-send-green hover:underline">Website ↗</a
					>
				{/if}
			</p>
		</div>
	</div>
</section>

<div class="grid gap-6 lg:grid-cols-3">
	<div class="space-y-6 lg:col-span-2">
		{#if company.mission}
			<section
				class="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
			>
				<h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">Mission</h2>
				<p class="mt-2 text-xl font-semibold leading-snug text-slate-900 dark:text-white">
					{company.mission}
				</p>
			</section>
		{/if}

		<section>
			<h2 class="mb-3 text-xl font-bold text-slate-900 dark:text-white">
				{jobs.length} open {jobs.length === 1 ? 'role' : 'roles'}
			</h2>
			<CompanyBlock {group} rolesOnly />
		</section>
	</div>

	<aside class="space-y-6">
		{#if facts.length}
			<section
				class="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
			>
				<h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">At a glance</h2>
				<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
					{#each facts as [label, value]}
						<div>
							<dt class="text-xs text-slate-400">{label}</dt>
							<dd class="font-semibold text-slate-900 dark:text-white">{value}</dd>
						</div>
					{/each}
				</dl>
				{#if company.investors.length}
					<h3 class="mt-5 text-xs text-slate-400">Backed by</h3>
					<ul class="mt-1.5 flex flex-wrap gap-1.5">
						{#each company.investors as investor}
							<li
								class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
							>
								{investor}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}

		{#if company.perks.length}
			<section
				class="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
			>
				<h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">Perks</h2>
				<ul class="mt-3 space-y-2">
					{#each company.perks as perk}
						<li class="flex gap-2 text-sm text-slate-700 dark:text-slate-200">
							<span class="text-send-green" aria-hidden="true">✓</span>{perk}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if similar.length}
			<section
				class="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
			>
				<h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">
					More in {industry.name}
				</h2>
				<ul class="mt-3 space-y-3">
					{#each similar as s (s.company.id)}
						<li>
							<a href="/company/{s.company.id}" class="flex items-center gap-3 hover:no-underline">
								<Avatar company={s.company} size="sm" />
								<span class="min-w-0 flex-1">
									<span
										class="block truncate text-sm font-semibold text-slate-900 hover:underline dark:text-white"
										>{s.company.name}</span
									>
									<span class="block text-xs text-slate-400"
										>{s.roles} {s.roles === 1 ? 'role' : 'roles'}</span
									>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</aside>
</div>
