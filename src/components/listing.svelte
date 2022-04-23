<script>
	export let listing;
	export let basicColor = null;
	export let premiumColor = null;
	import { setCategoryColor } from "$lib/colors";

	let showFullListing = false;
	let setTextWhite = false

	const handleSelection = () => {
		showFullListing = !showFullListing;
	};

	let color = listing.premium ? premiumColor : basicColor
	if (premiumColor && listing.premium) {
		setTextWhite = premiumColor.includes('dark')
	}
</script>

<div class={'rounded px-4 py-2 ' + color } on:click={handleSelection}>
	{#if showFullListing}
		<div class="h-full"
		class:text-white={setTextWhite}>
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
					<div class="flex flex-col justify-center ml-10 "
					class:text-white={setTextWhite}
					>
						<span class="text-sm sm:text-lg">{listing.company_name}</span>
						<span class="font-semibold text-sm sm:text-lg">{listing.job_title}</span>
					</div>
					<div class="flex flex-col justify-center ml-10 ">
						<span class="py-1">
							<div class={" bg-slate-300 px-4 rounded text-center text-sm "}>
								$30K - 50K 
							</div>
						</span>
					</div>
					<div class="flex flex-col justify-center ml-5">
						<span class="py-1">
							<div class={setCategoryColor(listing.category) + " w-24 rounded text-center text-white text-sm "}>
								{listing.category}
							</div>
						</span>
					</div>
				</div>
				<div class="flex flex-col justify-center">
					<button class="px-4 py-1 bg-red-500 text-white hover:text-red-500 hover:bg-white rounded invisible sm:visible text-lg font-semibold hover:ring-2 hover:ring-red-500">Apply</button>
				</div>
			</div>
		</div>
	{/if}
</div>
