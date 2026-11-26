<script lang="ts">
	import { browser } from '$app/env';
	import { onMount, tick } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { ago, loadBoard, seniorityLabel, stageLabel } from '$lib/board';
	import type { Company, Job } from '$lib/board';
	import { setStatus, tracked } from '$lib/personal';
	import {
		acknowledge,
		applyChanges,
		briefChips,
		briefIsEmpty,
		EMPTY_BRIEF,
		CATEGORIES,
		EXAMPLES,
		list,
		STAGES,
		runBrief,
		suggestions,
		understand
	} from '$lib/agent';
	import type { Brief, Change, Hit, Step } from '$lib/agent';
	import { cssVars, DARK, LIGHT } from '$lib/themes';
	import {
		answer,
		EMPTY_PROFILE,
		extract,
		fillApplication,
		isSkip,
		nextQuestion,
		parseReply,
		profile,
		profileRows,
		QUESTIONS,
		readCv
	} from '$lib/profile';
	import type { Application, Profile, Question } from '$lib/profile';
	import Avatar from '../../components/avatar.svelte';
	import SaveButton from '../../components/saveButton.svelte';

	type Status = 'pending' | 'sending' | 'done' | 'dismissed';
	type Proposal =
		| { kind: 'save'; jobs: Job[]; status: Status }
		| { kind: 'watch'; brief: Brief; summary: string; status: Status }
		| { kind: 'apply'; apps: Application[]; open: number; status: Status }
		| { kind: 'forget'; status: Status };
	/** ids: exact roles, as the model picks them; otherwise the top `count` of the latest results */
	type ApplyRequest = { count: number; companies: string[]; ids?: string[] };

	interface AgentMsg {
		role: 'agent';
		id: number;
		thinking: boolean;
		text: string;
		steps: Step[];
		shownSteps: number;
		hits: Hit[];
		compare: Hit[];
		proposal: Proposal | null;
		suggestions: string[];
		traceOpen: boolean;
		/** summary line for the collapsed trace */
		traceTitle: string;
		/** what the agent read from a CV, shown as a card */
		profileCard: Profile | null;
	}
	interface UserMsg {
		role: 'user';
		id: number;
		text: string;
	}
	type Msg = AgentMsg | UserMsg;

	const PAGE = 5;
	const STEP_DELAY = 260;

	let jobs: Job[] = [];
	let companies: Company[] = [];
	let offline = false;
	let ready = false;
	let generatedAt: string | null = null;

	let brief: Brief = loadBrief();
	let messages: Msg[] = [];
	let lastHits: Hit[] = [];
	let shownCount = 0;
	let input = '';
	let busy = false;
	let nextId = 1;
	let toolCalls = 0;
	let briefOpen = false;
	let showJson = false;
	let watches: { summary: string; brief: Brief; at: number }[] = loadWatches();

	// auto-apply: the question being asked, and an apply request waiting on the answers
	let interview: Question | null = null;
	let pendingApply: ApplyRequest | null = null;
	let fileInput: HTMLInputElement;

	// light or dark: the same saved choice as the main board's header, else the device setting
	let dark = false;
	$: palette = dark ? DARK : LIGHT;
	$: if (browser) {
		document.documentElement.classList.toggle('dark', dark);
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.bg);
	}
	function toggleTheme() {
		dark = !dark;
		localStorage.theme = dark ? 'dark' : 'light';
	}

	let thread: HTMLElement;
	let composer: HTMLTextAreaElement;

	onMount(async () => {
		dark =
			localStorage.theme === 'dark' ||
			(!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
		const board = await loadBoard();
		jobs = board.jobs;
		companies = board.companies;
		offline = board.offline;
		generatedAt = board.generatedAt;
		ready = true;
		if (!briefIsEmpty(brief)) {
			const { hits } = runBrief(brief, jobs);
			lastHits = hits;
			agentSay({
				text: `Welcome back. Your brief still has ${list(briefChips(brief, companies).map((c) => c.label))}: ${count(hits.length)} on the board today. Ask for changes, or say “reset”.`,
				hits: hits.slice(0, 3),
				suggestions: nextMoves(brief, hits)
			});
			shownCount = 3;
		}
		composer?.focus();
	});

	function loadBrief(): Brief {
		if (!browser) return EMPTY_BRIEF;
		try {
			const saved = JSON.parse(localStorage.getItem('agent.brief') ?? 'null');
			return saved && typeof saved === 'object' ? { ...EMPTY_BRIEF, ...saved } : EMPTY_BRIEF;
		} catch {
			return EMPTY_BRIEF;
		}
	}
	function loadWatches() {
		if (!browser) return [];
		try {
			const saved = JSON.parse(localStorage.getItem('agent.watches') ?? '[]');
			return Array.isArray(saved) ? saved : [];
		} catch {
			return [];
		}
	}
	$: if (browser) localStorage.setItem('agent.brief', JSON.stringify(brief));
	$: if (browser) localStorage.setItem('agent.watches', JSON.stringify(watches));

	$: chips = briefChips(brief, companies);
	$: saved = jobs.filter((j) => $tracked[j.id]);
	$: briefJson = JSON.stringify(
		Object.fromEntries(
			Object.entries(brief).filter(([, v]) => (Array.isArray(v) ? v.length : Boolean(v)))
		),
		null,
		2
	);

	const count = (n: number) => `${n.toLocaleString()} matching role${n === 1 ? '' : 's'}`;
	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

	async function scrollDown() {
		await tick();
		thread?.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
	}

	function agentSay(partial: Partial<AgentMsg>): AgentMsg {
		const msg: AgentMsg = {
			role: 'agent',
			id: nextId++,
			thinking: false,
			text: '',
			steps: [],
			shownSteps: 0,
			hits: [],
			compare: [],
			proposal: null,
			suggestions: [],
			traceOpen: false,
			traceTitle: '',
			profileCard: null,
			...partial
		};
		messages = [...messages, msg];
		scrollDown();
		return msg;
	}

	function update(msg: AgentMsg, patch: Partial<AgentMsg>) {
		Object.assign(msg, patch);
		messages = messages;
		scrollDown();
	}

	/** Reveal tool calls one by one, so people can see what the agent is doing. */
	async function play(msg: AgentMsg, steps: Step[]) {
		update(msg, { steps, shownSteps: 0, traceOpen: true });
		for (let i = 1; i <= steps.length; i++) {
			await wait(STEP_DELAY);
			update(msg, { shownSteps: i });
		}
		toolCalls += steps.length;
		await wait(STEP_DELAY / 2);
	}

	async function send(text: string) {
		const said = text.trim();
		if (!said || busy || !ready) return;
		input = '';
		busy = true;
		messages = [...messages, { role: 'user', id: nextId++, text: said }];
		const msg = agentSay({ thinking: true });
		await wait(200);

		const { changes, command } = understand(said, companies);
		const correction = /\bmy (name|e-?mail|phone(?: number)?|number|location|linkedin)(?: address)? is (.+)$/i.exec(said);
		try {
			if (correction && $profile) {
				const key = correction[1].toLowerCase().replace(/^e-?mail$/, 'email').replace(/^(phone number|number)$/, 'phone') as
					'name' | 'email' | 'phone' | 'location' | 'linkedin';
				const value = correction[2].trim().replace(/[.]$/, '');
				profile.set({ ...$profile, [key]: value, answers: { ...$profile.answers, ...(key === 'linkedin' ? {} : { [key]: value }) } });
				update(msg, { thinking: false, text: `Updated your ${key} to ${value}.`, suggestions: interview ? interview.choices : [] });
			} else if (interview && (isSkip(said) || parseReply(interview, said) !== null)) {
				await takeAnswer(msg, said);
			} else if (interview && command.kind === 'search' && !changes.length) {
				update(msg, {
					thinking: false,
					text: `Sorry, I didn’t catch that. ${interview.ask}`,
					suggestions: interview.choices
				});
			} else if (command.kind === 'upload') {
				fileInput?.click();
				update(msg, {
					thinking: false,
					text: 'Choose your CV, as a PDF or plain text. It stays in this browser.'
				});
			} else if (command.kind === 'profile') {
				update(msg, $profile
					? { thinking: false, text: 'This is what I put on applications. Tell me if anything’s wrong, for example “my phone is …”.', profileCard: $profile }
					: { thinking: false, text: 'I don’t have your CV yet. Upload it and I’ll fill in applications for you.', suggestions: ['Upload my CV'] });
			} else if (command.kind === 'forget') {
				update(msg, $profile
					? { thinking: false, text: 'Delete your CV and answers from this browser?', proposal: { kind: 'forget', status: 'pending' } }
					: { thinking: false, text: 'There’s no CV stored here.' });
			} else if (command.kind === 'reset') {
				brief = EMPTY_BRIEF;
				lastHits = [];
				convo = [];
				update(msg, {
					thinking: false,
					text: 'Brief cleared. Tell me what kind of role you want, in your own words.',
					suggestions: EXAMPLES.slice(0, 3)
				});
			} else if (modelState !== 'off' && (await askModel(msg, said))) {
				// the model handled it
			} else if (command.kind === 'apply') {
				await startApply(msg, { count: command.count, companies: command.companies });
			} else if (command.kind === 'help') {
				update(msg, {
					thinking: false,
					text:
						'I search every open role at the companies on this board and keep a brief of what you want. Describe a role, the industry, where you want to work, seniority or pay; say “not Google” or “drop sales” to narrow; ask me to compare, save or watch. You approve anything I change on your behalf.',
					suggestions: EXAMPLES
				});
			} else if (command.kind === 'more') {
				const more = lastHits.slice(shownCount, shownCount + PAGE);
				shownCount += more.length;
				update(msg, {
					thinking: false,
					text: more.length
						? `Next ${more.length}, ${shownCount} of ${lastHits.length.toLocaleString()} shown.`
						: 'That’s everything that matches. Loosen the brief to see more.',
					hits: more,
					suggestions: nextMoves(brief, lastHits)
				});
			} else if (command.kind === 'save') {
				if (changes.length) await search(msg, changes, false);
				const pick = lastHits
					.map((h) => h.job)
					.filter((j) => !$tracked[j.id])
					.slice(0, command.count);
				update(msg, {
					thinking: false,
					text: pick.length
						? `I’d add these ${pick.length} to your shortlist. Approve?`
						: 'Nothing new to save from the latest results.',
					proposal: pick.length ? { kind: 'save', jobs: pick, status: 'pending' } : null
				});
			} else if (command.kind === 'compare') {
				if (changes.length) await search(msg, changes, false);
				// compare across companies when the results allow it
				const first = lastHits[0];
				const second =
					lastHits.find((h) => first && h.job.company.id !== first.job.company.id) ?? lastHits[1];
				const pair = first && second ? [first, second] : [];
				update(msg, {
					thinking: false,
					text:
						pair.length < 2
							? 'I need at least two matches to compare. Try a broader brief.'
							: `${pair[0].job.company.name} vs ${pair[1].job.company.name}, side by side.`,
					compare: pair.length === 2 ? pair : [],
					suggestions: pair.length === 2 ? ['Save the top 2', 'Show more'] : []
				});
			} else if (command.kind === 'watch') {
				if (changes.length) await search(msg, changes, false);
				const summary = briefChips(brief, companies).map((c) => c.label).join(' · ') || 'Everything on the board';
				update(msg, {
					thinking: false,
					text: `I can check the board after each morning’s sync (06:00 UK) and flag new roles that fit this brief.`,
					proposal: { kind: 'watch', brief, summary, status: 'pending' }
				});
			} else if (command.kind === 'shortlist' && /appl/i.test(said)) {
				update(msg, {
					thinking: false,
					text: applied.length
						? `You’ve applied to ${applied.length} role${applied.length === 1 ? '' : 's'}.`
						: 'No applications yet.',
					hits: applied.map((job) => ({ job, score: -1, reasons: [] }))
				});
			} else if (command.kind === 'shortlist') {
				update(msg, {
					thinking: false,
					text: saved.length
						? `You have ${saved.length} role${saved.length === 1 ? '' : 's'} on your shortlist.`
						: 'Your shortlist is empty. Ask me to save some matches.',
					hits: saved.map((job) => ({ job, score: -1, reasons: [] }))
				});
			} else {
				await search(msg, changes, true);
			}
		} finally {
			busy = false;
			await tick();
			composer?.focus();
		}
	}

	// ---------------------------------------------------------------------------
	// CV, questions and applying
	// ---------------------------------------------------------------------------

	async function onFile(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const file = target.files?.[0];
		target.value = '';
		if (!file || busy) return;
		busy = true;
		messages = [...messages, { role: 'user', id: nextId++, text: `Uploaded ${file.name}` }];
		const msg = agentSay({ thinking: true });
		try {
			const start = performance.now();
			const { text, pages } = await readCv(file);
			const readMs = Math.round(performance.now() - start);
			const found = extract(text);
			const old = $profile;
			const next: Profile = {
				...EMPTY_PROFILE,
				answers: old?.answers ?? {},
				...found,
				cvName: file.name,
				cvText: text
			};
			// answers typed earlier still fill gaps the new CV leaves
			for (const key of ['name', 'email', 'phone', 'location'] as const)
				if (!next[key] && next.answers[key]) next[key] = next.answers[key];
			const details = profileRows(next).length;
			update(msg, { thinking: false });
			await play(msg, [
				{ tool: 'cv.read', args: { file: file.name, pages }, result: `${text.length.toLocaleString()} characters of text`, ms: Math.max(1, readMs) },
				{ tool: 'profile.extract', args: { fields: 'contact, links, role, experience, skills' }, result: `${details} details found`, ms: 2 }
			]);
			profile.set(next);
			update(msg, {
				text: `Here’s what I picked up from your CV. If anything’s wrong, tell me, for example “my email is …”.`,
				profileCard: next,
				traceTitle: `Read ${file.name}`,
				traceOpen: false
			});
			await wait(400);
			const q = nextQuestion(next);
			if (q) {
				interview = q;
				agentSay({
					text: `Now a few questions most application forms ask, so I can answer them for you. ${q.ask}`,
					suggestions: q.choices
				});
			} else await finishInterview(agentSay({}));
		} catch (err) {
			update(msg, {
				thinking: false,
				text: err instanceof Error ? err.message : 'I couldn’t read that file.',
				suggestions: ['Upload my CV']
			});
		} finally {
			busy = false;
			composer?.focus();
		}
	}

	async function takeAnswer(msg: AgentMsg, reply: string) {
		const q = interview;
		if (!q || !$profile) return;
		const value = isSkip(reply) ? '' : (parseReply(q, reply) as string);
		const updated = answer($profile, q, value);
		profile.set(updated);
		const next = nextQuestion(updated);
		const done = QUESTIONS.filter((x) => x.known(updated)).length;
		if (next) {
			interview = next;
			update(msg, {
				thinking: false,
				text: `${value ? 'Got it.' : 'Skipped.'} ${next.ask}`,
				suggestions: next.choices,
				traceTitle: `${done} of ${QUESTIONS.length}`
			});
		} else {
			await finishInterview(msg);
		}
	}

	async function finishInterview(msg: AgentMsg) {
		interview = null;
		if (pendingApply) {
			const request = pendingApply;
			pendingApply = null;
			update(msg, { thinking: false, text: 'That’s everything. Now the applications.' });
			await startApply(agentSay({ thinking: true }), request);
			return;
		}
		update(msg, {
			thinking: false,
			text: 'That’s everything most forms ask. I can now apply for you: find a role, then say “apply to the top 2” or “apply to Stripe”. I’ll show each filled form before anything goes.',
			suggestions: lastHits.length ? ['Apply to the top match', 'Show my profile'] : EXAMPLES.slice(0, 2)
		});
	}

	async function startApply(msg: AgentMsg, request: ApplyRequest) {
		if (!$profile) {
			pendingApply = request;
			update(msg, {
				thinking: false,
				text: 'To apply for you I need your CV first. Attach it with the paperclip, or tap below.',
				suggestions: ['Upload my CV']
			});
			return;
		}
		const q = nextQuestion($profile);
		if (q) {
			pendingApply = request;
			interview = q;
			update(msg, {
				thinking: false,
				text: `Before I apply, a few answers forms always ask. ${q.ask}`,
				suggestions: q.choices
			});
			return;
		}

		let pool = lastHits.map((h) => h.job);
		if (request.ids?.length) pool = request.ids.map((id) => jobs.find((j) => j.id === id)).filter((j): j is Job => Boolean(j));
		else if (request.companies.length) {
			pool = pool.filter((j) => request.companies.includes(j.company.id));
			if (!pool.length)
				pool = runBrief({ ...brief, companies: request.companies, excluded: [] }, jobs).hits.map((h) => h.job);
			if (!pool.length) pool = jobs.filter((j) => request.companies.includes(j.company.id));
		}
		const pick = pool
			.filter((j) => j.applyUrl && $tracked[j.id]?.status !== 'applied')
			.slice(0, request.count);
		if (!pick.length) {
			update(msg, {
				thinking: false,
				text: lastHits.length || request.companies.length
					? 'Nothing left to apply to there: those roles are already applied for or have no apply link.'
					: 'Find some roles first, then tell me which to apply to.',
				suggestions: lastHits.length ? [] : EXAMPLES.slice(0, 2)
			});
			return;
		}
		const apps = pick.map((job) => fillApplication(job, $profile as Profile));
		update(msg, { thinking: false });
		await play(msg, [
			{ tool: 'form.fetch', args: { roles: apps.length, ats: [...new Set(apps.map((a) => a.ats))] }, result: `${apps.length} application form${apps.length === 1 ? '' : 's'} found`, ms: 41 },
			{ tool: 'form.fill', args: { profile: $profile.cvName }, result: `${apps.reduce((n, a) => n + a.fields.length, 0)} fields filled, ${apps.length} note${apps.length === 1 ? '' : 's'} drafted`, ms: 6 }
		]);
		update(msg, {
			text: `Ready to apply to ${apps.length === 1 ? `${apps[0].job.title} at ${apps[0].job.company.name}` : `${apps.length} roles`}. Check what I’ll send:`,
			proposal: { kind: 'apply', apps, open: 0, status: 'pending' },
			traceTitle: 'Filled the application forms',
			traceOpen: false
		});
	}

	async function submitApplications(apps: Application[]) {
		busy = true;
		const msg = agentSay({ thinking: true });
		await wait(200);
		update(msg, { thinking: false });
		await play(
			msg,
			apps.map((a) => ({
				tool: 'application.submit',
				args: { company: a.job.company.name, ats: a.ats, dry_run: true },
				result: 'recorded (demo: not sent)',
				ms: 120 + Math.round(Math.random() * 200)
			}))
		);
		for (const a of apps) setStatus(a.job.id, 'applied');
		update(msg, {
			text: `Marked ${apps.length === 1 ? 'it' : apps.length === 2 ? 'both' : `all ${apps.length}`} as applied. This demo doesn’t send anything to employers yet, so to really apply, open ${apps.length === 1 ? 'the role' : 'each role'} below and submit it there.`,
			hits: apps.map((a) => ({ job: a.job, score: -1, reasons: [] })),
			traceTitle: `Submitted ${apps.length} application${apps.length === 1 ? '' : 's'}`,
			traceOpen: false,
			suggestions: ['Show my applications', 'Show my profile']
		});
		busy = false;
	}

	// ---------------------------------------------------------------------------
	// The model: Claude through /api/agent/, with the tools running here in the page
	// ---------------------------------------------------------------------------

	/** 'unknown' until the first call; 'off' after a failure, for the rest of the visit */
	let modelState: 'unknown' | 'on' | 'off' = 'unknown';
	/** the conversation in API form, append-only: replayed thinking blocks must stay untouched */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let convo: any[] = [];
	const MAX_TOOL_ROUNDS = 6;
	const MAX_CONVO = 50;

	function contextNote(): string {
		const search = briefChips(brief, companies).map((c) => c.label);
		return `[Context] Current search: ${search.length ? search.join(', ') : 'none'}. Saved roles: ${saved.length}. Applied: ${applied.length}. CV on file: ${$profile ? 'yes' : 'no'}.`;
	}

	/**
	 * Run one turn through the model. Returns false when the model could not be reached before
	 * anything happened, so the caller can fall back to the rule-based agent.
	 */
	async function askModel(msg: AgentMsg, said: string): Promise<boolean> {
		if (convo.length > MAX_CONVO) convo = []; // start afresh; the context note carries the search
		const startLength = convo.length;
		convo = [...convo, { role: 'user', content: [{ type: 'text', text: said }, { type: 'text', text: contextNote() }] }];
		const texts: string[] = [];
		let tools = 0;
		for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
			let data: { content: { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }[]; stop_reason: string };
			try {
				const res = await fetch('/api/agent/', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ messages: convo })
				});
				if (res.status === 429) {
					const body = await res.json().catch(() => ({}));
					convo = convo.slice(0, startLength);
					modelState = 'off';
					update(msg, {
						thinking: false,
						text: body.scope === 'you'
							? 'You’ve reached today’s limit for the assistant, so I’m switching to simple search for now.'
							: 'The assistant is at its daily limit, so I’m switching to simple search for now.'
					});
					await wait(600);
					return false;
				}
				if (!res.ok) throw new Error(`agent ${res.status}`);
				data = await res.json();
				modelState = 'on';
			} catch {
				if (round === 0) {
					// never reached the model: forget this turn and let the rule-based agent answer
					convo = convo.slice(0, startLength);
					modelState = 'off';
					return false;
				}
				// mid-turn: the conversation now ends with unanswered tool calls, so start afresh
				convo = [];
				update(msg, { thinking: false, text: [...texts, 'I lost the connection partway through. Try that again?'].join('\n\n') });
				return true;
			}

			convo = [...convo, { role: 'assistant', content: data.content }];
			for (const block of data.content) if (block.type === 'text' && block.text?.trim()) texts.push(block.text.trim());
			update(msg, { thinking: false, text: texts.join('\n\n') });

			if (data.stop_reason === 'refusal') {
				update(msg, { text: texts.join('\n\n') || 'I can’t help with that one. Ask me about roles on the board.' });
				break;
			}
			const calls = data.content.filter((b) => b.type === 'tool_use');
			if (data.stop_reason !== 'tool_use' || !calls.length) break;

			const results = [];
			for (const call of calls) {
				const output = await runTool(msg, call.name ?? '', call.input ?? {});
				tools++;
				results.push({ type: 'tool_result', tool_use_id: call.id, content: output.text, ...(output.error ? { is_error: true } : {}) });
			}
			convo = [...convo, { role: 'user', content: results }];
			update(msg, { thinking: true });
		}
		update(msg, {
			thinking: false,
			traceTitle: tools ? `Used ${tools} tool${tools === 1 ? '' : 's'}` : '',
			traceOpen: false,
			suggestions: msg.proposal ? [] : nextMoves(brief, lastHits)
		});
		return true;
	}

	const pick = <T extends string>(value: unknown, allowed: readonly T[]): T[] =>
		Array.isArray(value) ? (value.filter((v) => allowed.includes(v as T)) as T[]) : [];
	const strings = (value: unknown): string[] =>
		Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean) : [];

	const INDUSTRY_SLUGS = CATEGORIES.filter((c) => c.kind === 'industry').map((c) => c.slug);
	const WORK_SLUGS = CATEGORIES.filter((c) => c.kind === 'work').map((c) => c.slug);

	function companyIds(names: string[]): { ids: string[]; unknown: string[] } {
		const ids: string[] = [];
		const unknown: string[] = [];
		for (const name of names) {
			const found = companies.find((c) => c.name.toLowerCase() === name.toLowerCase() || c.id === name.toLowerCase());
			if (found) ids.push(found.id);
			else unknown.push(name);
		}
		return { ids, unknown };
	}

	const jobSummary = (h: Hit) => ({
		id: h.job.id,
		title: h.job.title,
		company: h.job.company.name,
		industry: h.job.industry,
		work_type: h.job.workType,
		seniority: h.job.seniority || null,
		location: h.job.region || null,
		set_up: h.job.arrangement || h.job.mode || null,
		salary: h.job.salary || null,
		posted_days_ago: h.job.postedDays,
		match: h.score
	});

	const hitFor = (job: Job): Hit => lastHits.find((h) => h.job.id === job.id) ?? { job, score: -1, reasons: [] };
	const findJobs = (ids: unknown): Job[] =>
		strings(ids).map((id) => jobs.find((j) => j.id === id)).filter((j): j is Job => Boolean(j));

	function addStep(msg: AgentMsg, step: Step) {
		update(msg, { steps: [...msg.steps, step], shownSteps: msg.steps.length + 1 });
		toolCalls++;
	}

	async function runTool(msg: AgentMsg, name: string, input: Record<string, unknown>): Promise<{ text: string; error?: boolean }> {
		const started = performance.now();
		const done = (result: string) => addStep(msg, { tool: name, args: input, result, ms: Math.max(1, Math.round(performance.now() - started)) });

		if (name === 'search_jobs') {
			const only = companyIds(strings(input.companies));
			const not = companyIds(strings(input.exclude_companies));
			const salary = Number(input.min_salary_k);
			brief = {
				...EMPTY_BRIEF,
				industries: pick(input.industries, INDUSTRY_SLUGS),
				workTypes: pick(input.work_types, WORK_SLUGS),
				places: pick(input.places, ['london', 'uk', 'remote'] as const),
				modes: pick(input.modes, ['remote', 'hybrid', 'onsite'] as const),
				seniorities: pick(input.seniorities, ['junior', 'mid', 'senior', 'staff', 'manager'] as const),
				stages: pick(input.stages, STAGES.map((x) => x.value)),
				companies: only.ids,
				excluded: not.ids,
				keywords: strings(input.keywords).map((k) => k.toLowerCase()).slice(0, 5),
				minSalary: Number.isFinite(salary) && salary > 0 ? Math.round(salary) : 0,
				fresh: input.new_only === true
			};
			const { hits } = runBrief(brief, jobs);
			lastHits = hits;
			shownCount = Math.min(PAGE, hits.length);
			update(msg, { hits: hits.slice(0, PAGE), compare: [] });
			done(`${hits.length.toLocaleString()} matches`);
			return {
				text: JSON.stringify({
					total_matches: hits.length,
					shown_to_person: Math.min(PAGE, hits.length),
					unknown_companies: [...only.unknown, ...not.unknown],
					best: hits.slice(0, 8).map(jobSummary)
				})
			};
		}

		if (name === 'get_job') {
			const job = jobs.find((j) => j.id === String(input.job_id));
			done(job ? job.title : 'not found');
			if (!job) return { text: 'No role with that id.', error: true };
			return {
				text: JSON.stringify({
					...jobSummary(hitFor(job)),
					description: job.description.slice(0, 1500),
					company_about: job.company.blurb.slice(0, 400),
					company_stage: stageLabel(job.company.stage) || null,
					company_size: job.company.size || null,
					has_apply_link: Boolean(job.applyUrl),
					saved: Boolean($tracked[job.id]),
					applied: $tracked[job.id]?.status === 'applied'
				})
			};
		}

		if (name === 'compare_jobs') {
			const found = findJobs(input.job_ids).slice(0, 3).map(hitFor);
			update(msg, { compare: found.length >= 2 ? found : [] });
			done(`${found.length} roles side by side`);
			if (found.length < 2) return { text: 'Need at least two known role ids.', error: true };
			return { text: JSON.stringify(found.map((h) => ({ ...jobSummary(h), company_stage: stageLabel(h.job.company.stage) || null }))) };
		}

		if (name === 'save_jobs') {
			const fresh = findJobs(input.job_ids).filter((j) => !$tracked[j.id]);
			if (fresh.length) update(msg, { proposal: { kind: 'save', jobs: fresh, status: 'pending' } });
			done(fresh.length ? `asked to confirm ${fresh.length}` : 'nothing new to save');
			return { text: fresh.length ? `A card asking the person to confirm saving ${fresh.length} role(s) is shown. Nothing is saved until they confirm.` : 'Those roles are already saved, or the ids were not found.' };
		}

		if (name === 'watch_search') {
			const summary = briefChips(brief, companies).map((c) => c.label).join(' · ') || 'Everything on the board';
			update(msg, { proposal: { kind: 'watch', brief, summary, status: 'pending' } });
			done('asked to confirm');
			return { text: `A card asking the person to confirm a daily watch for "${summary}" is shown.` };
		}

		if (name === 'apply_to_jobs') {
			const ids = findJobs(input.job_ids).map((j) => j.id);
			if (!ids.length) {
				done('no known roles');
				return { text: 'None of those role ids were found.', error: true };
			}
			const hadProfile = Boolean($profile);
			const missing = $profile ? nextQuestion($profile) : null;
			await startApply(agentSay({ thinking: true }), { count: ids.length, companies: [], ids });
			done(!hadProfile ? 'needs a CV' : missing ? 'needs form answers' : 'review card shown');
			return {
				text: !hadProfile
					? 'The person has no CV on file. The site asked them to upload one; it will continue the applications afterwards. Tell them briefly.'
					: missing
					? 'The site is asking the person the application questions it still needs, then it will show the filled forms. Tell them briefly.'
					: 'The filled applications are shown for the person to review and confirm. Nothing is sent until they confirm.'
			};
		}

		done('unknown tool');
		return { text: `Unknown tool ${name}.`, error: true };
	}

	/** Next moves after results: applying comes first once there is something to apply to. */
	const nextMoves = (b: Brief, hits: Hit[]): string[] =>
		[
			...(hits.length ? [$profile ? 'Apply to the top match' : 'Upload my CV to auto-apply'] : []),
			...suggestions(b, hits)
		].slice(0, 4);

	async function search(msg: AgentMsg, changes: Change[], final: boolean) {
		if (!changes.length && briefIsEmpty(brief)) {
			update(msg, {
				thinking: false,
				text:
					'I couldn’t pick out what you want yet. Mention a kind of role, an industry or a place, for example:',
				suggestions: EXAMPLES
			});
			return;
		}
		brief = applyChanges(brief, changes);
		const { hits, steps } = runBrief(brief, jobs);
		update(msg, { thinking: false });
		await play(msg, steps);
		lastHits = hits;
		shownCount = Math.min(PAGE, hits.length);
		if (!final) return;
		const heard = acknowledge(changes);
		const found = hits.length
			? `${count(hits.length)}. ${hits.length > PAGE ? `The best ${PAGE}:` : 'Here they are:'}`
			: 'Nothing fits every must-have right now.';
		update(msg, {
			text: [heard || (changes.length ? '' : 'Re-ran your brief.'), found].filter(Boolean).join(' '),
			hits: hits.slice(0, PAGE),
			suggestions: nextMoves(brief, hits),
			traceOpen: false
		});
	}

	async function removeChip(chip: Change) {
		if (busy) return;
		busy = true;
		const msg = agentSay({ thinking: true });
		const change: Change = { ...chip };
		brief = applyChanges(brief, [change]);
		const { hits, steps } = runBrief(brief, jobs);
		update(msg, { thinking: false });
		await play(msg, steps);
		lastHits = hits;
		shownCount = Math.min(PAGE, hits.length);
		update(msg, {
			text: `You removed ${chip.label}. Now ${count(hits.length)}.`,
			hits: hits.slice(0, PAGE),
			suggestions: nextMoves(brief, hits),
			traceOpen: false
		});
		busy = false;
	}

	function decide(msg: AgentMsg, approve: boolean) {
		const p = msg.proposal;
		if (!p || p.status !== 'pending') return;
		if (approve && p.kind === 'save') for (const j of p.jobs) setStatus(j.id, 'saved');
		if (approve && p.kind === 'watch')
			watches = [...watches, { summary: p.summary, brief: p.brief, at: Date.now() }];
		if (approve && p.kind === 'forget') {
			profile.set(null);
			interview = null;
			pendingApply = null;
		}
		p.status = approve ? 'done' : 'dismissed';
		messages = messages;
		if (approve && p.kind === 'apply') submitApplications(p.apps);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send(input);
		}
	}

	const argText = (args: Record<string, unknown>) =>
		Object.entries(args)
			.map(([k, v]) => `${k}=${Array.isArray(v) ? `[${v.join(',')}]` : v}`)
			.join(' ');

	const facts = (j: Job) =>
		[j.salary, seniorityLabel(j.seniority), j.arrangement || (j.mode ?? ''), j.region].filter(Boolean);

	const COMPARE_ROWS: [string, (h: Hit) => string][] = [
		['Match', (h) => `${h.score}%`],
		['Role', (h) => h.job.title],
		['Seniority', (h) => seniorityLabel(h.job.seniority) || '—'],
		['Pay', (h) => h.job.salary || 'Not published'],
		['Where', (h) => h.job.region || '—'],
		['Set-up', (h) => h.job.arrangement || '—'],
		['Stage', (h) => stageLabel(h.job.company.stage) || '—'],
		['Posted', (h) => (h.job.postedDays !== null ? ago(h.job.postedDays) : '—')],
		['Why', (h) => h.reasons.join(', ') || '—']
	];
	const STEP_LABELS: Record<string, string> = {
		'board.read': 'Reading the board',
		'board.filter': 'Applying your must-haves',
		'text.search': 'Searching descriptions',
		rank: 'Ranking matches',
		'cv.read': 'Reading your CV',
		'profile.extract': 'Picking out your details',
		'form.fetch': 'Opening the application forms',
		'form.fill': 'Filling in your answers',
		'application.submit': 'Submitting'
	};
	const SOURCE_LABEL = { cv: 'from CV', you: 'your answer', drafted: 'drafted' };
	$: applied = saved.filter((j) => $tracked[j.id]?.status === 'applied');
	const stepLabel = (tool: string | undefined) => STEP_LABELS[tool ?? ''] ?? 'Working';

	$: lastAgent = [...messages].reverse().find((m): m is AgentMsg => m.role === 'agent') ?? null;
