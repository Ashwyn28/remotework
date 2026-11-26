<script lang="ts">
	import { STAGES, WORK_MODES } from '$lib/board';
	import type { Filters, Stage, WorkMode } from '$lib/board';
	import ChipGroup from './chipGroup.svelte';

	export let filters: Filters;
	export let center = false;
	/** stage chips to offer; pass only stages that exist in the data */
	export let stageOptions = STAGES;
	/** phones: keep every chip on one swipeable row instead of wrapping */
	export let swipe = false;

	let modes: string[] = filters.modes;
	let stages: string[] = filters.stages;
	$: filters = { modes: modes as WorkMode[], stages: stages as Stage[] };
</script>

<div
	class="flex items-center gap-x-5 gap-y-2 {center ? 'justify-center' : ''} {swipe
		? 'no-scrollbar fade-right -mx-4 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0'
		: 'flex-wrap'}"
>
	<ChipGroup
		options={WORK_MODES}
		bind:selected={modes}
		label="Filter by working arrangement"
		{swipe}
	/>
	{#if stageOptions.length > 1}
		<ChipGroup
			options={stageOptions}
			bind:selected={stages}
			label="Filter by company stage"
			{swipe}
		/>
	{/if}
</div>
