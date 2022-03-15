<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	import { getListings } from './_api';

	export const load: Load = async () => {
		const listings = await getListings('listings');
		const premium = await getListings('api/premium/');

		return {
			props: { listings, premium }
		};
	};
</script>

<script>
	import Listing from '../components/listing.svelte';
	import FeaturedListing from '../components/featuredListing.svelte';
	import SelectFilter from '../components/filterSelect.svelte';
	import { filter } from '$lib/store';

	export let listings;
	export let premium;

	// add endpoint to fetch filters
	// generate filters using faker and save to db
	// fetch filters
	// or store a static list of filters 
	// -> filter set needs to be one-to-one to all listing categories
	// how to make sure this is always true
	// -> query all filters by filtering listings with distinct categories
	// 		-> needs to be fast/efficient
	// 		-> should only contain filters with a minimum number of listings
	let filters = [{ name: 'food', id: 1, type: 'engineering' }];

	const filterListings = async (filter) => {
		const params = new URLSearchParams({
			category: filter.category.name
		});
		
		if (!filter.selected) {
			// reset listings
			listings = await getListings('listings');
			return;
		};
		listings = await getListings('listings/?' + params.toString());
	};

	// reactively update listings
	$: filterListings($filter);
</script>

<div>
	<!-- Premium listings -->
	<div class="flex justify-between">
		{#each premium.results as listing}
			<span class="py-2">
				<FeaturedListing listing={listing.job_title} />
			</span>
		{/each}
	</div>
	<!-- Filters -->
	<SelectFilter {filters} />
	<!-- Listings -->
	{#each listings.results as listing}
		<div class="py-2">
			<Listing listing={listing.job_title} />
		</div>
	{/each}
</div>