</script>

<svelte:head>
	<title>Agent · orbbits job</title>
</svelte:head>

<div
	style={cssVars(palette)}
	class="agent flex h-screen flex-col bg-ag-bg text-ag-text antialiased"
>
	<!-- top bar: as quiet as possible -->
	<header class="shrink-0">
		<div class="mx-auto flex h-14 max-w-2xl items-center gap-4 px-5 text-sm">
			<a href="/" class="font-semibold tracking-tight text-ag-text hover:no-underline"
				>orbbits</a
			>
			<span class="text-ag-faint">/</span>
			<span class="text-ag-muted">agent</span>
			<div class="ml-auto flex items-center gap-1">
				<button
					class="flex h-8 w-8 items-center justify-center rounded-full text-ag-muted transition hover:bg-ag-surface hover:text-ag-text"
					on:click={toggleTheme}
					aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
					title={dark ? 'Light mode' : 'Dark mode'}
				>
					{#if dark}
						<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"
							><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg
						>
					{:else}
						<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
							><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg
						>
					{/if}
				</button>
				<button
					class="rounded-full px-3 py-1.5 text-ag-muted transition hover:bg-ag-surface hover:text-ag-text"
					on:click={() => (briefOpen = !briefOpen)}
					aria-expanded={briefOpen}
					>Saved{#if saved.length}<span class="ml-1.5 tabular-nums text-ag-text"
							>{saved.length}</span
						>{/if}</button
				>
				<a
					href="/"
					class="rounded-full px-3 py-1.5 text-ag-muted transition hover:bg-ag-surface hover:text-ag-text hover:no-underline"
					>Board</a
				>
			</div>
		</div>
	</header>

	<!-- one continuous conversation -->
	<section bind:this={thread} class="min-h-0 flex-1 overflow-y-auto">
		<div class="mx-auto flex min-h-full max-w-2xl flex-col px-5 pb-6">
			{#if !messages.length}
				<div class="my-auto py-10" in:fade={{ duration: 200 }}>
					<h1 class="text-[28px] font-semibold leading-tight tracking-tight">
						What are you looking for?
					</h1>
					<p class="mt-2 text-ag-muted">
						{#if ready && !offline}{jobs.length.toLocaleString()} open roles at {companies.length} top
							UK tech companies, updated every morning.{:else if offline}The board is offline right
							now.{:else}Loading the board…{/if}
					</p>
					<ul class="mt-8 -mx-3">
						{#each EXAMPLES as ex}
							<li>
								<button
									class="group flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-ag-surface disabled:opacity-40"
									disabled={!ready}
									on:click={() => send(ex)}
								>
									<span>{ex}</span>
									<span
										class="text-ag-faint transition group-hover:translate-x-0.5 group-hover:text-ag-text"
										aria-hidden="true">→</span
									>
								</button>
							</li>
						{/each}
						<li>
							<button
								class="group flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-ag-surface disabled:opacity-40"
								disabled={!ready}
								on:click={() => fileInput.click()}
							>
								<span
									>{$profile ? `Apply with ${$profile.cvName}` : 'Upload your CV to auto-apply'}</span
								>
								<span class="text-ag-faint transition group-hover:text-ag-text" aria-hidden="true"
									>+</span
								>
							</button>
						</li>
					</ul>
				</div>
			{:else}
				<ol class="space-y-8 pt-6">
					{#each messages as m (m.id)}
						{#if m.role === 'user'}
							<li class="flex justify-end" in:fly={{ y: 6, duration: 160 }}>
								<p
									class="max-w-[80%] rounded-3xl bg-ag-surface px-4 py-2.5 leading-6"
								>
									{m.text}
								</p>
							</li>
						{:else}
							<li class="space-y-4" in:fade={{ duration: 160 }}>
								<!-- status, then a collapsed trace of what the agent did -->
								{#if m.thinking || (m.steps.length && m.shownSteps < m.steps.length)}
									<p class="shimmer text-sm">
										{m.thinking ? 'Thinking' : stepLabel(m.steps[m.shownSteps]?.tool)}…
									</p>
								{:else if m.steps.length}
									<button
										class="flex items-center gap-1.5 text-sm text-ag-faint transition hover:text-ag-text"
										on:click={() => {
											m.traceOpen = !m.traceOpen;
											messages = messages;
										}}
										aria-expanded={m.traceOpen}
									>
										{m.traceTitle || `Searched ${m.steps[0].result.split(' ')[0]} roles in ${m.steps.length} steps`}
										<svg
											viewBox="0 0 20 20"
											class="h-3 w-3 transition {m.traceOpen ? 'rotate-180' : ''}"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											aria-hidden="true"><path d="M5 8l5 5 5-5" /></svg
										>
									</button>
								{/if}
								{#if m.traceOpen && m.shownSteps === m.steps.length && m.steps.length}
									<ol
										transition:slide={{ duration: 150 }}
										class="space-y-1 border-l border-ag-line pl-4 font-mono text-xs text-ag-muted"
									>
										{#each m.steps as s}
											<li>
												<span class="text-ag-text">{s.tool}</span>
												{argText(s.args)}
												<span class="block text-ag-faint">→ {s.result} · {s.ms}ms</span>
											</li>
										{/each}
									</ol>
								{/if}

								{#if m.text}
									<p class="whitespace-pre-line leading-7" in:fade={{ duration: 150 }}>{m.text}</p>
								{/if}

								{#if m.profileCard}
									<div class="rounded-3xl bg-ag-surface p-5 text-sm">
										<p class="flex items-center gap-2 text-ag-muted">
											<svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"
												><path d="M5 2.5h6.5L15 6v11.5H5z" /><path d="M11.5 2.5V6H15" /></svg
											>
											{m.profileCard.cvName}
										</p>
										<dl class="mt-3 grid grid-cols-[7rem_1fr] gap-x-4">
											{#each profileRows(m.profileCard) as [label, value]}
												<dt class="border-t border-ag-line py-2 text-ag-faint">{label}</dt>
												<dd class="min-w-0 break-words border-t border-ag-line py-2">{value}</dd>
											{/each}
											{#each QUESTIONS.filter((q) => m.profileCard?.answers[q.key] && !['name', 'email', 'phone', 'location'].includes(q.key)) as q}
												<dt class="border-t border-ag-line py-2 text-ag-faint">{q.label}</dt>
												<dd class="border-t border-ag-line py-2">{m.profileCard.answers[q.key]}</dd>
											{/each}
										</dl>
									</div>
								{/if}

								{#if m.hits.length}
									<ul class="-mx-3">
										{#each m.hits as h (h.job.id)}
											<li
												class="flex items-center gap-4 rounded-2xl px-3 py-3 transition hover:bg-ag-surface"
												in:fly={{ y: 4, duration: 160 }}
											>
												<Avatar company={h.job.company} size="md" />
												<a
													href={h.job.applyUrl || `/company/${h.job.company.id}`}
													target={h.job.applyUrl ? '_blank' : undefined}
													rel="noopener noreferrer"
													class="min-w-0 flex-1 text-inherit hover:no-underline"
												>
													<span class="block truncate font-medium">{h.job.title}</span>
													<span class="block truncate text-sm text-ag-muted">
														{[h.job.company.name, ...facts(h.job).slice(0, 3)].join(' · ')}
													</span>
													{#if h.reasons.length}
														<span class="block truncate text-xs text-ag-faint">
															{h.reasons.join(' · ')}
														</span>
													{/if}
												</a>
												{#if $tracked[h.job.id]?.status === 'applied'}
													<span class="rounded-full bg-ag-chip px-2 py-0.5 text-xs text-ag-muted">Applied</span>
												{:else if h.score >= 0}
													<span class="text-sm tabular-nums text-ag-faint" title="Match">{h.score}</span>
												{/if}
												<SaveButton jobId={h.job.id} />
											</li>
										{/each}
									</ul>
								{/if}

								{#if m.compare.length >= 2}
									<div class="overflow-x-auto rounded-3xl bg-ag-surface p-5">
										<div class="grid gap-x-4 text-sm" style="grid-template-columns: 5.5rem repeat({m.compare.length}, minmax(9rem, 1fr))">
											<span />
											{#each m.compare as h}
												<span class="flex items-center gap-2 pb-3 font-medium">
													<Avatar company={h.job.company} size="sm" />
													{h.job.company.name}
												</span>
											{/each}
											{#each COMPARE_ROWS as [name, get]}
												<span class="border-t border-ag-line py-2.5 text-ag-faint"
													>{name}</span
												>
												{#each m.compare as h}
													<span class="border-t border-ag-line py-2.5">{get(h)}</span>
												{/each}
											{/each}
										</div>
									</div>
								{/if}

								<!-- an action the person confirms inline -->
								{#if m.proposal}
									<div class="rounded-3xl bg-ag-surface p-5">
										{#if m.proposal.kind === 'save'}
											<ul class="space-y-3">
												{#each m.proposal.jobs as j}
													<li class="flex items-center gap-3 text-sm">
														<Avatar company={j.company} size="sm" />
														<span class="min-w-0 flex-1 truncate"
															>{j.title}<span class="text-ag-faint">&nbsp;· {j.company.name}</span></span
														>
													</li>
												{/each}
											</ul>
										{:else if m.proposal.kind === 'apply'}
											<ul class="-mx-2 space-y-1">
												{#each m.proposal.apps as app, i}
													<li class="rounded-2xl {m.proposal.open === i ? 'bg-ag-bg' : ''}">
														<button
															type="button"
															class="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left text-sm"
															on:click={() => {
																if (m.proposal?.kind === 'apply') m.proposal.open = m.proposal.open === i ? -1 : i;
																messages = messages;
															}}
															aria-expanded={m.proposal.open === i}
														>
															<Avatar company={app.job.company} size="sm" />
															<span class="min-w-0 flex-1">
																<span class="block truncate font-medium">{app.job.title}</span>
																<span class="block truncate text-xs text-ag-faint"
																	>{app.job.company.name} · {app.ats} · {app.fields.length + 1} answers</span
																>
															</span>
															<svg viewBox="0 0 20 20" class="h-3 w-3 shrink-0 text-ag-faint transition {m.proposal.open === i ? 'rotate-180' : ''}" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"
																><path d="M5 8l5 5 5-5" /></svg
															>
														</button>
														{#if m.proposal.open === i}
															<div class="px-3 pb-3 text-sm" transition:slide={{ duration: 150 }}>
																<dl class="grid grid-cols-[9rem_1fr_auto] gap-x-3">
																	{#each app.fields as f}
																		<dt class="border-t border-ag-line py-1.5 text-ag-faint">{f.label}</dt>
																		<dd class="min-w-0 truncate border-t border-ag-line py-1.5">{f.value}</dd>
																		<dd class="border-t border-ag-line py-1.5 text-right text-xs text-ag-faint">{SOURCE_LABEL[f.source]}</dd>
																	{/each}
																</dl>
																<p class="mt-3 text-ag-faint">Why do you want to work here? · drafted</p>
																<p class="mt-1 rounded-2xl bg-ag-surface p-3 leading-6">{app.note}</p>
															</div>
														{/if}
													</li>
												{/each}
											</ul>
										{:else if m.proposal.kind === 'forget'}
											<p class="text-sm">Your CV and every answer will be removed from this browser. You can upload again any time.</p>
										{:else}
											<p class="text-sm">
												<span class="text-ag-faint">Daily at 06:00 ·</span>
												{m.proposal.summary}
											</p>
										{/if}
										<div class="mt-5 flex items-center gap-2">
											{#if m.proposal.status === 'pending'}
												<button
													class="flex-1 rounded-full bg-ag-accent py-2.5 text-sm font-medium text-ag-on-accent transition hover:opacity-80"
													on:click={() => decide(m, true)}
													>{m.proposal.kind === 'save'
														? 'Save'
														: m.proposal.kind === 'apply'
														? `Apply to ${m.proposal.apps.length}`
														: m.proposal.kind === 'forget'
														? 'Delete'
														: 'Watch'}</button
												>
												<button
													class="flex-1 rounded-full py-2.5 text-sm font-medium text-ag-muted transition hover:bg-ag-raised"
													on:click={() => decide(m, false)}>Not now</button
												>
											{:else}
												<p class="text-sm text-ag-muted">
													{m.proposal.status === 'done'
														? { save: '✓ Saved', watch: '✓ Watching', apply: '✓ Sent for submission', forget: '✓ Deleted' }[m.proposal.kind]
														: 'Cancelled'}
												</p>
											{/if}
										</div>
									</div>
								{/if}
							</li>
						{/if}
					{/each}
				</ol>
			{/if}
		</div>
	</section>

	<!-- composer, with the brief attached as context -->
	<div class="shrink-0 bg-ag-bg pb-5 pt-2">
		<div class="mx-auto max-w-2xl px-5">
			{#if lastAgent && lastAgent.suggestions.length && !busy}
				<div class="mb-3 flex gap-2 overflow-x-auto pb-1" in:fade={{ duration: 150 }}>
					{#each lastAgent.suggestions as s}
						<button
							class="shrink-0 rounded-full border border-ag-line px-3.5 py-1.5 text-sm text-ag-muted transition hover:border-ag-text hover:text-ag-text"
							on:click={() => send(s)}>{s}</button
						>
					{/each}
				</div>
			{/if}
			<form
				class="rounded-[28px] border border-ag-line bg-ag-input p-2 shadow-[0_2px_24px_-8px_rgba(0,0,0,0.12)] transition focus-within:border-ag-faint"
				on:submit|preventDefault={() => send(input)}
			>
				{#if chips.length}
					<ul class="flex flex-wrap gap-1.5 px-2 pt-1 pb-1">
						{#each chips as c (c.field + c.value)}
							<li transition:fade={{ duration: 120 }}>
								<button
									type="button"
									class="flex items-center gap-1 rounded-full bg-ag-chip py-0.5 pl-2.5 pr-2 text-xs text-ag-muted transition hover:bg-ag-raised hover:text-ag-text"
									on:click={() => removeChip(c)}
									disabled={busy}
									aria-label="Remove {c.label}"
									>{c.label}<span class="text-ag-faint">×</span></button
								>
							</li>
						{/each}
					</ul>
				{/if}
				<div class="flex items-end gap-1">
					<input
						bind:this={fileInput}
						type="file"
						accept=".pdf,.txt,.md,application/pdf,text/plain"
						class="hidden"
						on:change={onFile}
					/>
					<button
						type="button"
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ag-faint transition hover:bg-ag-surface hover:text-ag-text"
						on:click={() => fileInput.click()}
						disabled={busy || !ready}
						aria-label={$profile ? 'Replace your CV' : 'Attach your CV'}
						title={$profile ? `CV: ${$profile.cvName}` : 'Attach your CV'}
					>
						<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
							><path d="M21 11.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-9 9a1.8 1.8 0 0 1-2.6-2.6l8.3-8.3" /></svg
						>
					</button>
					<textarea
						bind:this={composer}
						bind:value={input}
						on:keydown={onKey}
						rows="1"
						placeholder={!ready ? 'Loading…' : interview ? 'Type your answer…' : 'Ask for a role, or refine…'}
						class="max-h-40 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent px-2 py-2 placeholder:text-ag-faint focus:ring-0"
					/>
					<button
						type="submit"
						disabled={busy || !ready || !input.trim()}
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ag-accent text-ag-on-accent transition hover:opacity-80 disabled:bg-ag-chip disabled:text-ag-faint"
						aria-label="Send"
					>
						<svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
							><path d="M10 16V4M5 9l5-5 5 5" /></svg
						>
					</button>
				</div>
			</form>
		</div>
	</div>

	<!-- saved roles and watches, in a sheet -->
	{#if briefOpen}
		<div class="fixed inset-0 z-30 bg-black/20 dark:bg-black/60" transition:fade={{ duration: 150 }} on:click={() => (briefOpen = false)} />
		<aside
			class="fixed inset-y-0 right-0 z-40 w-full max-w-sm overflow-y-auto bg-ag-bg p-6 shadow-2xl"
			transition:fly={{ x: 40, duration: 200 }}
		>
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">You</h2>
				<button class="text-ag-faint hover:text-ag-text" aria-label="Close" on:click={() => (briefOpen = false)}>✕</button>
			</div>
			{#if $profile}
				<div class="mt-4 rounded-2xl bg-ag-surface p-4 text-sm">
					<p class="font-medium">{$profile.name || 'Your profile'}</p>
					<p class="text-ag-muted">{[$profile.email, $profile.cvName].filter(Boolean).join(' · ')}</p>
					<p class="mt-1 text-xs text-ag-faint">
						{QUESTIONS.filter((q) => q.known($profile)).length} of {QUESTIONS.length} form questions answered
					</p>
					<div class="mt-3 flex gap-3 text-xs">
						<button class="text-ag-muted hover:text-ag-text" on:click={() => { briefOpen = false; send('Show my profile'); }}>View</button>
						<button class="text-ag-muted hover:text-ag-text" on:click={() => fileInput.click()}>Replace CV</button>
						<button class="text-ag-muted hover:text-ag-text" on:click={() => { briefOpen = false; send('Forget my CV'); }}>Delete</button>
					</div>
				</div>
			{:else}
				<button class="mt-4 w-full rounded-2xl border border-dashed border-ag-line p-4 text-left text-sm text-ag-muted hover:border-ag-faint" on:click={() => fileInput.click()}>
					Upload your CV to let the agent apply for you.
				</button>
			{/if}

			<h2 class="mt-10 text-lg font-semibold">Saved and applied</h2>
			{#if saved.length}
				<ul class="mt-4 -mx-2">
					{#each saved as j (j.id)}
						<li class="flex items-center gap-3 rounded-2xl px-2 py-2.5" transition:slide={{ duration: 150 }}>
							<Avatar company={j.company} size="sm" />
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-medium">{j.title}</span>
								<span class="block truncate text-xs text-ag-muted"
									>{j.company.name}{$tracked[j.id]?.status === 'applied' ? ' · Applied' : ''}</span
								>
							</span>
							<button class="text-ag-faint hover:text-ag-text" aria-label="Remove {j.title}" on:click={() => setStatus(j.id, null)}>✕</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-4 text-sm text-ag-muted">Nothing yet. Ask the agent to save roles.</p>
			{/if}

			<h2 class="mt-10 text-lg font-semibold">Watching</h2>
			{#if watches.length}
				<ul class="mt-4 space-y-3">
					{#each watches as w, i}
						<li class="flex items-start gap-3 text-sm">
							<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
							<span class="flex-1">{w.summary}<span class="block text-xs text-ag-faint">Daily at 06:00</span></span>
							<button class="text-ag-faint hover:text-ag-text" aria-label="Stop watching" on:click={() => (watches = watches.filter((_, k) => k !== i))}>✕</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-4 text-sm text-ag-muted">Ask the agent to watch a search.</p>
			{/if}

			<button class="mt-10 text-xs text-ag-faint hover:text-ag-text" on:click={() => (showJson = !showJson)}
				>{showJson ? 'Hide' : 'Show'} brief as JSON · {toolCalls} tool calls</button
			>
			{#if showJson}
				<pre transition:slide={{ duration: 150 }} class="mt-2 overflow-x-auto rounded-2xl bg-ag-surface p-4 text-[11px] leading-relaxed text-ag-text">{briefJson}</pre>
			{/if}
		</aside>
	{/if}
</div>

<style>
	.agent {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}
	/* a soft moving highlight on the status line while the agent works */
	.shimmer {
		background: linear-gradient(90deg, var(--ag-faint) 0%, var(--ag-faint) 40%, var(--ag-text) 50%, var(--ag-faint) 60%, var(--ag-faint) 100%);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		animation: shimmer 1.4s linear infinite;
	}
	@keyframes shimmer {
		from {
			background-position: 100% 0;
		}
		to {
			background-position: -100% 0;
		}
	}
</style>
