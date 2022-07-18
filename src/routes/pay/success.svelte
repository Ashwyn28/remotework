<script lang="ts">
	import { paymentStates, currentPaidForListingId } from '$lib/store';
	import { onMount } from 'svelte';
	import { VIEWS } from '$lib/constants';
	import { goto } from '$lib/utils';

	const pageNum = parseInt(paymentStates.subscribeToLocalStorage());
	const stripeUrl = 'https://js.stripe.com/v3/';

	setTimeout(() => {
		paymentStates.setWithLocalStorage({ pageNum: 0, state: 'completed' });
	}, 30000);

	onMount(async () => {
		const checkStatus = async (): Promise<string> => {
			const stripe = Stripe(
				'pk_test_51KorhFFA3gFfYKpYx1kR9OQhFvzsOPOVuCEwop5nRfug8OI8HBk0W6ovZBsNBnar7b6SyGc80Ei6a983cXZOYDrf00Mv6DLJ3o'
			);
			const clientSecret = new URLSearchParams(window.location.search).get(
				'payment_intent_client_secret'
			);
			if (!clientSecret) {
				return 'failed';
			}

			const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
			switch (paymentIntent.status) {
				case 'succeeded':
					console.log('Payment succeeded!');
					const response = await fetch(
						'http://127.0.0.1:8000/success/?pk=' +
							currentPaidForListingId.subscribeToLocalStorage(),
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/json' }
						}
					);
					await response.json();
					paymentStates.set({ pageNum: 3, state: 'succeeded' });
					break;
				case 'processing':
					console.log('Your payment is processing.');
					break;
				case 'requires_payment_method':
					console.log('Your payment was not successful, please try again.');
					break;
				default:
					console.log('Something went wrong.');
					break;
			}
			return paymentIntent.status;
		};
		await checkStatus();
		if (pageNum == 0) {
			goto(VIEWS[4]);
		}
	});
</script>

<svelte:head>
	<script src={stripeUrl}></script>
</svelte:head>

{#if $paymentStates.state == 'succeeded' && $paymentStates.pageNum == 3}
	<h1>Successful Payment</h1>
{/if}
