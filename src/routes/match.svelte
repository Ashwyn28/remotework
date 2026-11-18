<script lang="ts">
	import { browser } from '$app/env';
	import { goto } from '$app/navigation';
	import { isOnboarded } from '$lib/board';
	import { preferences } from '$lib/personal';
	import Onboarding from '../components/onboarding.svelte';

	// people changing answers can back out; first-timers must answer before seeing roles
	const cancellable = isOnboarded($preferences);
</script>

<svelte:head>
	<title>Change your answers · orbbits job</title>
</svelte:head>

{#if browser}
	<Onboarding {cancellable} on:done={() => goto('/')} on:cancel={() => goto('/')} />
{/if}
