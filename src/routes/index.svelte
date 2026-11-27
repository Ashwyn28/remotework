<script context="module" lang="ts">
	import { loadBoard } from '$lib/board';
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ fetch }) => ({ props: await loadBoard(fetch) });
</script>

<script lang="ts">
	import {
		applyFilters,
		categorySummaries,
		CATEGORIES,
		inPlaces,
		isOnboarded,
		linkOnlyCompanies,
		MATCH_THRESHOLD,
		matchScore,
		NO_FILTERS,
		PLACES,
		presentStages,
		SENIORITIES,
		STAGES,
		topJobs
	} from '$lib/board';
	import type { Company, Filters, Job } from '$lib/board';
	import { preferences, tracked } from '$lib/personal';
	import CategoryCard from '../components/categoryCard.svelte';
	import Avatar from '../components/avatar.svelte';
	import FilterBar from '../components/filterBar.svelte';
	import JobCard from '../components/jobCard.svelte';

	export let jobs: Job[];
	export let companies: Company[] = [];
	export let offline: boolean;
	/** when the daily sync last refreshed the listings */
	export let generatedAt: string | null = null;

	const PAGE = 20;
	type Sort = 'match' | 'newest';
	const SORTS: { value: Sort; label: string }[] = [
		{ value: 'match', label: 'Best match' },
		{ value: 'newest', label: 'Newest' }
	];

	let query = '';
	let filters: Filters = NO_FILTERS;
	let sort: Sort = 'match';
	// nothing to match on yet: show the newest roles first, until the visitor picks a sort
	let sortChosen = false;
	$: if (!sortChosen) sort = isOnboarded($preferences) ? 'match' : 'newest';
	let hideApplied = true;
	let shown = PAGE;
	/** one of the visitor's industries, or '' for all of them */
	let tab = '';
	/** phones: sort and filters sit behind a button */
	let showFilters = false;

	const label = (list: { value: string; label: string }[], value: string) =>
		list.find((item) => item.value === value)?.label ?? value;
	const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

	$: scored = topJobs(jobs)
		.map((job) => ({ job, score: matchScore(job, $preferences) }))
		.filter(({ score }) => score >= MATCH_THRESHOLD);

	$: q = query.trim().toLowerCase();
	$: visible = applyFilters(
		scored.map((s) => s.job),
		filters
	);
	$: visibleIds = new Set(visible.map((j) => j.id));
	$: candidates = scored
		.filter(({ job }) => visibleIds.has(job.id))
		.filter(({ job }) => !(hideApplied && $tracked[job.id]?.status === 'applied'))
		.filter(
			({ job }) =>
				!q ||
				[job.title, job.company.name, job.region, job.description]
					.join(' ')
					.toLowerCase()
					.includes(q)
		)
		.sort((a, b) =>
			sort === 'newest'
				? (a.job.postedDays ?? 999) - (b.job.postedDays ?? 999) || b.score - a.score
				: b.score - a.score || (a.job.postedDays ?? 999) - (b.job.postedDays ?? 999)
		);

	// visitors who have not answered the questions see every role, newest first
	$: personalised = isOnboarded($preferences);
	// the visitor's own industries, or every industry with roles; in board order
	$: myIndustries = CATEGORIES.filter(
		(c) =>
			c.kind === 'industry' &&
			(personalised
				? $preferences.industries.includes(c.slug)
				: candidates.some(({ job }) => job.industry === c.slug))
	);
	$: if (tab && !myIndustries.some((c) => c.slug === tab)) tab = '';
	$: tabCounts = Object.fromEntries(
		myIndustries.map((c) => [
			c.slug,
			candidates.filter(({ job }) => job.industry === c.slug).length
		])
	);
	$: matching = tab ? candidates.filter(({ job }) => job.industry === tab) : candidates;
	$: fresh = matching.filter(({ job }) => job.addedInLatestBatch);
	// best match: roles new to the board since the last sync lead; newest: posting date alone
	$: feed =
		sort === 'match' && fresh.length
			? [...fresh, ...matching.filter(({ job }) => !job.addedInLatestBatch)]
			: matching;
	// chosen industries' companies that list roles only on their own sites (Google, Meta…)
	$: elsewhere = myIndustries
		.filter((c) => !tab || tab === c.slug)
		.flatMap((c) => linkOnlyCompanies(companies, c.slug));

	$: activeFilters =
		filters.modes.length +
		filters.stages.length +
		(sort !== 'match' ? 1 : 0) +
		(hideApplied ? 0 : 1);

	let feedTop: HTMLElement;
	/** switch industry; if the list has scrolled away on a phone, bring its start back into view */
	const selectTab = (slug: string) => {
		tab = slug;
		if (feedTop && feedTop.getBoundingClientRect().top < 0) {
			feedTop.scrollIntoView({ block: 'start' });
		}
	};

	// industries the visitor did not pick, counted for where they can work
	$: others = personalised
		? categorySummaries(inPlaces(jobs, $preferences.places), 'industry').filter(
				(summary) => !$preferences.industries.includes(summary.category.slug)
		  )
		: [];

	// start from the top again whenever the list changes shape
	$: query, filters, sort, hideApplied, tab, (shown = PAGE);

	$: companyCount = new Set(feed.map(({ job }) => job.company.id)).size;
	$: newThisWeek = feed.filter(({ job }) => job.postedDays !== null && job.postedDays <= 7).length;
	$: answers = [
		...$preferences.places.map((p) => label(PLACES, p)),
		...$preferences.workTypes.map(categoryName),
		...$preferences.seniorities.map((s) => label(SENIORITIES, s)),
		...$preferences.stages.map((s) => label(STAGES, s)),
		...($preferences.minSalary ? [`£${$preferences.minSalary}k+`] : [])
	];
	$: reachableCount = inPlaces(topJobs(jobs), $preferences.places).length;
