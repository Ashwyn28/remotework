<script lang="ts">
	import {
		ago,
		getCategory,
		hasPreferences,
		MATCH_THRESHOLD,
		matchScore,
		NEW_DAYS,
		seniorityLabel,
		stageLabel
	} from '$lib/board';
	import type { CompanyGroup } from '$lib/board';
	import { preferences, setStatus, tracked } from '$lib/personal';
	import { slide } from 'svelte/transition';
	import Avatar from './avatar.svelte';
	import SaveButton from './saveButton.svelte';

	export let group: CompanyGroup;
	/** position on the current page, shown as a rank badge */
	export let position: number | null = null;
	/** show only the best role, with a count of the rest */
	export let compact = false;
	/** hide the company header, e.g. on the company's own page */
	export let rolesOnly = false;

	/** roles shown before "show all" */
	export let limit = 5;

	let open: string | null = null;
	let expanded = false;

	$: ({ company, jobs } = group);
	$: matching = hasPreferences($preferences);
	// best fit first, so the roles above the fold are the ones worth reading
	$: ordered = matching
		? [...jobs].sort((a, b) => matchScore(b, $preferences) - matchScore(a, $preferences))
		: jobs;
	$: shown = compact ? ordered.slice(0, 1) : expanded ? ordered : ordered.slice(0, limit);
	$: hidden = compact ? 0 : ordered.length - shown.length;
	const details = (job: CompanyGroup['jobs'][number]) =>
		[job.salary, seniorityLabel(job.seniority), job.arrangement, job.region].filter(Boolean);
	$: industry = getCategory(company.industry, 'industry');
	$: meta = [stageLabel(company.stage), company.location, company.size].filter(Boolean).join(' · ');
	const scoreClass = (score: number) =>
		score >= 80
			? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
			: score >= 60
			? 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200'
			: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
</script>

<article
	class="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
