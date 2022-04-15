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
	import { setCategoryColor } from '$lib/colors';
	import { browser } from '$app/env';

	export let listings;
	export let premium;

	const mobileWidth = 428;
	let scrollY;
	let innerWidth;
	if (browser) {
		height.set({
			default: window.innerHeight,
			updated: window.innerHeight
		});
	}
	let nextListings;

	// FILTER IMPLEMENTATION
	// store a static list of filters
	// -> filter set needs to be one-to-one to all listing categories
	// how to make sure this is always true
	//  -> only have a specific set of categories (dropdown)
	// from which you can choose

	let filters = [
		{ name: 'food', id: 1, type: 'engineering' },
		{ name: 'American.', id: 1, type: 'engineering' },
		{ name: 'Stuff.', id: 1, type: 'engineering' },
		{ name: 'Morning.', id: 1, type: 'engineering' }
	];

	// pagination fix: make sure pages gets loaded sequentially
	// -> or set scrollY to top on reload

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

	// color control
	// -> array of colours for premium listings
	// color should be set by business
	let colors = {
		default: 'bg-white',
		amber: 'bg-amber-100',
		yellow: 'bg-yellow-50',
		lime: 'bg-lime-50',
		green: 'bg-green-200',
		emerald: 'bg-emerald-50',
		sky: 'bg-sky-200',
		rose: 'bg-rose-200'
	};
</script>

<svelte:window bind:scrollY bind:innerWidth />
<div>
	<!-- Premium listings (desktop)-->
	{#if innerWidth >= mobileWidth}
		<div class="flex justify-between">
			{#each premium.results as listing}
				<span class="py-2">
					<FeaturedListing {listing} color={colors.default} />
				</span>
			{/each}
		</div>
	{/if}
	<!-- Filters -->
	<SelectFilter {filters} />
	<!-- Premium listings (mobile) -->
	{#if innerWidth <= mobileWidth}
		{#each premium.results as listing}
			<div class="py-2">
				<Listing {listing} color={setCategoryColor(listing.job_title)} />
			</div>
		{/each}
	{/if}
	<!-- Listings -->
	{#each listings.results as listing}
		<div class="py-2">
			<Listing {listing} color={colors.default} />
		</div>
	{/each}
</div>
