<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { track } from '$lib/analytics';
	import { CATEGORIES, PLACES, SENIORITIES } from '$lib/board';
	import type { Place, Preferences, Seniority, Stage } from '$lib/board';
	import { preferences } from '$lib/personal';
	import { account } from '$lib/account';
	import ChipGroup from './chipGroup.svelte';

	/** show a Cancel link, for people changing answers they already gave */
	export let cancellable = false;

	const dispatch = createEventDispatcher<{ done: Preferences; cancel: void }>();
	onMount(() => track('personalise_started', {}));

	// the board lists engineering roles only: software and infrastructure, or data and ML
	const ENGINEERING_KINDS = [
		{ value: 'engineering', label: 'Software, infrastructure and hardware' },
		{ value: 'data', label: 'Data, ML and research' }
	];
	const SALARIES = [0, 50, 70, 90, 110, 130];
	// every curated company is either a late-stage private company or a public one
	const COMPANY_KINDS = [
		{ value: 'series-c-plus', label: 'Late-stage startup (Series C+)' },
		{ value: 'public', label: 'Public company' }
	];

	const steps = [
		{
			key: 'industries',
			title: 'Which industries do you want to work in?',
			hint: 'Pick one or more.',
			required: true
		},
		{
			key: 'places',
			title: 'Where can you work?',
			hint: 'Pick all that work for you.',
			required: true
		},
		{
			key: 'workTypes',
			title: 'What kind of engineering?',
			hint: 'Optional.',
			required: false
		},
		{
			key: 'seniorities',
			title: 'What level are you looking for?',
			hint: 'Optional. These rank higher.',
			required: false
		},
		{
			key: 'stages',
			title: 'What kind of company suits you?',
			hint: 'Optional.',
			required: false
		},
		{
			key: 'minSalary',
			title: 'What is your salary floor?',
			hint: 'Optional. Roles without published pay still show.',
			required: false
		}
	] as const;

	// work on a copy; the saved answers change only when the visitor finishes
	const start = $preferences;
	let workTypes: string[] = [...start.workTypes];
	let places: string[] = [...start.places];
	let seniorities: string[] = [...start.seniorities];
	let industries: string[] = [...start.industries];
	let stages: string[] = [...start.stages];
	let minSalary = start.minSalary;
	let step = 0;

	$: current = steps[step];
	$: answered =
		current.key === 'industries'
			? industries.length > 0
			: current.key === 'places'
			? places.length > 0
			: true;
	$: last = step === steps.length - 1;

	const finish = () => {
		const answers: Preferences = {
			industries,
			places: places as Place[],
			workTypes,
			seniorities: seniorities as Seniority[],
			stages: stages as Stage[],
			minSalary
		};
		preferences.set(answers);
		track('personalise_completed', {
			industries: industries.length,
			places: places.length,
			kinds_of_engineering: workTypes.length
		});
		dispatch('done', answers);
	};

	const next = () => (last ? finish() : step++);
</script>

