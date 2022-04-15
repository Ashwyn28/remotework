<script context="module" lang="ts">
	import { filter } from '$lib/store';
	import { setCategoryColor } from '$lib/colors';

	const handleSelection = (name, id, type) => {
		filter.isSelected(true);
		filter.setCategory({ id: id, type: type, name: name });
	};

	const handleReset = () => {
		filter.reset();
	};
</script>

<script>
	export let filters;
</script>

<div class="my-4 px-4 py-2">
	<div class="flex">
		<span>
			{#each filters as filter (filter)}
				<button
					class={setCategoryColor(filter.name) + ' w-24 rounded-full text-center text-sm px-4 mx-2'}
					on:click={() => handleSelection(filter.name, filter.id, filter.type)}
					>{filter.name}</button
				>
			{/each}
		</span>
		<span class="ml-auto">
			<button 
			class="w-24 rounded-full text-center text-sm px-4 mx-2"
			on:click={handleReset}>Reset</button>
		</span>
	</div>
</div>
