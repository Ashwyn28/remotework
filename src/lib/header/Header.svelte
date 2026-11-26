<script lang="ts">
	import { page } from '$app/stores';
	import { CATEGORIES } from '$lib/board';
	import { isOnboarded } from '$lib/board';
	import { preferences, tracked } from '$lib/personal';
	import { account } from '$lib/account';
	import { onMount } from 'svelte';

	let darkMode = true;

	const industries = CATEGORIES.filter((c) => c.kind === 'industry');

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

	const toggleDarkMode = () => {
		localStorage.theme = darkMode ? 'light' : 'dark';
		handleDarkMode();
	};

	onMount(handleDarkMode);

	$: current = $page.url.pathname.replace(/\/$/, '');
	$: savedCount = Object.keys($tracked).length;
	// nothing to browse until the visitor has answered the questions
	$: onboarded = isOnboarded($preferences);
	// the questions page has its own bottom bar (Back / Continue), so the tab bar steps aside
	$: showTabBar = onboarded && current !== '/match';
	$: accountHref = $account.status === 'signed-in' ? '/account' : '/login';
	$: accountLabel = $account.status === 'signed-in' ? 'Account' : 'Sign in';
	const tab = (active: boolean) =>
		'flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold hover:no-underline ' +
		(active ? 'text-send-green' : 'text-slate-500 dark:text-slate-400');
	const navLink = (active: boolean) =>
		'whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold transition hover:no-underline ' +
		(active
			? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
			: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700');
	const linkClass = (active: boolean) =>
		'shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition hover:no-underline sm:py-1 ' +
		(active
			? 'bg-dark-beach-black text-white dark:bg-white dark:text-slate-900'
			: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700');
</script>

<header class="border-b border-slate-200 pb-2 dark:border-slate-700 sm:pb-3">
	<div class="flex items-center gap-3 py-3">
		<a
			href="/"
			class="whitespace-nowrap text-xl font-extrabold tracking-tight text-slate-900 hover:no-underline dark:text-white"
			>orbbits <span class="text-send-green">job</span></a
		>
		<div class="ml-auto flex items-center gap-1 sm:gap-2">
			{#if onboarded}
				<!-- on phones these live in the bottom tab bar -->
				<a
					href="/"
					class="hidden sm:inline-flex {navLink(current === '')}"
					aria-current={current === '' ? 'page' : undefined}>Your roles</a
				>
				<a
					href="/saved"
					class="hidden items-center sm:inline-flex {navLink(current === '/saved')}"
					aria-current={current === '/saved' ? 'page' : undefined}
				>
					Saved{#if savedCount}<span
							class="ml-1 rounded-full bg-amber-400 px-1.5 text-xs text-slate-900"
							>{savedCount}</span
						>{/if}
				</a>
			{/if}
			<div class={showTabBar ? 'hidden sm:flex' : 'flex'}>
				{#if $account.status === 'signed-in'}
					<a
						href="/account"
						class="flex h-9 w-9 items-center justify-center rounded-full bg-send-green text-sm font-bold text-white hover:no-underline"
						title="Your account ({$account.user.email})"
						aria-label="Your account"
						>{($account.user.name || $account.user.email).charAt(0).toUpperCase()}</a
					>
				{:else if $account.status === 'signed-out'}
					<a href="/login" class={navLink(current === '/login')}>Sign in</a>
				{/if}
			</div>
			<button
				class="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 sm:h-8 sm:w-8"
				aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
				on:click={toggleDarkMode}
			>
				<svg
					viewBox="0 0 24 24"
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					{#if darkMode}
						<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
					{:else}
						<circle cx="12" cy="12" r="4" />
						<path
							d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
						/>
					{/if}
				</svg>
			</button>
		</div>
	</div>
	{#if onboarded}
		<nav
			class="no-scrollbar fade-right -mx-4 flex items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
			aria-label="Industries"
		>
			{#each industries as c (c.slug)}
				<a
					href="/category/{c.slug}"
					class={linkClass(current === `/category/${c.slug}`)}
					aria-current={current === `/category/${c.slug}` ? 'page' : undefined}>{c.name}</a
				>
			{/each}
		</nav>
	{/if}
</header>

{#if showTabBar}
	<!-- phones: the main sections, always one thumb away -->
	<nav
		class="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:hidden"
		aria-label="Main"
	>
		<div class="mx-auto grid max-w-md grid-cols-3">
			<a href="/" class={tab(current === '')} aria-current={current === '' ? 'page' : undefined}>
				<svg
					viewBox="0 0 24 24"
					class="h-6 w-6"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<rect x="3" y="7" width="18" height="13" rx="2" />
					<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
				</svg>
				Your roles
			</a>
			<a
				href="/saved"
				class="relative {tab(current === '/saved')}"
				aria-current={current === '/saved' ? 'page' : undefined}
			>
				<svg
					viewBox="0 0 24 24"
					class="h-6 w-6"
					fill={current === '/saved' ? 'currentColor' : 'none'}
					stroke="currentColor"
					stroke-width="2"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
				</svg>
				Saved
				{#if savedCount}
					<span
						class="absolute left-1/2 top-1 ml-2 min-w-[1.1rem] rounded-full bg-amber-400 px-1 text-center text-[10px] font-bold leading-4 text-slate-900"
						>{savedCount}</span
					>
				{/if}
			</a>
			<a
				href={accountHref}
				class={tab(current === accountHref)}
				aria-current={current === accountHref ? 'page' : undefined}
			>
				{#if $account.status === 'signed-in'}
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-send-green text-xs font-bold text-white"
						aria-hidden="true"
						>{($account.user.name || $account.user.email).charAt(0).toUpperCase()}</span
					>
				{:else}
					<svg
						viewBox="0 0 24 24"
						class="h-6 w-6"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="8" r="4" />
						<path d="M4 21a8 8 0 0 1 16 0" />
					</svg>
				{/if}
				{accountLabel}
			</a>
		</div>
	</nav>
{/if}
