<script lang="ts">
	import { setStatus, tracked } from '$lib/personal';
	import { track } from '$lib/analytics';
	import type { Source } from '$lib/analytics';
	import type { Job } from '$lib/board';

	export let jobId: string;
	/** when given, saving is counted in analytics (company and industry only) */
	export let job: Job | null = null;
	export let source: Source = 'board';

	function toggle() {
		setStatus(jobId, state ? null : 'saved');
		if (!state && job) track('role_saved', { company: job.company.name, industry: job.industry, source });
	}

	$: state = $tracked[jobId]?.status ?? null;
</script>

<button
	type="button"
	class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition sm:h-8 sm:w-8 {state
		? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800'
		: 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'}"
	aria-pressed={state !== null}
	aria-label={state ? 'Remove from saved' : 'Save role'}
	title={state === 'applied' ? 'Applied — click to stop tracking' : state ? 'Saved' : 'Save role'}
	on:click={toggle}
>
	<svg
		viewBox="0 0 24 24"
		class="h-5 w-5"
		fill={state ? 'currentColor' : 'none'}
		stroke="currentColor"
		stroke-width="2"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
	</svg>
</button>
