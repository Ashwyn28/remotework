<script lang="ts">
	import type { Job } from '$lib/board';

	export let job: Pick<Job, 'salary' | 'salaryEstimated'>;
</script>

{#if job.salary}
	{#if job.salaryEstimated}
		<span
			class="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-dashed border-slate-300 px-1.5 py-0.5 text-[13px] font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300"
			title="Estimated from similar roles. The employer has not posted pay."
			><span class="sr-only">Estimated salary</span>{job.salary}<span
				class="text-[10px] font-bold uppercase tracking-wide text-slate-400"
				aria-hidden="true">est.</span
			></span
		>
	{:else}
		<span
			class="inline-flex items-center whitespace-nowrap rounded-md bg-emerald-50 px-1.5 py-0.5 text-[13px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
			title="Salary posted by the employer"><span class="sr-only">Salary</span>{job.salary}</span
		>
	{/if}
{/if}
