<script context="module" lang="ts">
	import { browser } from '$app/env';
	import type { Load } from '@sveltejs/kit';
	import { authToken } from '../_api';

	export const load: Load = async () => {
		let data;
		if (browser) {
			const token = window.localStorage.getItem('google_token');
			if (token) {
				data = await authToken('http://127.0.0.1:8000/auth/', token);
				window.localStorage.setItem('orbbits_token', data.our_token);
			}
		}
		return {
			props: { ...data }
		};
	};
</script>

<script>
	export let first_name;
	export let email;
</script>

<div>
	{first_name}
	{email}
</div>
