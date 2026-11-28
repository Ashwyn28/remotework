/**
 * Signing in with Google, and keeping a signed-in seeker's answers and saved roles in step
 * with their account.
 *
 * The API is reached through this site's own origin (/api is proxied to the backend), so the
 * session lives in a first-party HttpOnly cookie. Writes carry Django's CSRF token.
 */
import { browser } from '$app/env';
import { get, writable } from 'svelte/store';
import { EMPTY_PREFERENCES, isOnboarded } from './board';
import { track } from './analytics';
import type { Preferences } from './board';
import { preferences, tracked } from './personal';
import type { Tracked } from './personal';

export interface Account {
	name: string;
	email: string;
}

export type AccountState =
	| { status: 'loading' }
	| { status: 'signed-out' }
	| { status: 'signed-in'; user: Account }
	| { status: 'unavailable' };

interface MeResponse {
	authenticated: boolean;
	user?: Account;
	preferences?: Partial<Preferences>;
	tracked?: Record<string, Tracked>;
	error?: string;
}

export const account = writable<AccountState>({ status: 'loading' });

const API = '/api';

function csrfToken(): string {
	const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
	return match ? decodeURIComponent(match[1]) : '';
}

async function request(method: string, path: string, body?: unknown): Promise<MeResponse> {
	const res = await fetch(`${API}${path}`, {
		method,
		credentials: 'same-origin',
		headers: {
			Accept: 'application/json',
			...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
			...(method !== 'GET' ? { 'X-CSRFToken': csrfToken() } : {})
		},
		body: body !== undefined ? JSON.stringify(body) : undefined
	});
	const data = (await res.json().catch(() => ({}))) as MeResponse;
	if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
	return data;
}

/** Google's client ID, and the CSRF cookie needed before any write. */
export async function signInConfig(): Promise<{ google_client_id: string }> {
	const res = await fetch(`${API}/auth/config/`, { credentials: 'same-origin' });
	if (!res.ok) throw new Error('Sign-in is not available right now.');
	return res.json();
}

// ---------------------------------------------------------------------------
// Merging: what is in this browser and what is in the account become one.
// ---------------------------------------------------------------------------

/** Saved roles from both places; where both have a role, the latest change wins. */
export function mergeTracked(
	local: Record<string, Tracked>,
	remote: Record<string, Tracked>
): Record<string, Tracked> {
	const merged = { ...remote };
	for (const [id, entry] of Object.entries(local)) {
		if (!merged[id] || entry.at > merged[id].at) merged[id] = entry;
	}
	return merged;
}

/** The account's answers win once it has a complete set; otherwise this browser's are kept. */
export function mergePreferences(
	local: Preferences,
	remote: Partial<Preferences> | undefined
): Preferences {
	const fromAccount = { ...EMPTY_PREFERENCES, ...(remote ?? {}) };
	return isOnboarded(fromAccount) ? fromAccount : local;
}

let syncing = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function adopt(me: MeResponse): void {
	if (!me.authenticated || !me.user) {
		account.set({ status: 'signed-out' });
		return;
	}
	syncing = false; // do not echo the merge itself back while stores update
	const mergedPreferences = mergePreferences(get(preferences), me.preferences);
	const mergedTracked = mergeTracked(get(tracked), me.tracked ?? {});
	preferences.set(mergedPreferences);
	tracked.set(mergedTracked);
	account.set({ status: 'signed-in', user: me.user });
	syncing = true;
	void push(); // the account now holds whatever this browser added
}

async function push(): Promise<void> {
	if (!syncing) return;
	try {
		await request('PUT', '/me/', { preferences: get(preferences), tracked: get(tracked) });
	} catch (error) {
		console.warn('Could not save to your account:', error);
	}
}

/** Save changes to the account shortly after they happen, batching quick edits. */
function schedulePush(): void {
	if (!syncing) return;
	clearTimeout(timer);
	timer = setTimeout(push, 800);
}

let started = false;

/** Find out who is signed in and start keeping their account in step. Call once, in the browser. */
export async function startAccount(): Promise<void> {
	if (!browser || started) return;
	started = true;
	preferences.subscribe(schedulePush);
	tracked.subscribe(schedulePush);
	try {
		adopt(await request('GET', '/me/'));
	} catch {
		account.set({ status: 'unavailable' });
	}
}

export async function signInWithGoogle(credential: string): Promise<void> {
	adopt(await request('POST', '/auth/google/', { credential }));
	if (get(account).status === 'signed-in') track('signed_in', {});
}

/** Forget this browser's copy too, so the next person on a shared computer starts fresh. */
function clearLocal(): void {
	syncing = false;
	clearTimeout(timer);
	preferences.set({ ...EMPTY_PREFERENCES });
	tracked.set({});
}

export async function signOut(): Promise<void> {
	await push();
	await request('POST', '/auth/sign-out/');
	clearLocal();
	account.set({ status: 'signed-out' });
}

export async function deleteAccount(): Promise<void> {
	await request('DELETE', '/me/');
	clearLocal();
	account.set({ status: 'signed-out' });
}
