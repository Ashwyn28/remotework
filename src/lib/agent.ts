/**
 * A small, local job-search agent for the /agent demo.
 *
 * It turns plain-language messages into changes to a structured brief, then runs the brief
 * through a fixed set of tools over the board (search, filter, rank) and reports every step.
 * Nothing here calls a model: parsing is rule-based so the demo works offline. The tool
 * shapes are the ones a model-backed agent would call, so swapping the parser for an LLM
 * later leaves the UI unchanged.
 */
import {
	CATEGORIES,
	EMPTY_PREFERENCES,
	getCategory,
	jobPlaces,
	matchScore,
	MATCH_THRESHOLD,
	NEW_DAYS,
	PLACES,
	salaryTop,
	seniorityLabel,
	STAGES,
	stageLabel,
	topJobs,
	WORK_MODES
} from './board';
import type { Company, Job, Place, Preferences, Seniority, Stage, WorkMode } from './board';

export interface Brief extends Preferences {
	modes: WorkMode[];
	/** only these companies (ids) */
	companies: string[];
	/** never these companies (ids) */
	excluded: string[];
	/** words that must appear in the title or description */
	keywords: string[];
	/** only roles posted in the last NEW_DAYS days */
	fresh: boolean;
}

export const EMPTY_BRIEF: Brief = {
	...EMPTY_PREFERENCES,
	modes: [],
	companies: [],
	excluded: [],
	keywords: [],
	fresh: false
};

export type ListField =
	| 'industries'
	| 'workTypes'
	| 'places'
	| 'modes'
	| 'seniorities'
	| 'stages'
	| 'companies'
	| 'excluded'
	| 'keywords';

export interface Change {
	field: ListField | 'minSalary' | 'fresh';
	op: 'add' | 'remove' | 'set';
	value: string | number | boolean;
	label: string;
}

export type Command =
	| { kind: 'search' }
	| { kind: 'reset' }
	| { kind: 'more' }
	| { kind: 'save'; count: number }
	| { kind: 'compare' }
	| { kind: 'watch' }
	| { kind: 'shortlist' }
	| { kind: 'help' }
	| { kind: 'upload' }
	| { kind: 'profile' }
	| { kind: 'forget' }
	/** companies: ids named in the message; count: how many roles to apply to */
	| { kind: 'apply'; count: number; companies: string[] };

export interface Step {
	tool: string;
	args: Record<string, unknown>;
	result: string;
	ms: number;
}