<section class="mx-auto max-w-xl pt-6 sm:py-16" aria-labelledby="question">
	<div class="flex items-center justify-between text-xs font-semibold text-slate-400">
		<span>Question {step + 1} of {steps.length}</span>
		{#if cancellable}
			<button
				type="button"
				class="hover:text-slate-700 dark:hover:text-white"
				on:click={() => dispatch('cancel')}>Cancel</button
			>
		{/if}
	</div>
	<div
		class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
		role="progressbar"
		aria-valuemin={1}
		aria-valuemax={steps.length}
		aria-valuenow={step + 1}
		aria-label="Progress"
	>
		<div
			class="h-full rounded-full bg-send-green transition-all"
			style="width: {((step + 1) / steps.length) * 100}%"
		/>
	</div>

	{#if step === 0 && !cancellable}
		<p class="mt-8 text-sm font-semibold text-send-green">Personalise your feed</p>
	{/if}
	<h1
		id="question"
		class="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl {step ===
			0 && !cancellable
			? ''
			: 'mt-8'}"
	>
		{current.title}
	</h1>
	<p class="mt-2 text-slate-500 dark:text-slate-400">{current.hint}</p>

	<div class="mt-6">
		{#if current.key === 'workTypes'}
			<ChipGroup options={ENGINEERING_KINDS} bind:selected={workTypes} label="Kinds of engineering" />
		{:else if current.key === 'places'}
			<ChipGroup options={PLACES} bind:selected={places} label="Where you can work" />
		{:else if current.key === 'seniorities'}
			<ChipGroup options={SENIORITIES} bind:selected={seniorities} label="Level" />
		{:else if current.key === 'industries'}
			<div class="grid gap-3 sm:grid-cols-2" role="group" aria-label="Industries">
				{#each CATEGORIES.filter((c) => c.kind === 'industry') as industry (industry.slug)}
					{@const on = industries.includes(industry.slug)}
					<button
						type="button"
						aria-pressed={on}
						class="flex items-start gap-3 rounded-xl border p-3.5 text-left transition sm:p-4 {on
							? 'border-send-green bg-send-green/5 ring-1 ring-send-green dark:bg-send-green/10'
							: 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500'}"
						on:click={() =>
							(industries = on
								? industries.filter((slug) => slug !== industry.slug)
								: [...industries, industry.slug])}
					>
						<span
							class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full {industry.dot}"
							aria-hidden="true"
						/>
						<span class="min-w-0">
							<span class="block font-semibold text-slate-900 dark:text-white">{industry.name}</span
							>
							<span class="mt-0.5 block text-sm text-slate-500 dark:text-slate-400"
								>{industry.blurb}</span
							>
						</span>
					</button>
				{/each}
			</div>
		{:else if current.key === 'stages'}
			<ChipGroup options={COMPANY_KINDS} bind:selected={stages} label="Kind of company" />
		{:else}
			<div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Minimum salary">
				{#each SALARIES as amount}
					<button
						type="button"
						role="radio"
						aria-checked={minSalary === amount}
						class="rounded-full px-3 py-1 text-sm font-semibold transition {minSalary === amount
							? 'bg-dark-beach-black text-white dark:bg-white dark:text-slate-900'
							: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}"
						on:click={() => (minSalary = amount)}>{amount ? `£${amount}k+` : 'Any'}</button
					>
				{/each}
			</div>
		{/if}
	</div>

	<div
		class="pb-safe sticky bottom-0 z-20 -mx-4 mt-8 flex items-center gap-3 border-t border-slate-200 bg-canvas/95 px-4 pt-3 backdrop-blur dark:border-slate-700 dark:bg-canvas-dark/95 sm:static sm:mx-0 sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:dark:bg-transparent"
	>
		{#if !answered}
			<span class="text-xs text-slate-400 sm:hidden">Pick at least one</span>
		{/if}
		{#if step > 0}
			<button
				type="button"
				class="px-2 py-3 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white sm:px-3 sm:py-2"
				on:click={() => step--}>← Back</button
			>
		{/if}
		{#if !current.required && !last}
			<button
				type="button"
				class="ml-auto px-3 py-3 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white sm:py-2"
				on:click={next}>Skip</button
			>
		{/if}
		<button
			type="button"
			disabled={!answered}
			class="{!current.required && !last
				? ''
				: 'ml-auto'} btn3d btn3d-primary"
			on:click={next}
		>
			<span>{last ? 'Show my roles' : 'Continue'}</span>
		</button>
	</div>
	{#if !answered}
		<p class="mt-3 hidden text-right text-xs text-slate-400 sm:block">
			Pick at least one to continue.
		</p>
	{/if}
	<p class="mt-10 text-xs text-slate-400">
		{#if $account.status === 'signed-in'}
			Saved to your account.
		{:else}
			Saved in this browser.
			<a href="/login" class="font-semibold text-send-green hover:underline">Sign in</a> to sync devices.
		{/if}
	</p>
</section>
