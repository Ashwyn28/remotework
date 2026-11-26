<script lang="ts">
	import type { CategorySummary } from '$lib/board';
	import Avatar from './avatar.svelte';

	export let summary: CategorySummary;

	$: ({ category, companies, roles, leaders } = summary);
</script>

<a
	href="/category/{category.slug}"
	class="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:no-underline dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500"
>
	<div class="flex items-center gap-2">
		<span class="h-2.5 w-2.5 rounded-full {category.dot}" />
		<span class="text-lg font-bold text-slate-900 dark:text-white">{category.name}</span>
		<span
			class="ml-auto text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-200"
			aria-hidden="true">→</span
		>
	</div>
	{#if category.blurb}
		<span class="mt-2 text-sm text-slate-500 dark:text-slate-400">{category.blurb}</span>
	{/if}
	<div class="mt-auto flex items-center pt-5">
		<div class="flex -space-x-1">
			{#each leaders as company (company.id)}
				<span class="rounded-lg ring-2 ring-white dark:ring-slate-900">
					<Avatar {company} size="sm" />
				</span>
			{/each}
		</div>
		<span class="ml-auto text-xs font-medium text-slate-500 dark:text-slate-400">
			{companies}
			{companies === 1 ? 'company' : 'companies'} · {roles}
			{roles === 1 ? 'role' : 'roles'}
		</span>
	</div>
</a>
