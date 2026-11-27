<script lang="ts">
	/** A ringed planet with a moon on its orbit, built like the site's buttons: a bright face on a darker
	 * base, which lifts when the logo is hovered. */
	export let size = 30;
</script>

<span class="logo group inline-flex items-center gap-2">
	<svg
		viewBox="0 0 32 32"
		width={size}
		height={size}
		class="shrink-0 overflow-visible"
		aria-hidden="true"
	>
		<!-- base -->
		<rect x="1" y="4" width="30" height="27" rx="7.5" fill="#2f855a" stroke="#1c4532" stroke-width="1.5" />
		<!-- face, lifted -->
		<g class="logo-face">
			<rect x="1" y="1" width="30" height="27" rx="7.5" fill="#48bb78" stroke="#1c4532" stroke-width="1.5" />
			<g transform="rotate(-18 16 14.5)">
				<!-- the ring: drawn whole, then its front half again over the planet -->
				<ellipse cx="16" cy="14.5" rx="11.2" ry="4.1" fill="none" stroke="#0b1f14" stroke-width="2" />
				<circle cx="16" cy="14.5" r="6.4" fill="#ffffff" stroke="#0b1f14" stroke-width="1.75" />
				<path d="M4.8 14.5 A11.2 4.1 0 0 0 27.2 14.5" fill="none" stroke="#0b1f14" stroke-width="2" />
				<circle cx="27.2" cy="14.5" r="1.9" fill="#ffffff" stroke="#0b1f14" stroke-width="1.5" />
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
		transform: translateY(-2px);
	}
	:global(a:active) .logo-face {
		transform: translateY(1px);
	}
</style>