</script>

<svelte:head>
	<title>{personalised ? 'Your roles' : 'Latest engineering roles in the UK'} · orbbits job</title>
	<meta
		name="description"
		content="Open roles at top companies, matched to what you are looking for."
	/>
</svelte:head>

<section class="pb-4 pt-6 sm:py-12">
	<h1 class="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
		{personalised ? 'Your roles' : 'Latest engineering roles in the UK'}
	</h1>
	<p class="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-base">
		{feed.length.toLocaleString()} open {feed.length === 1 ? 'role' : 'roles'} at {companyCount}
		{companyCount === 1 ? 'company' : 'companies'}{#if newThisWeek}, {newThisWeek} posted this week{/if}.
		{#if personalised}
			<span class="hidden sm:inline">Matched to what you told us.</span>
		{:else}
			<span class="hidden sm:inline">Newest first, refreshed every morning.</span>
		{/if}
	</p>
	{#if !personalised}
		<div class="mt-5 flex flex-wrap items-center gap-3">
			<a
				href="/match"
				class="btn3d btn3d-primary"><span>Personalise your feed</span></a
			>
			<a
				href="/agent"
				class="btn3d btn3d-secondary"><span>Ask the agent</span></a
			>
			<span class="text-xs text-slate-400">A few quick questions, or tell the agent in your own words.</span>
		</div>
	{:else}
	<!-- phones: one line, tap to change -->
	<a
		href="/match"
		class="mt-2 flex items-center gap-2 text-sm hover:no-underline sm:hidden"
		aria-label="Your answers: {answers.join(', ')}. Change answers"
	>
		<span class="min-w-0 truncate text-slate-600 dark:text-slate-300">{answers.join(' · ')}</span>
		<span class="shrink-0 font-semibold text-send-green">Change</span>
	</a>
	<div class="mt-4 hidden flex-wrap items-center gap-2 sm:flex">
		{#each answers as answer}
			<span
				class="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
				>{answer}</span
			>
		{/each}
		<a href="/match" class="ml-1 text-sm font-semibold text-send-green hover:underline"
			>Change answers</a
		>
	</div>
	{/if}
</section>

<div class="mb-4 space-y-3 sm:mb-5">
	<div class="flex items-center gap-2 sm:gap-3">
		<label class="sr-only" for="search">Search your roles</label>
		<input
			id="search"
			type="search"
			bind:value={query}
			placeholder="Search title, company, location…"
			class="min-w-0 flex-1 rounded-lg border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 shadow-sm focus:border-send-green focus:ring-send-green dark:border-slate-600 dark:bg-slate-900 dark:text-white sm:max-w-sm sm:py-2 sm:text-sm"
		/>
		<button
			type="button"
			class="relative flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 sm:hidden"
			aria-expanded={showFilters}
			aria-controls="feed-filters"
			on:click={() => (showFilters = !showFilters)}
		>
			<svg
				viewBox="0 0 24 24"
				class="h-4 w-4"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				aria-hidden="true"
			>
				<path d="M4 6h16M7 12h10M10 18h4" />
			</svg>
			Filters
			{#if activeFilters}
				<span class="rounded-full bg-send-green px-1.5 text-xs text-white">{activeFilters}</span>
			{/if}
		</button>
		<label class="hidden items-center gap-2 text-sm text-slate-600 dark:text-slate-300 sm:flex">
			Sort
			<select
				bind:value={sort}
				on:change={() => (sortChosen = true)}
				class="rounded-lg border-slate-300 bg-white py-1.5 pl-3 pr-8 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
			>
				<option value="match">Best match</option>
				<option value="newest">Newest</option>
			</select>
		</label>
		<label class="hidden items-center gap-2 text-sm text-slate-600 dark:text-slate-300 sm:flex">
			<input
				type="checkbox"
				bind:checked={hideApplied}
				class="rounded border-slate-300 text-send-green focus:ring-send-green"
			/>
			Hide roles I applied to
		</label>
	</div>
	<div
		id="feed-filters"
		class="{showFilters
			? 'block'
			: 'hidden'} space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:block sm:space-y-0 sm:border-0 sm:bg-transparent sm:p-0 sm:dark:bg-transparent"
	>
		<!-- phones only: sort and hide-applied, which sit in the row above on larger screens -->
		<div class="grid grid-cols-2 gap-2 sm:hidden" role="group" aria-label="Sort">
			{#each SORTS as { value, label }}
				<button
					type="button"
					aria-pressed={sort === value}
					class="rounded-lg py-2.5 text-sm font-semibold {sort === value
						? 'bg-dark-beach-black text-white dark:bg-white dark:text-slate-900'
						: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}"
					on:click={() => ((sort = value), (sortChosen = true))}>{label}</button
				>
			{/each}
		</div>
		<label class="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 sm:hidden">
			<input
				type="checkbox"
				bind:checked={hideApplied}
				class="h-5 w-5 rounded border-slate-300 text-send-green focus:ring-send-green"
			/>
			Hide roles I applied to
		</label>
		<FilterBar bind:filters stageOptions={presentStages(jobs)} />
		<button
			type="button"
			class="btn3d btn3d-primary btn3d-block sm:hidden"
			on:click={() => (showFilters = false)}
			><span>Show {feed.length} {feed.length === 1 ? 'role' : 'roles'}</span></button
		>
	</div>
</div>

<span bind:this={feedTop} aria-hidden="true" />
{#if myIndustries.length > 1}
	<div
		class="no-scrollbar sticky top-0 z-20 -mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-slate-200 bg-canvas/95 px-4 backdrop-blur dark:border-slate-700 dark:bg-canvas-dark/95 sm:static sm:mx-0 sm:mb-5 sm:gap-2 sm:bg-transparent sm:px-0 sm:backdrop-blur-none sm:dark:bg-transparent"
		role="tablist"
		aria-label="Your industries"
	>
		{#each [{ slug: '', name: 'All', dot: '' }, ...myIndustries] as item (item.slug)}
			<button
				type="button"
				role="tab"
				aria-selected={tab === item.slug}
				class="-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition sm:py-2 {tab ===
				item.slug
					? 'border-send-green text-slate-900 dark:text-white'
					: 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}"
				on:click={() => selectTab(item.slug)}
			>
				{#if item.dot}<span class="h-2 w-2 rounded-full {item.dot}" aria-hidden="true" />{/if}
				{item.name}
				<span class="font-normal opacity-60"
					>{item.slug ? tabCounts[item.slug] ?? 0 : candidates.length}</span
				>
			</button>
		{/each}
	</div>
{/if}

{#if offline}
	<p class="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
		Can't reach the listings API right now. Start the backend and reload.
	</p>
{:else if !feed.length}
	<div
		class="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600"
	>
		<p class="font-semibold text-slate-900 dark:text-white">Nothing fits right now.</p>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
			{#if q || filters.modes.length || filters.stages.length}
				Clear the search or filters above.
			{:else}
				There are {reachableCount} roles where you can work. Try adding another type of work or level.
			{/if}
		</p>
		<a href="/match" class="mt-3 inline-block text-sm font-semibold text-send-green hover:underline"
			>Change answers</a
		>
	</div>
{:else}
	<ol class="grid gap-3">
		{#each feed.slice(0, shown) as { job, score }, i (job.id)}
			<li>
				{#if fresh.length && i === 0}
					<h2 class="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Latest</h2>
				{:else if fresh.length && i === fresh.length}
					<h2 class="mb-3 mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">Earlier roles</h2>
				{/if}
				<JobCard {job} score={personalised ? score : null} />
			</li>
		{/each}
	</ol>
	{#if shown < feed.length}
		<div class="mt-6 text-center">
			<button
				type="button"
				class="w-full rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 sm:w-auto sm:py-2"
				on:click={() => (shown += PAGE)}
				>Show {Math.min(PAGE, feed.length - shown)} more of {feed.length - shown}</button
			>
		</div>
	{/if}
{/if}

{#if !offline && elsewhere.length}
	<aside
		class="mt-6 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-600"
		aria-labelledby="elsewhere-heading"
	>
		<h2 id="elsewhere-heading" class="text-sm font-semibold text-slate-900 dark:text-white">
			Also hiring, on their own sites
		</h2>
		<ul class="mt-3 flex flex-wrap gap-2">
			{#each elsewhere as company (company.id)}
				<li>
					<a
						href={company.careersUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-slate-800 hover:border-slate-400 hover:no-underline dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
					>
						<Avatar {company} size="sm" />
						{company.name} UK roles
						<span class="font-normal text-slate-400" aria-hidden="true">↗</span>
					</a>
				</li>
			{/each}
		</ul>
	</aside>
{/if}

{#if !offline && others.length}
	<section class="mt-16" aria-labelledby="explore-heading">
		<h2 id="explore-heading" class="text-xl font-bold text-slate-900 dark:text-white">
			Explore other industries
		</h2>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
			Not in your answers, but hiring where you can work.
		</p>
		<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each others as summary (summary.category.slug)}
				<CategoryCard {summary} />
			{/each}
		</div>
	</section>
{/if}
