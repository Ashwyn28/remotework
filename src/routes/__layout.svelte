<script lang="ts">
	import { page } from '$app/stores';
	import Header from '$lib/header/Header.svelte';
	import { onMount } from 'svelte';
	import { startAccount } from '$lib/account';
	import '../app.css';

	onMount(startAccount);

	// everyone lands on the roles; the questions at /match are an optional way to personalise.
	// The agent fills the screen below the header.
	$: path = $page.url.pathname;
	$: bare = path === '/agent' || path.startsWith('/agent/');
</script>

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
		<slot />
	</main>
</div>
{/if}
