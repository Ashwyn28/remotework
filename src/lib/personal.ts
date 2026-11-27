/**
 * Per-visitor state kept in the browser: saved roles and match preferences.
 * Nothing here is sent to the server.
 */
import { browser } from '$app/env';
import { writable } from 'svelte/store';
import { CATEGORIES, EMPTY_PREFERENCES } from './board';
import type { Preferences } from './board';

export type Status = 'saved' | 'applied';

export interface Tracked {
	status: Status;
	/** epoch ms of the last status change */
	at: number;
}

function persisted<T>(key: string, initial: T) {
	let start = initial;
	if (browser) {
		try {
			const raw = localStorage.getItem(key);
			const saved = raw ? JSON.parse(raw) : null;
			// ignore anything that is not an object we wrote; keep fields added since
			if (saved && typeof saved === 'object' && !Array.isArray(saved))
				start = { ...initial, ...saved };
		} catch {
			// unreadable or blocked storage: fall back to the initial value
		}
	}
	const store = writable<T>(start);
	if (browser) {
		store.subscribe((value) => {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch {
				// storage full or blocked: keep working in memory
			}
		});
	}
	return store;
}

/** job id → tracking state */
export const tracked = persisted<Record<string, Tracked>>('board.tracked', {});

// v3: industries became the first, required question and the industry list changed.
// Carry earlier answers forward so returning visitors only re-answer what is new.
const RENAMED_INDUSTRIES: Record<string, string> = {
	'developer-tools': 'software-and-infrastructure',
	'data-and-infrastructure': 'software-and-infrastructure',
	'consumer-and-productivity': 'consumer'
};

function carryForward(): void {
	if (!browser) return;
	try {
		if (localStorage.getItem('board.preferences.v3')) return;
		const raw = localStorage.getItem('board.preferences.v2');
		const old = raw ? JSON.parse(raw) : null;
		if (!old || typeof old !== 'object') return;
		const known = new Set(CATEGORIES.filter((c) => c.kind === 'industry').map((c) => c.slug));
		const industries = [
			...new Set(
				(Array.isArray(old.industries) ? old.industries : [])
					.map((slug: string) => RENAMED_INDUSTRIES[slug] ?? slug)
					.filter((slug: string) => known.has(slug))
			)
		];
		localStorage.setItem('board.preferences.v3', JSON.stringify({ ...old, industries }));
	} catch {
		// unreadable storage: the visitor simply answers the questions again
	}
}
carryForward();

export const preferences = persisted<Preferences>('board.preferences.v3', EMPTY_PREFERENCES);

// The board lists engineering roles only. Answers saved earlier may name design, product, sales
// and so on, which would now hide every role, so keep only the kinds it still lists.
const LISTED_WORK = ['engineering', 'data'];
preferences.update((p) =>
	p.workTypes?.some((w) => !LISTED_WORK.includes(w))
		? { ...p, workTypes: p.workTypes.filter((w) => LISTED_WORK.includes(w)) }
		: p
);

export const setStatus = (jobId: string, status: Status | null): void =>
	tracked.update((all) => {
		const next = { ...all };
		if (status) next[jobId] = { status, at: Date.now() };
		else delete next[jobId];
		return next;
	});