>
	{#if !rolesOnly}
		<header class="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
			<Avatar {company} size="lg" />
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
					<h3 class="flex items-center gap-1.5 text-lg font-bold text-slate-900 dark:text-white">
						<a href="/company/{company.id}" class="hover:underline">{company.name}</a>
						{#if company.verified}
							<svg
								viewBox="0 0 20 20"
								class="h-4 w-4 text-send-green"
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
					</h3>
					<a
						href="/category/{industry.slug}"
						class="rounded-full px-2.5 py-0.5 text-xs font-semibold hover:no-underline {industry.chip}"
						>{industry.name}</a
					>
				</div>
				{#if company.blurb}
					<p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{company.blurb}</p>
				{/if}
				{#if meta}
					<p class="mt-1 text-xs text-slate-400">{meta}</p>
				{/if}
			</div>
			{#if position}
				<span
					class="shrink-0 rounded-full bg-light-sand-green px-2.5 py-1 text-xs font-bold text-dark-beach-black dark:bg-slate-700 dark:text-white"
					title="Rank on this page">#{position}</span
				>
			{/if}
		</header>
	{/if}

	<ul
		class="divide-y divide-slate-100 dark:divide-slate-800 {rolesOnly
			? ''
			: 'border-t border-slate-100 dark:border-slate-800'}"
	>
		{#each shown as job (job.id)}
			{@const work = getCategory(job.workType, 'work')}
			<li class="px-4 py-3 sm:px-5">
				<div class="flex items-start gap-2 sm:items-center sm:gap-4">
					<button
						class="min-w-0 flex-1 text-left"
						aria-expanded={open === job.id}
						on:click={() => (open = open === job.id ? null : job.id)}
					>
						<span
							class="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-white"
						>
							{job.title}
							{#if job.postedDays !== null && job.postedDays <= NEW_DAYS}
								<span
									class="rounded bg-send-green px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
									>New</span
								>
							{/if}
							{#if matching}
								{@const score = matchScore(job, $preferences)}
								{#if score >= MATCH_THRESHOLD}
									<span
										class="rounded px-1.5 py-0.5 text-[11px] font-bold {scoreClass(score)}"
										title="How well this role fits your preferences">{score}% match</span
									>
								{/if}
							{/if}
							{#if $tracked[job.id]?.status === 'applied'}
								<span
									class="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
									>Applied</span
								>
							{/if}
						</span>
						<span class="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
							{#if job.salary}<span class="font-semibold text-slate-800 dark:text-slate-100"
									>{job.salary}</span
								>{/if}{details(job)
								.slice(job.salary ? 1 : 0)
								.map((part, i) => (i || job.salary ? ' · ' : '') + part)
								.join('')}
						</span>
						{#if job.postedDays !== null || job.verifiedDays !== null}
							<span class="mt-0.5 block text-xs text-slate-400">
								{#if job.postedDays !== null}Posted {ago(job.postedDays)}{/if}
								{#if job.postedDays !== null && job.verifiedDays !== null}<span aria-hidden="true">
										·
									</span>{/if}
								{#if job.verifiedDays !== null}
									<span class="text-emerald-600 dark:text-emerald-400"
										>✓ <span class="sm:hidden">Still open</span><span class="hidden sm:inline"
											>Listed on their careers site {ago(job.verifiedDays)}</span
										></span
									>
								{/if}
							</span>
						{/if}
					</button>
					<!-- larger screens: job type, Apply and save sit beside the title -->
					<div class="hidden shrink-0 items-center gap-3 sm:flex">
						<a
							href="/category/{work.slug}"
							class="rounded-full px-2.5 py-0.5 text-xs font-semibold hover:no-underline {work.chip}"
							>{work.name}</a
						>
						{#if job.applyUrl}
							<a
								href={job.applyUrl}
								target="_blank"
								rel="noopener noreferrer"
								on:click={() => setStatus(job.id, 'applied')}
								class="btn3d btn3d-primary btn3d-sm"><span>Apply</span></a
							>
						{:else}
							<span
								class="rounded bg-slate-100 px-4 py-1 text-sm font-semibold text-slate-400 dark:bg-slate-800"
								title="No application link yet">Apply</span
							>
						{/if}
						<SaveButton jobId={job.id} />
					</div>
					<div class="-mr-2 -mt-1 sm:hidden"><SaveButton jobId={job.id} /></div>
				</div>
				<!-- phones: job type and a full-size Apply under the title -->
				<div class="mt-2 flex items-center gap-3 sm:hidden">
					<a
						href="/category/{work.slug}"
						class="rounded-full px-2.5 py-1 text-xs font-semibold hover:no-underline {work.chip}"
						>{work.name}</a
					>
					{#if job.applyUrl}
						<a
							href={job.applyUrl}
							target="_blank"
							rel="noopener noreferrer"
							on:click={() => setStatus(job.id, 'applied')}
							class="btn3d btn3d-primary ml-auto"><span>Apply</span></a
						>
					{/if}
				</div>
				{#if open === job.id && job.description}
					<p class="pt-3 text-sm text-slate-600 dark:text-slate-300" transition:slide|local>
						{job.description}
					</p>
				{/if}
			</li>
		{/each}
	</ul>

	{#if hidden > 0}
		<button
			type="button"
			class="block w-full border-t border-slate-100 px-5 py-2.5 text-left text-sm font-medium text-slate-500 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white"
			on:click={() => (expanded = true)}
		>
			Show {hidden} more {hidden === 1 ? 'role' : 'roles'}
		</button>
	{/if}

	{#if compact && jobs.length > 1}
		<a
			href="/company/{company.id}"
			class="block border-t border-slate-100 px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:no-underline dark:border-slate-800 dark:text-slate-400 dark:hover:text-white"
		>
			+{jobs.length - 1} more {jobs.length - 1 === 1 ? 'role' : 'roles'} →
		</a>
	{/if}
</article>
