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



<div class="p-1 shadow-xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 rounded-2xl">
    <a class="block p-6 bg-white sm:p-8 rounded-xl" href="">
      <div class="mt-16 sm:pr-8">
        <h5 class="text-xl font-bold text-gray-900">{listing.company_name}</h5>
  
        <p class="mt-2 text-sm text-gray-500">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ad, adipisci.
        </p>
      </div>
    </a>
  </div>