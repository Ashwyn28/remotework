<script>
	export let listing;
	export let color = null;
	import { setCategoryColor } from "$lib/colors";

	let showFullListing = false;

	const handleSelection = () => {
		showFullListing = !showFullListing;
	};
</script>

<div class={'rounded px-4 py-2 ' + color } on:click={handleSelection}>
	{#if showFullListing}
		<div class="h-full">
			<div>
				<img src={listing.profile_url} alt="profile url" />
			</div>
			<div>{listing.job_title}</div>
			<div>{listing.company_name}</div>
			<div>{listing.description}</div>
			<div>{listing.category}</div>
			<div>{listing.salary}</div>
			<div>{listing.region}</div>
		</div>
	{:else}
		<div class="h-full">
			<div class="flex justify-between">
				<div class="flex">
					<div class="w-16 h-16 rounded-full flex justify-center items-center">
						{#if listing.profile_url }
							<img src={listing.profile_url} alt="profile url" />
						{:else}
							<p>404</p>
						{/if}
					</div>
					<div class="flex flex-col ml-10">
						<span class="text-gray-500 text-sm sm:text-base">{listing.company_name}</span>
						<span class="font-bold text-sm sm:text-base">{listing.job_title}</span>
						<span class="py-1">
							<div class={setCategoryColor(listing.category) + " w-24 rounded-full text-center text-sm "}>
								{listing.category}
							</div>
						</span>
					</div>
				</div>
				<div class="flex flex-col justify-center">
					<button class="px-4 py-1 text-sm bg-green-400 text-white rounded invisible sm:visible">Apply</button>
				</div>
			</div>
		</div>
	{/if}
</div>
