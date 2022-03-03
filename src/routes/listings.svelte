<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ fetch }) => {
		const res = await fetch('http://127.0.0.1:8000/listings/', { mode: 'no-cors' });
		console.log(res);
		const premium = await fetch('http://127.0.0.1:8000/api/premium/', { mode: 'no-cors' });

		if (res.ok && premium.ok) {
			const listings = await res.json();
			const premiumListing = await premium.json();
			return {
				props: { listings, premiumListing }
			};
		}
		const { message } = await res.json();
		return {
			error: new Error(message)
		};
	};
</script>

<script>
	import Listing from '../components/listing.svelte';
	import FeaturedListing from '../components/featuredListing.svelte';
	import SelectFilter from '../components/filterSelect.svelte';
	import { filter } from "$lib/store.js";

	export let listings;
	export let premiumListing;
	// add endpoint to fetch filters
	let filters = ['food'];

	// store for filters -> which filters have been selected
	console.log($filter);
	filter.selected(); 
	console.log($filter);

</script>

<div>
	<div class="flex justify-between">
		{#each premiumListing.results as listing }
		<span class="py-2">
			<FeaturedListing listing="{listing.job_title}" />
		</span>
		{/each}
	</div>
	<SelectFilter {filters} />
	{#each listings.results as listing }
	<div class="py-2">
		<Listing listing="{listing.job_title}" />
	</div>
	{/each}
</div>
