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

<svelte:head>
	<script src="https://kit.fontawesome.com/4c5b5990de.js" crossorigin="anonymous"></script>
</svelte:head>
<header class="flex p-4">
	<div class="ml-auto">
		{#if $page.url.pathname === '/listings'}
			<a href="listing/post/">
				<button
					class="px-4 py-1 bg-send-green text-white hover:text-send-green hover:bg-white dark:hover:bg-slate-800 rounded invisible sm:visible text-lg font-semibold hover:ring-2 hover:ring-send-green"
					>Post</button
				>
			</a>
		{/if}
		<button
			class="text-xl dark:text-white pl-4"
			on:click={() => {
				toggleDarkMode((darkMode = !darkMode));
			}}>
			{#if darkMode}
				<i class="fa-solid fa-moon" />
			{:else}
				<i class="fa-solid fa-sun" />
			{/if}
			</button
		>
	</div>
</header>
