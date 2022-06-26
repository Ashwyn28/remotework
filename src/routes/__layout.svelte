<script lang="ts">
	import Header from '$lib/header/Header.svelte';
	import '../app.css';
</script>

<main class="dark:bg-slate-800">
	<Header />
	<slot />
</main>

<style>
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		padding-bottom: 4rem;
		width: 100%;
		padding-left: 10%;
		padding-right: 10%;
		margin: 0 auto;
		box-sizing: border-box;
	}

	@media only screen and (max-width: 428px) {
		main {
			flex: 1;
			display: flex;
			flex-direction: column;
			padding: 1rem;
			width: 100%;
			max-width: 100%;
			margin: 0 auto;
			box-sizing: border-box;
		}
	}
</style>
