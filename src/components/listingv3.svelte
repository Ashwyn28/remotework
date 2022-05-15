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

<a href="" class="relative block group h-28 ">
    <span class="absolute inset-0 border-2 border-black border-dashed rounded-lg"></span>
  
    <div
      class={'bg-light-sand-green relative flex items-end h-full transition-transform transform rounded-lg border-2 group-hover:-translate-x-2 group-hover:-translate-y-2 border-black'}
    >
      <div class="px-6 pb-6 transition-opacity group-hover:absolute w-full">
        <div class="flex justify-between">
            <div class="flex">
                <div class="w-16 h-16 rounded-full flex justify-center items-center">
                    {#if listing.profile_url }
                        <img src={listing.profile_url} alt="profile url" />
                    {:else}
                        <p>404</p>
                    {/if}
                </div>
                <div class="flex flex-col justify-center ml-10 text-black"
                >
                    <span class="text-sm sm:text-lg">{listing.company_name}</span>
                    <span class="font-semibold text-sm sm:text-lg">{listing.job_title}</span>
                </div>
                <div class="flex flex-col justify-center ml-10 text-black">
                    <span class="py-1">
                        <div class={" bg-slate-300 px-4 rounded text-center text-sm "}>
                            $30K - 50K 
                        </div>
                    </span>
                </div>
                <div class="flex flex-col justify-center ml-5">
                    <span class="py-1">
                        <div class={setCategoryColor(listing.category, true, false) + " w-24 rounded text-center text-white text-sm "}>
                            {listing.category}
                        </div>
                    </span>
                </div>
            </div>
            <div class="flex flex-col justify-center">
                <div class="flex justify-end">
                    <button class="px-4  py-1 bg-red-500 text-white hover:text-red-500 hover:bg-white rounded invisible sm:visible text-lg font-semibold hover:ring-2 hover:ring-red-500">Apply</button>
                </div>
            </div>
        </div>
      </div>
<!--   
      <div class="absolute p-8 transition-opacity w-full opacity-0 group-hover:opacity-100 group-hover:relative flex flex-col justify-cente">
        <div class="flex justify-end">
                <button class="px-4  py-1 bg-red-500 text-white hover:text-red-500 hover:bg-white rounded invisible sm:visible text-lg font-semibold hover:ring-2 hover:ring-red-500">Apply</button>
        </div>
      </div> -->
    </div>
  </a>