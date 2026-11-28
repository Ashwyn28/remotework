<script lang="ts">
	/** A briefcase with a green orbit around it, on a sky-blue key built like the site's buttons:
	 * a bright face on a darker base, which lifts when the logo is hovered. */
	export let size = 32;
</script>

<span class="logo group inline-flex items-center gap-2">
	<svg viewBox="0 0 64 64" width={size} height={size} class="shrink-0 overflow-visible" aria-hidden="true">
		<!-- base -->
		<rect x="3" y="8" width="58" height="53" rx="15" fill="#2563eb" stroke="#0b1f14" stroke-width="2.5" />
		<!-- face, lifted -->
		<g class="logo-face">
			<rect x="3" y="3" width="58" height="53" rx="15" fill="#60a5fa" stroke="#0b1f14" stroke-width="2.5" />
			<g transform="rotate(-16 32 31)">
				<ellipse cx="32" cy="31" rx="25" ry="8" fill="none" stroke="#0b1f14" stroke-width="6.5" />
				<ellipse cx="32" cy="31" rx="25" ry="8" fill="none" stroke="#48bb78" stroke-width="3" />
			</g>
			<path d="M26 20 v-3.5 a3 3 0 0 1 3 -3 h6 a3 3 0 0 1 3 3 V20" fill="none" stroke="#0b1f14" stroke-width="3" />
			<rect x="17" y="20" width="30" height="22" rx="5" fill="#ffffff" stroke="#0b1f14" stroke-width="3" />
			<path d="M17 29 h30" stroke="#0b1f14" stroke-width="2.5" />
			<rect x="29" y="26.5" width="6" height="5" rx="1.5" fill="#fbbf24" stroke="#0b1f14" stroke-width="2" />
			<!-- the orbit's front half, over the briefcase -->
			<g transform="rotate(-16 32 31)">
				<path d="M7 31 A25 8 0 0 0 57 31" fill="none" stroke="#0b1f14" stroke-width="6.5" />
				<path d="M7 31 A25 8 0 0 0 57 31" fill="none" stroke="#48bb78" stroke-width="3" />
			</g>
		</g>
	</svg>
	<span class="whitespace-nowrap text-xl font-extrabold tracking-tight text-slate-900 dark:text-white"
		>orbbits <span class="text-send-green">job</span></span
	>
</span>

<style>
	.logo-face {
		transform: translateY(-1px);
		transition: transform 0.1s ease;
	}
	.logo:hover .logo-face {
		transform: translateY(-2.5px);
	}
	:global(a:active) .logo-face {
		transform: translateY(2px);
	}
</style>
