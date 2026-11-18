<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { account, signInConfig, signInWithGoogle } from '$lib/account';

	let button: HTMLDivElement;
	let error = '';
	let busy = false;

	// minimal shape of Google Identity Services, loaded from Google at runtime
	interface GoogleId {
		initialize(options: {
			client_id: string;
			callback: (r: { credential: string }) => void;
			ux_mode?: string;
		}): void;
		renderButton(el: HTMLElement, options: Record<string, unknown>): void;
	}

	const loadGoogle = () =>
		new Promise<GoogleId>((resolve, reject) => {
			const ready = () =>
				(window as unknown as { google?: { accounts: { id: GoogleId } } }).google?.accounts.id;
			if (ready()) return resolve(ready() as GoogleId);
			const script = document.createElement('script');
			script.src = 'https://accounts.google.com/gsi/client';
			script.async = true;
			script.onload = () =>
				ready() ? resolve(ready() as GoogleId) : reject(new Error('Google sign-in did not load'));
			script.onerror = () =>
				reject(new Error('Could not reach Google. Check your connection and try again.'));
			document.head.appendChild(script);
		});

	const onCredential = async ({ credential }: { credential: string }) => {
		busy = true;
		error = '';
		try {
			await signInWithGoogle(credential);
			await goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
		} finally {
			busy = false;
		}
	};

	onMount(async () => {
		try {
			const [{ google_client_id }, google] = await Promise.all([signInConfig(), loadGoogle()]);
			google.initialize({ client_id: google_client_id, callback: onCredential, ux_mode: 'popup' });
			google.renderButton(button, {
				theme: 'outline',
				size: 'large',
				text: 'continue_with',
				shape: 'pill',
				width: 300
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Sign-in is not available right now.';
		}
	});
</script>

<svelte:head>
	<title>Sign in · orbbits job</title>
</svelte:head>

<section class="mx-auto max-w-md py-12 text-center sm:py-20">
	{#if $account.status === 'signed-in'}
		<h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
			You are signed in
		</h1>
		<p class="mt-3 text-slate-500 dark:text-slate-400">as {$account.user.email}</p>
		<a href="/" class="mt-6 inline-block font-semibold text-send-green hover:underline"
			>Go to your industries →</a
		>
	{:else}
		<h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Sign in</h1>
		<p class="mt-3 text-slate-500 dark:text-slate-400">
			Keep your answers and saved roles on every device. Anything you have already picked in this
			browser comes with you.
		</p>
		<div class="mt-8 flex min-h-[44px] justify-center" bind:this={button} aria-busy={busy} />
		{#if busy}<p class="mt-3 text-sm text-slate-500" role="status">Signing you in…</p>{/if}
		{#if error}<p class="mt-4 text-sm font-semibold text-rose-600" role="alert">{error}</p>{/if}
		<p class="mt-10 text-xs text-slate-400">
			We only receive your name and email address from Google. You can delete your account at any
			time.
		</p>
	{/if}
</section>
