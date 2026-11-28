<script lang="ts">
	import { page } from '$app/stores';
	import { CATEGORIES } from '$lib/board';
	import { tracked } from '$lib/personal';
	import { account } from '$lib/account';
	import { onMount } from 'svelte';
	import Logo from '$lib/brand/Logo.svelte';
	import { track } from '$lib/analytics';

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
	$: onAgent = current === '/agent' || current.startsWith('/agent/');
	$: savedCount = Object.keys($tracked).length;
	// the questions page has its own bottom bar (Back / Continue), so the tab bar steps aside
	$: showTabBar = current !== '/match';
	$: accountHref = $account.status === 'signed-in' ? '/account' : '/login';
	// the main places: roles, the agent and saved roles; on phones they sit in the bottom tab bar
	$: section = onAgent ? 'agent' : current === '/saved' ? 'saved' : current === accountHref ? 'you' : 'roles';
	const switched = (to: 'board' | 'agent') => () => {
		if ((to === 'agent') !== onAgent) track('view_switched', { to });
	};
	// the current place is a pressed green key, like the site's buttons
	const tabClass = (active: boolean) =>
		active
			? 'btn3d btn3d-primary btn3d-sm'
			: 'rounded-lg px-1 text-slate-600 transition hover:bg-white/70 hover:text-slate-900 hover:no-underline dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white';
	const barTab = (active: boolean) =>
		'flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-bold hover:no-underline ' +
		(active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400');
	const linkClass = (active: boolean) =>
		'shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition hover:no-underline sm:py-1 ' +
		(active
			? 'bg-dark-beach-black text-white dark:bg-white dark:text-slate-900'
			: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700');
</script>

<header class="border-b border-slate-200 dark:border-slate-700 {onAgent ? '' : 'sm:pb-3'}">
	<div class="flex items-center gap-2 py-3 sm:gap-6">
		<a href="/" class="hover:no-underline" aria-label="orbbits job, home"><Logo /></a>
		<nav class="hidden items-center gap-2 sm:flex" aria-label="Main">
			<a href="/" class={tabClass(section === 'roles')} aria-current={section === 'roles' ? 'page' : undefined} on:click={switched('board')}>
				<span><span class="flex items-center gap-1.5 px-1 py-0.5 text-sm font-bold">Roles</span></span>
			</a>
			<a href="/agent" class={tabClass(section === 'agent')} aria-current={section === 'agent' ? 'page' : undefined} on:click={switched('agent')}>
				<span><span class="flex items-center gap-1.5 px-1 py-0.5 text-sm font-bold"
					><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="currentColor" aria-hidden="true"
						><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" /></svg
					>Agent</span></span>
			</a>
			<a href="/saved" class={tabClass(section === 'saved')} aria-current={section === 'saved' ? 'page' : undefined}>
				<span><span class="flex items-center gap-1.5 px-1 py-0.5 text-sm font-bold"
					>Saved{#if savedCount}<span class="rounded-full bg-amber-400 px-1.5 text-xs text-slate-900">{savedCount}</span>{/if}</span></span>
			</a>
		</nav>
		<div class="ml-auto flex items-center gap-1 sm:gap-2">
			<div class="hidden sm:flex">
				{#if $account.status === 'signed-in'}
					<a
						href="/account"
						class="flex h-9 w-9 items-center justify-center rounded-full bg-send-green text-sm font-bold text-white hover:no-underline"
						title="Your account ({$account.user.email})"
						aria-label="Your account"
						>{($account.user.name || $account.user.email).charAt(0).toUpperCase()}</a
					>
				{:else if $account.status === 'signed-out'}
					<a href="/login" class="rounded-lg px-3 py-1 text-sm font-bold text-slate-600 hover:bg-white/70 hover:no-underline dark:text-slate-300 dark:hover:bg-slate-700">Sign in</a>
				{/if}
			</div>
			<button
				class="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-700 sm:h-8 sm:w-8"
				aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
				on:click={toggleDarkMode}
			>
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					{#if darkMode}
						<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
					{:else}
						<circle cx="12" cy="12" r="4" />
						<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
					{/if}
				</svg>
			</button>
		</div>
	</div>
	{#if !onAgent}
		<!-- industries: desktop only; on phones the roles page has its own industry tabs -->
		<nav class="no-scrollbar fade-right hidden items-center gap-1 overflow-x-auto sm:flex" aria-label="Industries">
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
	<!-- phones: the main places, always one thumb away -->
	<nav
		class="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:hidden"
		aria-label="Main"
	>
		<div class="mx-auto grid max-w-md grid-cols-4 px-2">
			{#each [
				{ key: 'roles', href: '/', label: 'Roles', to: 'board' },
				{ key: 'agent', href: '/agent', label: 'Agent', to: 'agent' },
				{ key: 'saved', href: '/saved', label: 'Saved', to: null },
				{ key: 'you', href: accountHref, label: $account.status === 'signed-in' ? 'You' : 'Sign in', to: null }
			] as item (item.key)}
				<a
					href={item.href}
					class={barTab(section === item.key)}
					aria-current={section === item.key ? 'page' : undefined}
					on:click={item.to ? switched(item.to === 'agent' ? 'agent' : 'board') : undefined}
				>
					<span
						class="relative flex h-8 w-12 items-center justify-center rounded-lg border-[1.5px] transition {section === item.key
							? 'border-[#1c4532] bg-send-green text-[#0b1f14] shadow-[0_2px_0_#1c4532]'
							: 'border-transparent'}"
					>
						{#if item.key === 'roles'}
							<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
								><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg
							>
						{:else if item.key === 'agent'}
							<svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true"
								><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" /></svg
							>
						{:else if item.key === 'saved'}
							<svg viewBox="0 0 24 24" class="h-5 w-5" fill={section === 'saved' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"
								><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" /></svg
							>
							{#if savedCount}
								<span class="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-amber-400 px-1 text-center text-[10px] font-bold leading-4 text-slate-900">{savedCount}</span>
							{/if}
						{:else if $account.status === 'signed-in'}
							<span class="flex h-6 w-6 items-center justify-center rounded-full bg-send-green text-xs font-bold text-white" aria-hidden="true"
								>{($account.user.name || $account.user.email).charAt(0).toUpperCase()}</span
							>
						{:else}
							<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
								><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg
							>
						{/if}
					</span>
					{item.label}
				</a>
			{/each}
		</div>
	</nav>
{/if}
