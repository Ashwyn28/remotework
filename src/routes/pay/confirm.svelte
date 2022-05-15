<script>
	const stripeUrl = "https://js.stripe.com/v3/";
    const checkoutUrl = "/Users/Ashwyn/Documents/GitHub/remotework/src/routes/pay/checkout.js"
</script>

<svelte:head>
  <script src={stripeUrl} />
  <script src={checkoutUrl} defer />
</svelte:head>

<div>
    <h1>Confirm payment</h1>
    <form action="http://127.0.0.1:8000/pay/" method="POST">
        <button type="submit">Checkout</button>
    </form>
</div>

<div>
	<form id="payment-form">
		<div id="payment-element">
			<!--Stripe.js injects the Payment Element-->
		</div>
		<button id="submit">
			<div class="spinner hidden" id="spinner" />
			<span id="button-text">Pay now</span>
		</button>
		<div id="payment-message" class="hidden" />
	</form>
</div>
