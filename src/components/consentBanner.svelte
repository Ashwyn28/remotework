<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { analyticsEnabled, consent, setConsent, track } from '$lib/analytics';

	let show = false;
	onMount(() => (show = analyticsEnabled() && consent() === 'pending'));

	function choose(choice: 'granted' | 'denied') {
		show = false;
		setConsent(choice).then(() => track('consent_chosen', { choice }));
	}
</script>

{#if show}
	<div
		class="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:bottom-5 sm:left-5 sm:right-auto"
		role="dialog"
		aria-label="Analytics cookies"
		transition:fly|local={{ y: 12, duration: 180 }}
	>
		<p class="text-sm font-bold text-slate-900 dark:text-white">Cookies for analytics?</p>
		<p class="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
			Helps us improve the site (PostHog, EU). Your CV and chats are never sent.
		</p>
		<div class="mt-3 flex gap-3">
			<button class="btn3d btn3d-primary btn3d-sm" on:click={() => choose('granted')}><span>Accept</span></button>
			<button class="btn3d btn3d-secondary btn3d-sm" on:click={() => choose('denied')}><span>No thanks</span></button>
		</div>
	</div>
{/if}
