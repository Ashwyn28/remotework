<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let darkMode: boolean = true;

	const handleDarkMode = () => {
		if (
			localStorage.theme === 'dark' ||
			(!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			document.documentElement.classList.add('dark');
			darkMode = true;
		} else {
			document.documentElement.classList.remove('dark');
			darkMode = false;
		}
	};

	const useSystemTheme = () => {
		localStorage.removeItem('theme');
		handleDarkMode();
	};

	const toggleDarkMode = (darkMode: boolean) => {
		if (darkMode) {
			localStorage.theme = 'dark';
		} else {
			localStorage.theme = 'light';
		}
		handleDarkMode();
	};

	onMount(() => {
		useSystemTheme();
	});
</script>

<header class="flex p-4">
	<div class="ml-auto">
		{#if $page.url.pathname === '/listings'}
			<a href="listing/post/">
				<button
					class="px-4 py-1 bg-red-500 text-white hover:text-red-500 hover:bg-white rounded invisible sm:visible text-lg font-semibold hover:ring-2 hover:ring-red-500"
					>Post</button
				>
			</a>
			<button
				on:click={() => {
					toggleDarkMode((darkMode = !darkMode));
				}}>dark mode</button
			>
		{/if}
	</div>
</header>
