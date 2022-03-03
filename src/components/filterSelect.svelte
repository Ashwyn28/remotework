<script context="module" lang="ts">
	const handleClick = async (filter) => {
		const params = new URLSearchParams({
			category: filter
		});
		try {
			const test = await fetch('http://127.0.0.1:8000/listings/?'+ params.toString());
			if (!test.ok) {
				throw new Error(test.statusText)
			}
			const filteredListings = await test.json();
			console.log(filteredListings);
		} catch (error) {
			console.log(error)
		}
	};
</script>

<script>
	export let filters;
</script>

<div class="my-4 border-solid border-2 border-blue-500 px-4 py-2">
	<div class="flex justify-between">
		{#each filters as filter (filter)}
		<button on:click="{handleClick(filter)}">{filter}</button>
		{/each}
	</div>
</div>
