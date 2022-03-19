<script>
	export let listing;

	let showFullListing = false;

	const handleSelection = () => {
		showFullListing = !showFullListing;
	};
</script>

<div
	class="border-solid border-2 border-blue-500 p-4 hover:bg-rose-400 hover:border-rose-400 hover:text-white"
	on:click={handleSelection}
>
	{#if showFullListing}
		<div class="h-full">
			<div>{listing.job_title}</div>
			<div>{listing.company_name}</div>
      <div>{listing.description}</div>
      <div>{listing.category}</div>
      <div>{listing.salary}</div>
      <div>{listing.region}</div>
		</div>
	{:else}
		<div class="flex justify-between">
			<div>{listing.job_title}</div>
			<div>
				<button>Apply</button>
			</div>
		</div>
	{/if}
</div>
