<script context="module" lang="ts">
	import { browser } from '$app/env';
	import type { Load } from '@sveltejs/kit';
	import { onMount } from 'svelte';
	import { authToken, user } from '../_api';

	export const load: Load = async () => {
		let google_user;
		if (browser) {
			// user does not exists register user and obtain google data
			const google_token = window.localStorage.getItem('google_token');
			if (google_token) {
				google_user = await authToken('http://127.0.0.1:8000/auth/', google_token);
				window.localStorage.setItem('orbbits_token', google_user.our_token);
			}
		}

		return {
			props: { ...google_user }
		};
	};
</script>

<script>
	export let user_;
	export let first_name;
	export let id;
	export let email;

	onMount(async () => {
		// grab authenticated user
		if (browser && id) {
			const our_token = window.localStorage.getItem('orbbits_token');
			if (our_token) {
				// need to get user_id
				const params = new URLSearchParams({
					pk: id
				});
				user_ = await user('user/?' + params.toString(), `Token ${our_token}`);
				if (user_.count == 0) {
					// search was unsuccesful return to business login
					window.location = '/business/dashboard';
				}
			}
		} else {
			// redirect to full sign up form
			// -- or show form on page if user is not fully registered
			window.location = '/business/nextsteps';
		}
	});
</script>

<div>Main Dashboard</div>
<div>{first_name}</div>
<div>{email}</div>
