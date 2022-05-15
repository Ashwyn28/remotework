<script lang="ts">
	import Header from '$lib/header/Header.svelte';
	import '../app.css';
</script>

<Header />

<main>
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
		max-width: calc(100% - 15%);
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
