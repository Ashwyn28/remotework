<script>
	import Listing from './listing.svelte';
	import { fade } from 'svelte/transition';
	import { setCategoryColor } from '$lib/colors';

	export let company;
</script>

<div
	class="rounded border-2 border-beach-black dark:border-black px-4 py-2 dark:text-white"
	transition:fade
>
	{#if company.profile_url}
		<img src={company.profile_url} alt="profile url" />
	{:else}
		<p class="dark:text-white">404</p>
	{/if}
	<div class="text-lg font-bold">
		{company.name}
	</div>
	<div class="p-4 text-slate-500">
		{company.description}
	</div>
	<div class="p-2 grid grid-cols-5">
		<span class="py-1 px-2">
			<div class={'border-2 border-slate-300 dark:border-black px-4 rounded text-center text-sm '}>
				London, UK
			</div>
		</span>
		<span class="py-1 px-2">
			<div class={'border-2 border-slate-300 dark:border-black px-4 rounded text-center text-sm '}>
				10 people
			</div>
		</span>
		<span class="py-1 px-2">
			<div class={'border-2 border-slate-300 dark:border-black px-4 rounded text-center text-sm '}>
				Information Technology
			</div>
		</span>
	</div>
	{#each company.listings as listing}
		<div class="py-2">
			<Listing {listing} premiumColor={setCategoryColor(listing.job_title, true, false)} />
		</div>
	{/each}
</div>
