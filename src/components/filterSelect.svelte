<script context="module" lang="ts">
	import { setCategoryColor } from '$lib/colors';
	import { filter } from '$lib/store';

	const handleSelection = (name, id, type) => {
		filter.isSelected(true);
		filter.setCategory({ id: id, type: type, name: name });
	};

	const handleReset = () => {
		filter.reset();
	};
</script>

<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	export let filters;

	let activeButton = {
		listings: true,
		companies: false
	};

	const handleActiveButton = (button) => {
		if (button == 'jobs') {
			return (activeButton = {
				listings: true,
				companies: false
			});
		}
		if (button == 'companies') {
			return (activeButton = {
				listings: false,
				companies: true
			});
		}
	};
</script>

<div class="my-4 px-4 pb-2 pt-6">
	<div class="flex">
		{#if activeButton.listings}
			<button
				class="py-4 text-beach-black font-bold text-xl mr-5 hover:underline dark:text-white"
				on:click={() => {
					dispatch('showListings');
					handleActiveButton('jobs');
				}}>Jobs</button
			>
		{:else}
			<button
				class="py-4 text-slate-400 font-bold text-xl mr-5 hover:underline"
				on:click={() => {
					dispatch('showListings');
					handleActiveButton('jobs');
				}}>Jobs</button
			>
		{/if}
		{#if activeButton.companies}
			<button
				class="py-4 font-bold text-beach-black text-xl hover:underline dark:text-white"
				on:click={() => {
					dispatch('showCompanies');
					handleActiveButton('companies');
				}}>Companies</button
			>
		{:else}
			<button
				class="py-4 font-bold text-slate-400 text-xl hover:underline"
				on:click={() => {
					dispatch('showCompanies');
					handleActiveButton('companies');
				}}>Companies</button
			>
		{/if}
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
				class="w-24 rounded-full text-center text-beach-black text-base font-bold px-4 mx-2 dark:text-white"
				on:click={handleReset}>Reset</button
			>
		</span>
	</div>
</div>
