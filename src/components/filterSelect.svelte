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

<div class="my-4 px-4 pb-2 pt-6">
	<div class="flex">
		<button class="text-beach-black py-4 font-bold text-xl mr-5 hover:underline">Jobs</button>
		<button class="py-4 font-bold text-slate-400 text-xl hover:underline">Companies</button>
	</div>
	<div class="flex">
		<span>
			{#each filters as filter (filter)}
				<button
					class={setCategoryColor(filter.name, true, false) +
						' w-24 rounded text-center text-sm text-white px-4 mx-2'}
					on:click={() => handleSelection(filter.name, filter.id, filter.type)}
					>{filter.name}</button
				>
			{/each}
		</span>
		<span class="ml-auto">
			<button
				class="w-24 rounded-full text-center text-beach-black text-base font-bold px-4 mx-2"
				on:click={handleReset}>Reset</button
			>
		</span>
	</div>
</div>
