<script context="module" lang="ts">
	import { filter } from '$lib/store';

	const handleSelection = (name, id, type) => {
		filter.isSelected(true);
		filter.setCategory({ id: id, type: type, name: name });
	};

	const handleReset = () => {
		filter.reset()
	};
</script>

<script>
	export let filters;
</script>

<div class="my-4 border-solid border-2 border-blue-500 px-4 py-2">
	<div class="flex justify-between">
		{#each filters as filter (filter)}
			<button on:click={() => handleSelection(filter.name, filter.id, filter.type)}
				>{filter.name}</button
			>
		{/each}
		<button on:click={handleReset}>Reset</button>
	</div>
</div>
