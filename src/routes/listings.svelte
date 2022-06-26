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

<!-- 
	Todo:
		-> payment logic
		-> fulllisting UI
		-> form UI
 -->
<script>
	import Listing from '../components/listing.svelte';
	import FeaturedListing from '../components/featuredListingv2.svelte';
	import SelectFilter from '../components/filterSelect.svelte';
	import { filter, height, filters } from '$lib/store';
	import { setCategoryColor } from '$lib/colors';
	import { browser } from '$app/env';

	export let listings;
	export let premium;

	// color control
	// -> array of colours for premium listings
	// color should be set by business
	let colors = {
		default: 'bg-white',
		secondary: 'background-secondary',
		amber: 'bg-amber-100',
		yellow: 'bg-yellow-50',
		lime: 'bg-lime-50',
		green: 'bg-beach-green',
		gray: 'bg-light-sand-green',
		emerald: 'bg-emerald-50',
		sky: 'bg-sky-200',
		rose: 'bg-rose-200'
	};

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
	let endOfListings = false;

	// handle api queries
	//

	const getFilters = async () => {
		return await filters;
	};

	const handlePagination = async () => {
		if (!listings.next) return;

		// update listings
		nextListings = await nextPage(listings.next);
		nextListings.results.map((l) => {
			listings.results.push(l);
		});
		nextListings.results = listings.results;
		listings = nextListings;
	};

	const filterListings = async (filter) => {
		const params = new URLSearchParams({
			category: filter.category.name
		});
		listings = await getListings('listings/?' + params.toString());
	};

	const resetListings = async () => {
		listings = await getListings('listings');
		endOfListings = false;
	};

	const filters_ = getFilters();

	// update queries reactively e.g on event/store change
	$: if ($filter.selected) {
		filterListings($filter);
		height.reset();
	}
	$: if (!$filter.selected) {
		resetListings();
	}

	$: if (!listings.next) {
		endOfListings = true;
	}

	// TODO:
	// only show listings that paid=successful
</script>

<svelte:window bind:scrollY bind:innerWidth />
<div>
	<!-- Premium listings (desktop)-->
	{#if innerWidth >= mobileWidth}
		<div class="flex">
			<span class="text-beach-black py-4 font-bold text-xl mr-5 hover:underline dark:text-white"
				>New and Notable</span
			>
		</div>
		<div class="flex justify-between">
			{#each premium.results as listing}
				<span class="py-2">
					<FeaturedListing {listing} color={colors.gray} />
				</span>
			{/each}
		</div>
	{/if}
	<!-- Filters -->
	{#await filters_ then filters}
		<SelectFilter {filters} />
	{/await}
	<!-- Premium listings (mobile) -->
	{#if innerWidth <= mobileWidth}
		{#each premium.results as listing}
			<div class="py-2">
				<Listing {listing} basicColor={setCategoryColor(listing.job_title, true, false)} />
			</div>
		{/each}
	{/if}
	<!-- Listings -->
	{#each listings.results as listing}
		<div class="py-2">
			<Listing
				{listing}
				basicColor={colors.gray}
				premiumColor={setCategoryColor(listing.job_title, true, false)}
			/>
		</div>
	{/each}
	<div class="pt-6 flex justify-end px-4">
		{#if !endOfListings}
			<button
				class="rounded-full text-center text-beach-black text-base font-bold px-4 mx-2 dark:text-white"
				on:click={handlePagination}>Next Page</button
			>
		{/if}
	</div>
</div>
