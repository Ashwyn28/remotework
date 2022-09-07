<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	import { getListings, nextPage } from './_api';

	export const load: Load = async () => {
		const listings = await getListings('listings');
		const premium = await getListings('api/premium/');
		const companies = await getListings('companies');
		return {
			props: { listings, premium, companies }
		};
	};
</script>

<script>
	import { browser } from '$app/env';
	import { setCategoryColor } from '$lib/colors';
	import { filter, filters, height } from '$lib/store';
	import CompanyListing from '../components/companyListing.svelte';
	import FeaturedListing from '../components/featuredListingv2.svelte';
	import SelectFilter from '../components/filterSelect.svelte';
	import Hero from '../components/hero.svelte';
	import Listing from '../components/listing.svelte';

	export let listings;
	export let premium;
	export let companies;

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

	let view = 'listings';
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

	// TODO
	// ----
	// create companies component -- done
	// add pagination to companies section
</script>

<svelte:window bind:scrollY bind:innerWidth />
<div>
	<Hero />
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
		<SelectFilter
			{filters}
			on:showCompanies={() => (view = 'companies')}
			on:showListings={() => (view = 'listings')}
		/>
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
	{#if view == 'listings'}
		{#each listings.results as listing}
			<div class="py-2">
				<Listing
					{listing}
					basicColor={colors.gray}
					premiumColor={setCategoryColor(listing.job_title, true, false)}
				/>
			</div>
		{/each}
	{/if}
	{#if view == 'companies'}
		{#each companies.results as company}
			<div class="py-2">
				<CompanyListing {company} />
			</div>
		{/each}
	{/if}
	<div class="pt-6 flex justify-end px-4">
		{#if !endOfListings}
			<button
				class="rounded-full text-center text-beach-black text-base font-bold px-4 mx-2 dark:text-white"
				on:click={handlePagination}>Next Page</button
			>
		{/if}
	</div>
</div>
