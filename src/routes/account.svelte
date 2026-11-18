<script lang="ts">
	import { goto } from '$app/navigation';
	import { account, deleteAccount, signOut } from '$lib/account';

	let confirming = false;
	let busy = false;
	let error = '';

	const run = async (action: () => Promise<void>) => {
		busy = true;
		error = '';
		try {
			await action();
			await goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
		} finally {
			busy = false;
		}
	};
</script>

<svelte:head>
	<title>Your account · orbbits job</title>
</svelte:head>

<section class="mx-auto max-w-lg py-12">
	<h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
		Your account
	</h1>
	{#if $account.status === 'loading'}
		<p class="mt-4 text-slate-500">Loading…</p>
	{:else if $account.status !== 'signed-in'}
		<p class="mt-4 text-slate-500 dark:text-slate-400">You are not signed in.</p>
		<a href="/login" class="mt-4 inline-block font-semibold text-send-green hover:underline"
			>Sign in</a
		>
	{:else}
		<dl
			class="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
		>
			<div>
				<dt class="text-xs text-slate-400">Name</dt>
				<dd class="font-semibold text-slate-900 dark:text-white">{$account.user.name || '—'}</dd>
			</div>
			<div>
				<dt class="text-xs text-slate-400">Email</dt>
				<dd class="font-semibold text-slate-900 dark:text-white">{$account.user.email}</dd>
			</div>
		</dl>
		<p class="mt-3 text-sm text-slate-500 dark:text-slate-400">
			Your answers and saved roles are stored with this account so they follow you between devices.
			<a href="/match" class="font-semibold text-send-green hover:underline">Change answers</a>
		</p>

		<div class="mt-8 flex flex-wrap gap-3">
			<button
				type="button"
				disabled={busy}
				class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
				on:click={() => run(signOut)}>Sign out</button
			>
		</div>

		<section class="mt-12 border-t border-slate-200 pt-6 dark:border-slate-700">
			<h2 class="font-bold text-slate-900 dark:text-white">Delete your account</h2>
			<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
				Removes your account, answers and saved roles from our servers and signs you out. This
				cannot be undone.
			</p>
			{#if confirming}
				<div class="mt-4 flex flex-wrap items-center gap-3">
					<button
						type="button"
						disabled={busy}
						class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
						on:click={() => run(deleteAccount)}>Yes, delete everything</button
					>
					<button
						type="button"
						class="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
						on:click={() => (confirming = false)}>Keep my account</button
					>
				</div>
			{:else}
				<button
					type="button"
					class="mt-4 text-sm font-semibold text-rose-600 hover:underline"
					on:click={() => (confirming = true)}>Delete account…</button
				>
			{/if}
		</section>
		{#if error}<p class="mt-4 text-sm font-semibold text-rose-600" role="alert">{error}</p>{/if}
	{/if}
</section>
