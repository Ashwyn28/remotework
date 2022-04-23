<script>
	import { setCategoryColor } from "$lib/colors"
	export let listing;
	export let color = null;
</script>

<div class={'rounded ' + color }>
	<div class="flex justify-between h-48">
		{#if listing.profile_url}
			<img src={listing.profile_url} alt="profile url" />
		{:else}
			<p>404</p>
		{/if}
	</div>
	<div class={"rounded-b flex flex-col h-48 md:w-48 "}>
		<div class="truncate">{listing.job_title}</div>
		<div class="truncate">{listing.description}</div>
		<div class="mt-auto">
			<button class="px-4 py-1 text-sm rounded">Apply</button>
		</div>
	</div>
</div>
