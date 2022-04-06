<script>
	export let listing;
	export let color = null;

	let showFullListing = false;

	const handleSelection = () => {
		showFullListing = !showFullListing;
	};
</script>

<div
	class={'rounded p-4 ' + color}
	on:click={handleSelection}
>
	{#if showFullListing}
		<div class="h-full">
			<div>
				<img src={listing.profile_url} alt="profile url">
			</div>
			<div>{listing.job_title}</div>
			<div>{listing.company_name}</div>
			<div>{listing.description}</div>
			<div>{listing.category}</div>
			<div>{listing.salary}</div>
			<div>{listing.region}</div>
		</div>
	{:else}
		<div class="h-16">
			<div class="h-full flex justify-between">
				<div class="flex flex-col">
					<span>{listing.company_name}</span>
					<span class="font-bold">{listing.job_title}</span>
					<span>{listing.category}</span>
				</div>
				<div class="flex flex-col justify-center">
					<button class="px-4 py-1 text-sm bg-green-400 text-white rounded">Apply</button>
				</div>
			</div>
		</div>
	{/if}
</div>
