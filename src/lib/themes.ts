/** Light and dark palettes for the /agent demo. Each sets the --ag-* variables Tailwind's `ag` colours read. */

export interface Palette {
	bg: string;
	surface: string;
	raised: string;
	input: string;
	chip: string;
	line: string;
	text: string;
	muted: string;
	faint: string;
	accent: string;
	onAccent: string;
}

export const LIGHT: Palette = {
	bg: '#ffffff', surface: '#f5f5f5', raised: '#e5e5e5', input: '#ffffff', chip: '#f0f0f0',
	line: '#e5e5e5', text: '#171717', muted: '#737373', faint: '#a3a3a3', accent: '#000000', onAccent: '#ffffff'
};

export const DARK: Palette = {
	bg: '#000000', surface: '#171717', raised: '#262626', input: '#171717', chip: '#262626',
	line: '#262626', text: '#f5f5f5', muted: '#a3a3a3', faint: '#5c5c5c', accent: '#ffffff', onAccent: '#000000'
};

export const cssVars = (p: Palette): string =>
	[
		['bg', p.bg], ['surface', p.surface], ['raised', p.raised], ['input', p.input], ['chip', p.chip],
		['line', p.line], ['text', p.text], ['muted', p.muted], ['faint', p.faint], ['accent', p.accent],
		['on-accent', p.onAccent]
	]
		.map(([k, v]) => `--ag-${k}:${v}`)
		.join(';');
