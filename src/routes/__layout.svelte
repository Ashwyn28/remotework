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

<!--
	One structure for every page, so moving between the board and the agent never swaps the layout
	(an if/else here kept the outgoing branch on screen when its animations were interrupted).
	The agent fills the screen below the header; board pages scroll as a normal document.
-->
<div class="flex flex-col bg-canvas dark:bg-canvas-dark {bare ? 'h-screen' : 'min-h-screen'}">
	<div class="mx-auto w-full max-w-5xl shrink-0 px-4 sm:px-6">
		<Header />
	</div>
	<main
		class={bare
			? 'flex min-h-0 flex-1 flex-col'
			: 'mx-auto w-full max-w-5xl flex-1 px-4 pb-28 sm:px-6 sm:pb-16'}
	>
		<slot />
	</main>
</div>