export interface Hit {
	job: Job;
	score: number;
	reasons: string[];
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

const INDUSTRY_WORDS: [RegExp, string][] = [
	[/\b(fintech|payments?|banking|banks?|lending|crypto)\b/i, 'fintech'],
	[/\b(ai|a\.i\.|llms?|frontier|model labs?|genai|artificial intelligence)\b/i, 'ai'],
	[/\b(climate|energy|clean ?tech|carbon|sustainab\w*)\b/i, 'climate-and-energy'],
	[/\b(health\w*|bio\w*|life sciences?|drug discovery|medical|pharma)\b/i, 'health-and-life-sciences'],
	[/\b(defen[cs]e|military|national security)\b/i, 'defence-and-security'],
	[/\b(robot\w*|deep ?tech|quantum|self-driving|autonomous vehicles?)\b/i, 'robotics-and-deep-tech'],
	[/\b(dev ?tools|developer tools|infra|infrastructure companies|saas|cloud|b2b software)\b/i, 'software-and-infrastructure'],
	[/\b(consumer|social apps?)\b/i, 'consumer'],
	[/\b(big tech|faang|mag(nificent)? ?7|magnificent seven)\b/i, 'magnificent-7']
];

const WORK_WORDS: [RegExp, string][] = [
	[/\b(engineer\w*|developers?|dev|swe|software|backend|back-end|frontend|front-end|full[- ]?stack|sre|devops)\b/i, 'engineering'],
	[/\b(design\w*|ux|ui designer)\b/i, 'design'],
	[/\b(product(?!\s+(engineer|design))\w*|pms?)\b/i, 'product'],
	[/\b(data|analyst|analytics|data scien\w*)\b/i, 'data'],
	[/\b(marketing|growth|content|brand)\b/i, 'marketing'],
	[/\b(sales|account exec\w*|aes?|customer success|solutions engineer\w*|bdr|sdr)\b/i, 'sales'],
	[/\b(operations|ops|people team|recruit\w*|finance roles?|support)\b/i, 'operations']
];

const PLACE_WORDS: [RegExp, Place][] = [
	[/\blondon\b/i, 'london'],
	[/\b(manchester|edinburgh|glasgow|bristol|cambridge|oxford|leeds|cardiff|belfast|birmingham|elsewhere in the uk|outside london)\b/i, 'uk'],
	[/\b(remote|wfh|work from home|from home)\b/i, 'remote']
];

const MODE_WORDS: [RegExp, WorkMode][] = [
	[/\bhybrid\b/i, 'hybrid'],
	[/\b(on-?site|in[- ]office|office-based)\b/i, 'onsite']
];

const SENIORITY_WORDS: [RegExp, Seniority][] = [
	[/\b(junior|graduate|grad|entry[- ]level|intern\w*)\b/i, 'junior'],
	[/\b(mid[- ]?level|mid)\b/i, 'mid'],
	[/\b(senior|snr|sr)\b/i, 'senior'],
	[/\b(staff|principal|lead|tech lead)\b/i, 'staff'],
	[/\b(manager|head of|director|vp|leadership)\b/i, 'manager']
];

const STAGE_WORDS: [RegExp, Stage[]][] = [
	[/\b(early[- ]stage|startups?)\b/i, ['seed', 'series-a', 'series-b']],
	[/\bseed\b/i, ['seed']],
	[/\bseries ?a\b/i, ['series-a']],
	[/\bseries ?b\b/i, ['series-b']],
	[/\b(scale-?ups?|series ?c|late[- ]stage)\b/i, ['series-c-plus']],
	[/\b(public|listed|big compan\w*)\b/i, ['public']],
	[/\bbootstrapped\b/i, ['bootstrapped']]
];

/** Skills worth matching in titles and descriptions. */
const SKILLS = [
	'rust', 'go', 'golang', 'python', 'typescript', 'javascript', 'react', 'kotlin', 'swift',
	'java', 'scala', 'c\\+\\+', 'kubernetes', 'terraform', 'aws', 'gcp', 'ml', 'machine learning',
	'llm', 'research', 'security', 'platform', 'ios', 'android', 'mobile', 'payments', 'risk',
	'fraud', 'compliance', 'gpu', 'cuda', 'robotics', 'embedded', 'firmware', 'distributed systems',
	'infrastructure', 'reliability', 'data engineer', 'analytics engineer', 'growth', 'brand'
];
const SKILL_RE = new RegExp(`\\b(${SKILLS.join('|')})\\b`, 'gi');

/** Company names that are ordinary words: match only when typed with a capital letter. */
const COMMON_NAMES = new Set([
	'linear', 'notion', 'relation', 'resend', 'elastic', 'humanoid', 'faculty', 'ramp', 'mercury',
	'tide', 'paddle', 'apple', 'amazon', 'meta', 'oxa', 'granola', 'lovable', 'multiverse', 'pleo'
]);

const NEGATION = /\b(not|no|without|except|exclude|excluding|drop|remove|skip|avoid|never)\s+(?:at\s+|in\s+|the\s+)?$/i;

const label = {
	industry: (slug: string) => getCategory(slug, 'industry').name,
	work: (slug: string) => getCategory(slug, 'work').name,
	place: (p: string) => PLACES.find((x) => x.value === p)?.label ?? p,
	mode: (m: string) => WORK_MODES.find((x) => x.value === m)?.label ?? m,
	seniority: (s: string) => seniorityLabel(s) || s,
	stage: (s: string) => stageLabel(s) || s
};

/** Is the match at `index` preceded by a negation such as "not" or "no"? */
const negated = (text: string, index: number) => NEGATION.test(text.slice(Math.max(0, index - 24), index));

function scan<T extends string>(
	text: string,
	words: [RegExp, T | T[]][],
	field: ListField,
	name: (v: string) => string
): Change[] {
	const out: Change[] = [];
	for (const [re, value] of words) {
		const m = new RegExp(re.source, 'gi').exec(text);
		if (!m) continue;
		const op = negated(text, m.index) ? 'remove' : 'add';
		for (const v of Array.isArray(value) ? value : [value]) out.push({ field, op, value: v, label: name(v) });
	}
	return out;
}

// ---------------------------------------------------------------------------
// Understanding a message
// ---------------------------------------------------------------------------

export function understand(text: string, companies: Company[]): { changes: Change[]; command: Command } {
	const t = text.trim();
	const lower = t.toLowerCase();

	if (/^(reset|start over|clear( everything| all)?|new search)\b/i.test(t))
		return { changes: [], command: { kind: 'reset' } };
	if (/^(help|what can you do|\?)/i.test(t)) return { changes: [], command: { kind: 'help' } };

	const changes: Change[] = [
		...scan(t, INDUSTRY_WORDS, 'industries', label.industry),
		...scan(t, PLACE_WORDS, 'places', label.place),
		...scan(t, MODE_WORDS, 'modes', label.mode),
		...scan(t, SENIORITY_WORDS, 'seniorities', label.seniority),
		...scan(t, STAGE_WORDS, 'stages', label.stage)
	];

	changes.push(...scan(t, WORK_WORDS, 'workTypes', label.work));

	// pay: "over £120k", "at least 100k", "100k+"
	const pay = /(?:£|\$|€)?\s?(\d{2,3})\s?k\b\+?/i.exec(t);
	if (pay) {
		const k = Number(pay[1]);
		changes.push({ field: 'minSalary', op: 'set', value: k, label: `£${k}k or more` });
	}
	if (/\b(any (pay|salary)|don'?t care about (pay|salary))\b/i.test(t))
		changes.push({ field: 'minSalary', op: 'set', value: 0, label: 'Any pay' });

	if (/\b(new|fresh|recent|this week|latest|just posted)\b/i.test(t) && !/\bnew search\b/i.test(t))
		changes.push({ field: 'fresh', op: 'set', value: true, label: `Posted in the last ${NEW_DAYS} days` });

	// skills, skipping words already understood as a work type ("data", "growth")
	const seen = new Set<string>();
	for (const m of t.matchAll(SKILL_RE)) {
		const word = m[1].toLowerCase();
		if (seen.has(word) || (word === 'go' && !/\bgo(lang)?\b(?! to| for| with| back)/.test(lower))) continue;
		if (['growth', 'brand', 'payments', 'infrastructure'].includes(word) && changes.length) continue;
		seen.add(word);
		changes.push({
			field: 'keywords',
			op: negated(t, m.index ?? 0) ? 'remove' : 'add',
			value: word === 'golang' ? 'go' : word,
			label: word === 'c\\+\\+' ? 'C++' : word
		});
	}

	// companies
	for (const c of companies) {
		const name = c.name;
		const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, COMMON_NAMES.has(name.toLowerCase()) ? '' : 'i');
		const m = re.exec(t);
		if (!m) continue;
		const not = negated(t, m.index);
		changes.push({ field: not ? 'excluded' : 'companies', op: 'add', value: c.id, label: not ? `Not ${name}` : `At ${name}` });
	}

	let command: Command = { kind: 'search' };
	const named = changes.filter((c) => c.field === 'companies').map((c) => String(c.value));
	const apply = /\b(?:auto[- ]?)?apply\b(?:\s+(?:to|for))?(?:\s+(?:the\s+)?(?:top|first|best))?\s*(\d+|all|these|them|those|both|it|this|that)?/i.exec(t);
	if (/\b(forget|delete|remove|clear)\b.*\b(cv|resume|résumé|profile|my details)\b/i.test(t))
		return { changes: [], command: { kind: 'forget' } };
	if (/\b(upload|attach|add|here'?s|send)\b.*\b(cv|resume|résumé)\b|^(cv|resume)$/i.test(t))
		return { changes: [], command: { kind: 'upload' } };
	if (/\b(my profile|about me|what do you know|my answers|my details)\b/i.test(t))
		return { changes: [], command: { kind: 'profile' } };
	if (apply) {
		const n = apply[1]?.toLowerCase();
		const count = !n ? 1 : /\d/.test(n) ? Number(n) : n === 'both' ? 2 : ['it', 'this', 'that'].includes(n) ? 1 : 5;
		// naming a company picks roles there; applying never changes the brief
		return {
			changes: [],
			command: { kind: 'apply', count: Math.min(count, 10), companies: named }
		};
	}
	const save = /\bsave\s+(?:the\s+)?(?:top|first|best)?\s*(\d+|all|these|them|those)?/i.exec(t);
	if (save) {
		const n = save[1];
		command = { kind: 'save', count: !n ? 3 : /\d/.test(n) ? Number(n) : 10 };
	} else if (/\b(compare|vs\.?|versus|side by side)\b/i.test(t)) command = { kind: 'compare' };
	else if (/\b(watch|alert|notify|keep (an )?eye|every (day|morning))\b/i.test(t)) command = { kind: 'watch' };
	else if (/\b(shortlist|saved|applications|applied|what (have|did) i (save|appl\w*))\b/i.test(t)) command = { kind: 'shortlist' };
	else if (/^(more|show more|next|keep going|others?)\b/i.test(t)) command = { kind: 'more' };

	return { changes, command };
}

export function applyChanges(brief: Brief, changes: Change[]): Brief {
	const next: Brief = JSON.parse(JSON.stringify(brief));
	for (const c of changes) {
		if (c.field === 'minSalary') next.minSalary = Number(c.value);
		else if (c.field === 'fresh') next.fresh = Boolean(c.value);
		else {
			const list = next[c.field] as string[];
			const v = String(c.value);
			if (c.op === 'add' && !list.includes(v)) list.push(v);
			if (c.op === 'remove') next[c.field] = list.filter((x) => x !== v) as never;
			// naming a company to include lifts an earlier exclusion, and the other way round
			if (c.field === 'companies' && c.op === 'add') next.excluded = next.excluded.filter((x) => x !== v);
			if (c.field === 'excluded' && c.op === 'add') next.companies = next.companies.filter((x) => x !== v);
		}
	}
	return next;
}

export function briefIsEmpty(b: Brief): boolean {
	return (
		!b.industries.length && !b.workTypes.length && !b.places.length && !b.modes.length &&
		!b.seniorities.length && !b.stages.length && !b.companies.length && !b.excluded.length &&
		!b.keywords.length && !b.minSalary && !b.fresh
	);
}

/** Every criterion in the brief as a removable chip. */
export function briefChips(b: Brief, companies: Company[]): Change[] {
	const name = (id: string) => companies.find((c) => c.id === id)?.name ?? id;
	return [
		...b.industries.map((v) => ({ field: 'industries', op: 'remove', value: v, label: label.industry(v) })),
		...b.workTypes.map((v) => ({ field: 'workTypes', op: 'remove', value: v, label: label.work(v) })),
		...b.places.map((v) => ({ field: 'places', op: 'remove', value: v, label: label.place(v) })),
		...b.modes.map((v) => ({ field: 'modes', op: 'remove', value: v, label: label.mode(v) })),
		...b.seniorities.map((v) => ({ field: 'seniorities', op: 'remove', value: v, label: label.seniority(v) })),
		...b.stages.map((v) => ({ field: 'stages', op: 'remove', value: v, label: label.stage(v) })),
		...b.keywords.map((v) => ({ field: 'keywords', op: 'remove', value: v, label: `“${v}”` })),
		...b.companies.map((v) => ({ field: 'companies', op: 'remove', value: v, label: `At ${name(v)}` })),
		...b.excluded.map((v) => ({ field: 'excluded', op: 'remove', value: v, label: `Not ${name(v)}` })),
		...(b.minSalary ? [{ field: 'minSalary', op: 'set', value: 0, label: `£${b.minSalary}k+` }] : []),
		...(b.fresh ? [{ field: 'fresh', op: 'set', value: false, label: `Last ${NEW_DAYS} days` }] : [])
	] as Change[];
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const wordRe = (w: string) => new RegExp(`\\b${w}\\b`, 'i');

/** Run the brief over the board, recording each tool call. */
export function runBrief(brief: Brief, jobs: Job[]): { hits: Hit[]; steps: Step[] } {
	const steps: Step[] = [];
	const time = <T>(tool: string, args: Record<string, unknown>, fn: () => T, describe: (r: T) => string): T => {
		const start = performance.now();
		const r = fn();
		steps.push({ tool, args, result: describe(r), ms: Math.max(1, Math.round(performance.now() - start)) });
		return r;
	};

	const all = time('board.read', { source: '/data/board.json' }, () => topJobs(jobs), (r) => `${r.length.toLocaleString()} open roles at top companies`);

	const hard = time(
		'board.filter',
		compact({
			industries: brief.industries, work_types: brief.workTypes, places: brief.places,
			modes: brief.modes, companies: brief.companies, exclude: brief.excluded,
			posted_within_days: brief.fresh ? NEW_DAYS : undefined
		}),
		() =>
			all.filter(
				(j) =>
					(!brief.modes.length || (j.mode !== null && brief.modes.includes(j.mode))) &&
					(!brief.companies.length || brief.companies.includes(j.company.id)) &&
					!brief.excluded.includes(j.company.id) &&
					(!brief.fresh || (j.postedDays !== null && j.postedDays <= NEW_DAYS)) &&
					matchScore(j, brief) > 0
			),
		(r) => `${r.length.toLocaleString()} roles pass the must-haves`
	);

	const kept = brief.keywords.length
		? time(
				'text.search',
				{ any_of: brief.keywords, fields: ['title', 'description'] },
				() => hard.filter((j) => brief.keywords.some((k) => wordRe(k).test(`${j.title} ${j.description}`))),
				(r) => `${r.length.toLocaleString()} mention ${brief.keywords.join(' or ')}`
		  )
		: hard;

	const hits = time(
		'rank',
		compact({
			seniority: brief.seniorities, stages: brief.stages,
			min_salary_k: brief.minSalary || undefined, threshold: MATCH_THRESHOLD
		}),
		() =>
			kept
				.map((job) => hit(job, brief))
				.filter((h) => h.score >= MATCH_THRESHOLD)
				.sort(
					(a, b) =>
						b.score - a.score ||
						a.job.company.rank - b.job.company.rank ||
						(a.job.postedDays ?? 999) - (b.job.postedDays ?? 999)
				),
		(r) => `${r.length.toLocaleString()} strong matches${r.length ? `, best ${r[0].score}%` : ''}`
	);

	return { hits, steps };
}

function hit(job: Job, brief: Brief): Hit {
	let score = matchScore(job, brief);
	const reasons: string[] = [];
	if (brief.industries.includes(job.industry)) reasons.push(label.industry(job.industry));
	if (brief.workTypes.includes(job.workType)) reasons.push(label.work(job.workType));
	const places = jobPlaces(job);
	const place = brief.places.find((p) => places.has(p));
	if (place) reasons.push(label.place(place));
	if (job.seniority && brief.seniorities.includes(job.seniority)) reasons.push(label.seniority(job.seniority));
	const top = salaryTop(job.salary);
	if (brief.minSalary && top !== null && top >= brief.minSalary) reasons.push(job.salaryEstimated ? `Est. up to £${top}k` : `Pays up to £${top}k`);
	for (const k of brief.keywords) {
		if (wordRe(k).test(job.title)) {
			reasons.push(`${k} in title`);
			score = Math.min(100, score + 5);
		} else if (wordRe(k).test(job.description)) reasons.push(`Mentions ${k}`);
	}
	if (job.postedDays !== null && job.postedDays <= NEW_DAYS) reasons.push('New this week');
	return { job, score, reasons };
}

function compact(o: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(o).filter(([, v]) => v !== undefined && !(Array.isArray(v) && !v.length))
	);
}

// ---------------------------------------------------------------------------
// Talking about results
// ---------------------------------------------------------------------------

/** What the agent heard, in one line: "Added AI, London. Dropped Sales." */
export function acknowledge(changes: Change[]): string {
	const added = changes.filter((c) => c.op === 'add' || (c.op === 'set' && c.value)).map((c) => c.label);
	const removed = changes.filter((c) => c.op === 'remove' || (c.op === 'set' && !c.value)).map((c) => c.label);
	const parts = [];
	if (added.length) parts.push(`Added ${list(added)} to your brief.`);
	if (removed.length) parts.push(`Dropped ${list(removed)}.`);
	return parts.join(' ');
}

export const list = (items: string[]): string =>
	items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/** Next moves worth offering, based on what the results look like. */
export function suggestions(brief: Brief, hits: Hit[]): string[] {
	const out: string[] = [];
	if (!brief.industries.length) out.push('Only AI and fintech');
	if (!brief.places.length) out.push('In London or remote');
	if (hits.length > 30 && !brief.seniorities.length) out.push('Senior and staff only');
	if (hits.length > 30 && !brief.minSalary) out.push('Over £100k');
	if (hits.length > 20 && !brief.fresh) out.push('Just the new ones');
	if (hits.length >= 2) out.push('Compare the top two');
	if (hits.length) out.push('Save the top 3');
	if (hits.length && !brief.fresh) out.push('Watch this every morning');
	if (!hits.length && brief.keywords.length) out.push(`Drop ${brief.keywords[0]}`);
	if (!hits.length && brief.minSalary) out.push('Any pay');
	// the busiest company among the results, as a quick way to narrow
	const counts = new Map<string, number>();
	for (const h of hits.slice(0, 40)) counts.set(h.job.company.name, (counts.get(h.job.company.name) ?? 0) + 1);
	const busiest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
	if (busiest && busiest[1] > 3 && !brief.companies.length) out.push(`Not ${busiest[0]}`);
	return out.slice(0, 4);
}

export const EXAMPLES = [
	'Senior backend roles at AI companies in London',
	'Remote platform engineering at fintechs, over £90k',
	'Rust or Go engineering at deep tech companies',
	'New machine learning roles this week'
];

export { CATEGORIES, STAGES };
