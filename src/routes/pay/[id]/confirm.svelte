<script>
	import { paymentStates } from '$lib/store';
	import { getListings } from '../../_api';
	import Listing from '../../../components/listing.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	const stripeUrl = 'https://js.stripe.com/v3/';
	const checkoutUrl = '/Users/ashwynannauth/remotework/src/routes/pay/checkout.js';
	let listing;

	paymentStates.setWithLocalStorage({ pageNum: 2 });

	onMount(async () => {
		const params = new URLSearchParams({
			pk: $page.params.id
		});
		listing = await getListings('listings/?' + params.toString());
	});

	// need to check that listing object has been created
	// then update the state and show stripe payment intent

	// how to check that listing is being created
	// need to add states to the listing model
	// created
	// confirmed
	// paid

	// TODO:
	// prevent viewing of other lisitngs
	
</script>

<svelte:head>
	<script src={stripeUrl}></script>
	<script src={checkoutUrl} defer></script>
</svelte:head>

<div class="flex flex-col">
	<div class="py-2">
		{#if listing}
			<Listing listing={listing.results[0]} />
		{/if}
	</div>
	<div class="flex flex-row pt-12">
		<div class="basis-3/4 rounded m-2">
			<div class="p-4 dark:text-white">
				<div class="font-bold">Breakdown</div>
				<br />
				<div class="pl-4">Price: £100</div>
				<br />
				<div class="pl-4">Total: £100</div>
			</div>
		</div>
		<div class="ml-auto basis-1/4 py-2">
			<span class="text-beach-black py-4 font-bold text-xl mr-5 hover:underline dark:text-white"
				>Add your listing to the board</span
			>
			<form id="payment-form">
				<div id="payment-element">
					<!--Stripe.js injects the Payment Element-->
				</div>
				<div class="pt-4">
					<button
						id="submit"
						class="px-4 py-1 bg-black text-white hover:text-black hover:bg-white rounded invisible sm:visible text-sm font-semibold hover:ring-2 hover:ring-black"
					>
						<div class="spinner hidden" id="spinner" />
						<span id="button-text">Pay now</span>
					</button>
				</div>
				<div id="payment-message" class="hidden" />
			</form>
		</div>
	</div>
</div>
