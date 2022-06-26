<script>
	import { paymentStates } from '$lib/store';
	import { onMount } from 'svelte';
    import { VIEWS } from '$lib/constants';
    import { goto } from '$lib/utils';

	const pageNum = parseInt(paymentStates.subscribeToLocalStorage());

	setTimeout(() => {
		paymentStates.setWithLocalStorage({ pageNum: 0 });
	}, 10000);

	onMount(() => {
        if (pageNum == 0) {
            goto(VIEWS[4])
        }
    });
</script>

{#if pageNum == 2}
	<h1>Successful Payment</h1>
{/if}
