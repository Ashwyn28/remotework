/**
 * Product analytics with PostHog (EU cloud).
 *
 * Privacy:
 * - Until someone accepts the banner, PostHog runs cookieless: no cookies, no local or session
 *   storage, events counted anonymously. Accepting allows cookies (returning visitors) and session
 *   recordings, in which every input and anything marked .ph-mask is hidden.
 * - Nothing personal is ever sent: no CV text, chat text, names, emails or phone numbers. Events
 *   carry only their name and the small, fixed properties defined in `track` below.
 * - No autocapture: only the events this site sends on purpose.
 *
 * Off entirely when VITE_POSTHOG_KEY is not set (local development, tests).
 */
import { browser } from '$app/env';
import type { PostHog } from 'posthog-js';

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = 'https://eu.i.posthog.com';
const CONSENT = 'analytics.consent';

export type Consent = 'granted' | 'denied' | 'pending';

let client: PostHog | null = null;
let starting: Promise<PostHog | null> | null = null;

export const analyticsEnabled = (): boolean => browser && Boolean(KEY);

/** The visitor's choice from the banner, kept in this browser. */
export function consent(): Consent {
	if (!browser) return 'pending';
	const saved = localStorage.getItem(CONSENT);
	return saved === 'granted' || saved === 'denied' ? saved : 'pending';
}

export function start(): Promise<PostHog | null> {
	if (!analyticsEnabled()) return Promise.resolve(null);
	starting ??= import('posthog-js').then(({ default: posthog }) => {
		posthog.init(KEY as string, {
			api_host: HOST,
			ui_host: 'https://eu.posthog.com',
			defaults: '2026-08-30',
			// anonymous and cookieless until the visitor accepts; then cookies as usual
			cookieless_mode: 'on_reject',
			opt_out_capturing_by_default: consent() !== 'granted',
			person_profiles: 'identified_only',
			autocapture: false,
			capture_pageview: 'history_change',
			capture_pageleave: true,
			disable_session_recording: consent() !== 'granted',
			session_recording: {
				maskAllInputs: true,
				maskTextSelector: '.ph-mask',
				recordBody: false,
				recordHeaders: false
			}
		});
		client = posthog;
		return posthog;
	});
	return starting;
}

export async function setConsent(choice: 'granted' | 'denied'): Promise<void> {
	if (!browser) return;
	localStorage.setItem(CONSENT, choice);
	const posthog = await start();
	if (!posthog) return;
	if (choice === 'granted') {
		posthog.opt_in_capturing();
		posthog.startSessionRecording();
	} else {
		posthog.opt_out_capturing(); // keeps counting anonymously, cookieless
		posthog.stopSessionRecording();
	}
}

type Source = 'board' | 'agent' | 'cv_match' | 'company' | 'saved';
type Bucket = 'short' | 'medium' | 'long';

/** Every event the site sends, with exactly the properties it may carry. */
export interface Events {
	view_switched: { to: 'board' | 'agent' };
	personalise_started: Record<string, never>;
	personalise_completed: { industries: number; places: number; kinds_of_engineering: number };
	board_searched: { length: Bucket };
	board_filtered: { filter: string; value: string };
	industry_tab: { industry: string };
	role_opened: { company: string; industry: string; seniority: string; source: Source };
	role_saved: { company: string; industry: string; source: Source };
	apply_clicked: { company: string; industry: string; seniority: string; work_type: string; source: Source };
	agent_message: { mode: 'model' | 'rules'; length: Bucket };
	agent_reply: { ms: number; tools: number; streamed: boolean };
	agent_tool: { tool: string };
	agent_fallback: { reason: 'unreachable' | 'limit_you' | 'limit_site' };
	cv_uploaded: { pages: number; details_found: number };
	cv_questions_done: Record<string, never>;
	cv_matches_shown: { count: number };
	agent_proposal: { kind: string; decision: 'confirmed' | 'dismissed'; count: number };
	signed_in: Record<string, never>;
	consent_chosen: { choice: 'granted' | 'denied' };
}

export function track<E extends keyof Events>(event: E, properties: Events[E]): void {
	if (!analyticsEnabled()) return;
	if (client) client.capture(event, properties);
	else start().then((posthog) => posthog?.capture(event, properties));
}

/** Text length as a rough bucket: never the text itself. */
export const lengthBucket = (text: string): Bucket =>
	text.length < 30 ? 'short' : text.length < 120 ? 'medium' : 'long';

/** The few facts about a role that events carry: never anything about the person. */
export const roleFacts = (job: { company: { name: string }; industry: string; seniority: string; workType: string }) => ({
	company: job.company.name,
	industry: job.industry,
	seniority: job.seniority || 'unknown',
	work_type: job.workType
});

export type { Source };
