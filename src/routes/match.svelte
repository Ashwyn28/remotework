<script lang="ts">
	import { browser } from '$app/env';
	import { goto } from '$app/navigation';
	import Onboarding from '../components/onboarding.svelte';

	// answering is optional: anyone can back out to the roles
	const cancellable = true;
</script>

<svelte:head>
	<title>Personalise your feed · orbbits job</title>
</svelte:head>

{#if browser}
	<Onboarding {cancellable} on:done={() => goto('/')} on:cancel={() => goto('/')} />
{/if}
