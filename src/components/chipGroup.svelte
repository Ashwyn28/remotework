<script lang="ts">
	/** Toggle chips; any number can be on at once. */
	export let options: { value: string; label: string }[];
	export let selected: string[] = [];
	export let label: string;
	/** keep the chips on one line, inside a row that scrolls sideways on phones */
	export let swipe = false;

	// roomier on phones, so each chip is an easy tap
	const base = 'rounded-full px-3.5 py-2 text-sm font-semibold transition sm:px-3 sm:py-1';
	const off =
		'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600';
	const on = 'bg-dark-beach-black text-white dark:bg-white dark:text-slate-900';

	const toggle = (value: string) =>
		(selected = selected.includes(value)
			? selected.filter((v) => v !== value)
			: [...selected, value]);
</script>

<div
	class="flex gap-2 {swipe ? 'shrink-0 flex-nowrap sm:flex-wrap' : 'flex-wrap'}"
	role="group"
	aria-label={label}
>
	{#each options as option (option.value)}
		<button
			type="button"
			class="{base} shrink-0 whitespace-nowrap {selected.includes(option.value) ? on : off}"
			aria-pressed={selected.includes(option.value)}
			on:click={() => toggle(option.value)}>{option.label}</button
		>
	{/each}
</div>
