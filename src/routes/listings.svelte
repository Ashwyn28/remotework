<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	import { getListings, nextPage } from './_api';

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
	import { filter, height } from '$lib/store';
	import { browser } from '$app/env';

	export let listings;
	export let premium;

	let scrollY;
	if (browser) {
		height.set({
			default: window.innerHeight,
			updated: window.innerHeight
		});
	}
	let nextListings;

	// store a static list of filters
	// -> filter set needs to be one-to-one to all listing categories
	// how to make sure this is always true
	//  -> only have a specific set of categories (dropdown)
	// from which you can choose

	let filters = [
		{ name: 'food', id: 1, type: 'engineering' },
		{ name: 'American.', id: 1, type: 'engineering' }
	];

	const handlePagination = async (scrollY) => {
		if (!listings.next) {
			return;
		}
		if (scrollY >= $height.updated - 200) {
			// update listings
			nextListings = await nextPage(listings.next);
			nextListings.results.map((l) => {
				listings.results.push(l);
			});
			nextListings.results = listings.results;
			listings = nextListings;

			// increment window height
			$height.updated += $height.default;
		}
	};

	const filterListings = async (filter) => {
		const params = new URLSearchParams({
			category: filter.category.name
		});
		listings = await getListings('listings/?' + params.toString());
	};

	const resetListings = async () => {
		listings = await getListings('listings');
	};

	// reactively update listings
	$: if ($filter.selected) {
		filterListings($filter);
		height.reset();
	}
	$: if (!$filter.selected) {
		resetListings();
		height.reset();
	}
	$: handlePagination(scrollY);
</script>

<svelte:window bind:scrollY />
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
			<Listing {listing} />
		</div>
	{/each}
</div>
