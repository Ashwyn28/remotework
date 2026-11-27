<script lang="ts">
	import { browser } from '$app/env';
	import { page } from '$app/stores';
	import Header from '$lib/header/Header.svelte';
	import { onMount } from 'svelte';
	import { startAccount } from '$lib/account';
	import { isOnboarded } from '$lib/board';
	import { preferences } from '$lib/personal';
	import Onboarding from '../components/onboarding.svelte';
	import '../app.css';

	// /match is the questions page itself; /login and /account are about the visitor, not listings
	const UNGATED = ['/match', '/login', '/account', '/agent'];

	onMount(startAccount);

	$: path = $page.url.pathname;
	// the agent fills the screen below the header and asks its own questions, so no onboarding gate
	$: bare = path === '/agent' || path.startsWith('/agent/');
	$: gated = !UNGATED.some((p) => path === p || path.startsWith(`${p}/`));
	$: onboarded = isOnboarded($preferences);
</script>

<svelte:head>
	{#if gated && browser && !onboarded}
		<title>Find your next role · orbbits job</title>
	{/if}
</svelte:head>

{#if bare}
	<!-- the agent: the board's header, then a full-height conversation -->
	<div class="flex h-screen flex-col bg-slate-50 dark:bg-slate-800">
		<div class="mx-auto w-full max-w-5xl shrink-0 px-4 sm:px-6">
			<Header />
		</div>
		<slot />
	</div>
{:else}
<div class="flex flex-1 flex-col bg-slate-50 dark:bg-slate-800">
	<main class="mx-auto w-full max-w-5xl px-4 pb-28 sm:px-6 sm:pb-16">
		<Header />
		{#if !gated}
			<slot />
		{:else if !browser}
			<!-- answers live in the browser, so the server cannot know them; render nothing yet -->
			<div class="py-16" aria-hidden="true" />
		{:else if !onboarded}
			<Onboarding />
		{:else}
			<slot />
		{/if}
	</main>
</div>
{/if}
