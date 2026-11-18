<script context="module" lang="ts">
	import { CATEGORIES, loadBoard, topJobs } from '$lib/board';
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ params, fetch }) => {
		const { jobs, companies, offline } = await loadBoard(fetch);
		const slug = params.slug;
		const known = CATEGORIES.find((c) => c.slug === slug);
		const top = topJobs(jobs);
		const kind = known
			? known.kind
			: top.some((j) => j.industry === slug)
			? 'industry'
			: top.some((j) => j.workType === slug)
			? 'work'
			: null;
		if (!kind) {
			return { status: 404, error: new Error(`No category called “${slug}”`) };
		}
		return { props: { jobs, companies, offline, slug, kind } };
	};
</script>

<script lang="ts">
	import {
		applyFilters,
		categorySummaries,
		getCategory,
		inPlaces,
		linkOnlyCompanies,
		NO_FILTERS,
		presentStages,
		topCompanies
	} from '$lib/board';
	import { preferences } from '$lib/personal';
	import type { CategoryKind, Company, Filters, Job } from '$lib/board';
	import Avatar from '../../components/avatar.svelte';
	import CompanyBlock from '../../components/companyBlock.svelte';
	import FilterBar from '../../components/filterBar.svelte';

	export let jobs: Job[];
	export let companies: Company[] = [];
	export let offline: boolean;
	export let slug: string;
	export let kind: CategoryKind;

	// narrow an industry by type of work, or a type of work by industry
	let refine = '';
	let filters: Filters = NO_FILTERS;
	let lastSlug = slug;
	$: if (slug !== lastSlug) {
		lastSlug = slug;
		refine = '';
		filters = NO_FILTERS;
	}

	$: category = getCategory(slug, kind);
	$: otherKind = (kind === 'industry' ? 'work' : 'industry') as CategoryKind;
	// only roles the visitor could do from where they said they can work
	$: reachable = inPlaces(jobs, $preferences.places);
	$: all = topCompanies(reachable, slug);
	// companies whose roles are only on their own careers site, e.g. Google in the Magnificent 7
	$: elsewhere = kind === 'industry' ? linkOnlyCompanies(companies, slug) : [];
	$: inThisCategory = all.flatMap((g) => g.jobs);
	$: refinements = categorySummaries(inThisCategory, otherKind);
	$: groups = topCompanies(applyFilters(reachable, filters), ...(refine ? [slug, refine] : [slug]));
	$: roleCount = groups.reduce((n, g) => n + g.jobs.length, 0);

	const chipBase =
		'shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition sm:px-3 sm:py-1';
	const chipOff =
		'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600';
	const chipOn = 'bg-dark-beach-black text-white dark:bg-white dark:text-slate-900';
</script>

<svelte:head>
	<title>{category.name} jobs · orbbits job</title>
</svelte:head>

<section class="pb-5 pt-6 sm:py-12">
	<a
		href="/"
		class="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
		>← All categories</a
	>
	<div class="mt-4 flex items-center gap-3">
		<span class="h-3.5 w-3.5 rounded-full {category.dot}" />
		<h1
			class="text-left text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
		>
			{category.name}
		</h1>
	</div>
	{#if category.blurb}
		<p class="mt-2 text-slate-500 dark:text-slate-400 sm:text-lg">{category.blurb}</p>
	{/if}
	<p class="mt-1 text-sm text-slate-400">
		{roleCount}
		{roleCount === 1 ? 'role' : 'roles'} at {groups.length} top {groups.length === 1
			? 'company'
			: 'companies'} where you can work
	</p>
</section>

{#if kind === 'industry' && (all.length || elsewhere.length)}
	<section class="mb-6 sm:mb-8" aria-labelledby="companies-heading">
		<h2
			id="companies-heading"
			class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400"
		>
			Companies hiring
		</h2>
		<ul
			class="no-scrollbar fade-right -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
		>
			{#each all as group (group.company.id)}
				<li class="shrink-0">
					<a
						href="/company/{group.company.id}"
						class="flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-slate-800 hover:border-slate-400 hover:no-underline dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
					>
						<Avatar company={group.company} size="sm" />
						{group.company.name}
						<span class="font-normal text-slate-400">{group.jobs.length}</span>
					</a>
				</li>
			{/each}
			{#each elsewhere as company (company.id)}
				<li class="shrink-0">
					<a
						href={company.careersUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-2 whitespace-nowrap rounded-full border border-dashed border-slate-300 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-slate-800 hover:border-slate-400 hover:no-underline dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
						title="{company.name} lists its UK roles on its own careers site"
					>
						<Avatar {company} size="sm" />
						{company.name}
						<span class="font-normal text-slate-400" aria-label="(opens their careers site)">↗</span
						>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if refinements.length > 1}
	<div
		class="no-scrollbar fade-right -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
		role="group"
		aria-label="Filter by {otherKind === 'work' ? 'type of work' : 'industry'}"
	>
		<button
			class="{chipBase} {refine === '' ? chipOn : chipOff}"
			aria-pressed={refine === ''}
			on:click={() => (refine = '')}>All</button
		>
		{#each refinements as r (r.category.slug)}
			<button
				class="{chipBase} {refine === r.category.slug ? chipOn : chipOff}"
				aria-pressed={refine === r.category.slug}
				on:click={() => (refine = refine === r.category.slug ? '' : r.category.slug)}
			>
				{r.category.name}
				<span class="ml-1 font-normal opacity-60">{r.roles}</span>
			</button>
		{/each}
	</div>
{/if}

<div class="mb-5 sm:mb-6">
	{#key slug}
		<FilterBar bind:filters stageOptions={presentStages(jobs)} swipe />
	{/key}
</div>

{#if !groups.length && jobs.length}
	<p class="text-sm text-slate-500 dark:text-slate-400">No roles match these filters.</p>
{/if}

<div class="grid gap-4">
	{#each groups as group, i (group.company.id)}
		<CompanyBlock {group} position={i + 1} />
	{/each}
</div>

{#if offline}
	<p class="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
		Can't reach the listings API right now. Start the backend and reload.
	</p>
{:else if !jobs.length}
	<p class="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
		No top companies are listed yet.
	</p>
{/if}

{#if elsewhere.length}
	<section class="mt-10" aria-labelledby="elsewhere-heading">
		<h2 id="elsewhere-heading" class="text-lg font-bold text-slate-900 dark:text-white">
			On their own careers sites
		</h2>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
			{elsewhere
				.map((c) => c.name)
				.join(', ')
				.replace(/, ([^,]*)$/, ' and $1')} do not publish their roles in a form we can show here. Their
			UK roles are a tap away.
		</p>
		<ul class="mt-4 grid gap-3 sm:grid-cols-2">
			{#each elsewhere as company (company.id)}
				<li>
					<a
						href={company.careersUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 hover:no-underline dark:border-slate-700 dark:bg-slate-900"
					>
						<Avatar {company} size="md" />
						<span class="min-w-0 flex-1">
							<span class="block font-semibold text-slate-900 dark:text-white">{company.name}</span>
							<span class="block truncate text-sm text-slate-500 dark:text-slate-400"
								>{company.blurb}</span
							>
						</span>
						<span class="shrink-0 text-sm font-semibold text-send-green">UK roles ↗</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}
