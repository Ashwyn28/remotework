<script lang="ts">
	import { page } from '$app/stores';
</script>

<header class="flex p-4">
	<div class="ml-auto">
		<div class:active={$page.url.pathname === 'listing/post'}>
			<a href="listing/post/">
				<button
					class="px-4 py-1 bg-red-500 text-white hover:text-red-500 hover:bg-white rounded invisible sm:visible text-lg font-semibold hover:ring-2 hover:ring-red-500"
					>Post</button
				>
			</a>
		</div>
	</div>
</header>
