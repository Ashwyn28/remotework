<script>
	import { setCategoryColor } from "$lib/colors"
	export let listing;
	export let color = null;
</script>

<a class="block h-56 w-48 group" href="/blog">
    <div
      class={"bg-light-sand-green  relative flex items-end h-full transition border-0 border-black group-hover:-translate-x-0 group-hover:-translate-y-0 rounded-lg group-hover:shadow-[0px_0px_0_0_#000] p-8"}
    >
      <div class="lg:group-hover:opacity-0 lg:group-hover:absolute">
        <span class="text-3xl sm:text-4xl" role="img" aria-hidden="true"></span>
        <p class="mt-4 text-lg font-bold sm:text-xl text-black">{listing.company_name}</p>
      </div>
  
      <div
        class="absolute opacity-0 lg:group-hover:opacity-100 lg:group-hover:relative"
      >
        <p class="text-lg text-black font-bold">View More</p>
  
        <p class="mt-4 text-lg font-medium leading-relaxed">
        </p>
      </div>
    </div>
  </a>