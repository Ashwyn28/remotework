<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	// The board now lives at "/". Kept so existing links and payment redirects still land somewhere.
	export const load: Load = async () => ({ status: 302, redirect: '/' });
</script>
