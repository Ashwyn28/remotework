<script lang="ts">
	import type { Company } from '$lib/board';

	export let company: Company;
	export let size: 'sm' | 'md' | 'lg' = 'md';

	const palette = [
		'bg-sky-600',
		'bg-emerald-600',
		'bg-violet-600',
		'bg-rose-600',
		'bg-amber-600',
		'bg-teal-600',
		'bg-indigo-600',
		'bg-fuchsia-600'
	];
	const sizes = {
		sm: 'h-7 w-7 text-xs',
		md: 'h-11 w-11 text-sm',
		lg: 'h-14 w-14 text-lg'
	};

	let failed = false;

	$: initials = company.name
		.split(/\s+/)
		.slice(0, 2)
		.map((w) => w.charAt(0).toUpperCase())
		.join('');
	$: color =
		palette[[...company.name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palette.length];
</script>

{#if company.logo && !failed}
	<img
		src={company.logo}
		alt="{company.name} logo"
		class="{sizes[size]} shrink-0 rounded-lg bg-white object-contain p-1 ring-1 ring-slate-200 dark:ring-slate-600"
		on:error={() => (failed = true)}
	/>
{:else}
	<span
		class="{sizes[
			size
		]} {color} shrink-0 rounded-lg flex items-center justify-center font-bold text-white select-none"
		aria-hidden="true">{initials}</span
	>
{/if}
