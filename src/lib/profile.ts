/**
 * The applicant profile behind auto-apply in the /agent demo: details read from a CV, answers
 * to the questions most application forms ask, and the filled form for a given job.
 *
 * Everything stays in this browser (localStorage). Nothing is sent to employers: submission is
 * simulated until there is a real route to each applicant tracking system.
 */
import { browser } from '$app/env';
import { writable } from 'svelte/store';
import { jobPlaces } from './board';
import type { Job, Place } from './board';

export interface Profile {
	cvName: string;
	/** plain text of the CV, capped */
	cvText: string;
	name: string;
	email: string;
	phone: string;
	location: string;
	linkedin: string;
	github: string;
	portfolio: string;
	headline: string;
	years: number | null;
	skills: string[];
	/** question key → answer; '' means skipped */
	answers: Record<string, string>;
}

export const EMPTY_PROFILE: Profile = {
	cvName: '',
	cvText: '',
	name: '',
	email: '',
	phone: '',
	location: '',
	linkedin: '',
	github: '',
	portfolio: '',
	headline: '',
	years: null,
	skills: [],
	answers: {}
};

function load(): Profile | null {
	if (!browser) return null;
	try {
		const saved = JSON.parse(localStorage.getItem('agent.profile') ?? 'null');
		return saved && typeof saved === 'object' ? { ...EMPTY_PROFILE, ...saved } : null;
	} catch {
		return null;
	}
}

export const profile = writable<Profile | null>(load());
if (browser)
	profile.subscribe((p) => {
		try {
			if (p) localStorage.setItem('agent.profile', JSON.stringify(p));
			else localStorage.removeItem('agent.profile');
		} catch {
			// storage full or blocked: keep it for this visit only
		}
	});

// ---------------------------------------------------------------------------
// Reading a CV
// ---------------------------------------------------------------------------

const MAX_TEXT = 30_000;

/** Plain text from a PDF or text file. Throws with a readable message otherwise. */
export async function readCv(file: File): Promise<{ text: string; pages: number }> {
	const name = file.name.toLowerCase();
	if (file.size > 10 * 1024 * 1024) throw new Error('That file is over 10 MB. Try a smaller PDF.');
	if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) {
		return { text: (await file.text()).slice(0, MAX_TEXT), pages: 1 };
	}
	if (!name.endsWith('.pdf') && file.type !== 'application/pdf')
		throw new Error('I can read PDF or plain-text CVs. Export a Word file as PDF and try again.');

	const pdfjs = await import('pdfjs-dist');
	const worker = (await import('pdfjs-dist/build/pdf.worker.min.js?url')).default;
	pdfjs.GlobalWorkerOptions.workerSrc = worker;
	const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
	const lines: string[] = [];
	for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
		const page = await doc.getPage(i);
		const content = await page.getTextContent();
		// rebuild lines from text runs: a run that ends a line carries hasEOL
		let line = '';
		for (const item of content.items as { str?: string; hasEOL?: boolean }[]) {
			line += item.str ?? '';
			if (item.hasEOL) {
				lines.push(line);
				line = '';
			}
		}
		if (line) lines.push(line);
	}
	const text = lines.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
	if (text.length < 40)
		throw new Error('I couldn’t find any text in that PDF. It may be a scanned image.');
	return { text: text.slice(0, MAX_TEXT), pages: doc.numPages };
}

const SKILL_WORDS = [
	'Python', 'TypeScript', 'JavaScript', 'Go', 'Rust', 'Java', 'Kotlin', 'Swift', 'Scala', 'C++', 'C#',
	'Ruby', 'SQL', 'React', 'Node.js', 'Svelte', 'Vue', 'Django', 'Rails', 'Kubernetes', 'Docker',
	'Terraform', 'AWS', 'GCP', 'Azure', 'PostgreSQL', 'Kafka', 'Spark', 'Airflow', 'dbt', 'PyTorch',
	'TensorFlow', 'Machine Learning', 'LLMs', 'Figma', 'Product Management', 'Analytics', 'Tableau',
	'Looker', 'Salesforce', 'GraphQL', 'iOS', 'Android', 'Security', 'Distributed Systems'
];

const UK_PLACES =
	/\b(London|Manchester|Edinburgh|Glasgow|Bristol|Cambridge|Oxford|Leeds|Cardiff|Belfast|Birmingham|Brighton|Remote)\b(?:,?\s*(?:UK|United Kingdom|England|Scotland))?/;

const TITLE_WORDS =
	/\b(engineer|developer|designer|manager|scientist|analyst|lead|director|architect|consultant|marketer|researcher|specialist|executive|founder)\b/i;

/** Pick out what an application form needs. Rule-based: good on tidy CVs, partial on others. */
export function extract(text: string): Partial<Profile> {
	const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
	const out: Partial<Profile> = {};

	const email = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(text);
	if (email) out.email = email[0];
	const phone = /(?:\+44\s?\(?0?\)?\s?|\b0)(?:\d[\s-]?){9,10}\b/.exec(text);
	if (phone) out.phone = phone[0].trim();
	const linkedin = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[\w-]+\/?/i.exec(text);
	if (linkedin) out.linkedin = withScheme(linkedin[0]);
	const github = /(?:https?:\/\/)?github\.com\/[\w-]+\/?/i.exec(text);
	if (github) out.github = withScheme(github[0]);

	// the name is usually the first short line made only of words
	const nameLine = lines.slice(0, 5).find((l) => /^[A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]+){1,3}$/.test(l));
	if (nameLine) out.name = nameLine;

	const place = UK_PLACES.exec(lines.slice(0, 12).join(' ')) ?? UK_PLACES.exec(text);
	if (place) out.location = place[1] === 'Remote' ? 'Remote, UK' : `${place[1]}, UK`;

	const headline = lines.slice(1, 15).find((l) => TITLE_WORDS.test(l) && l.length < 80 && !/@/.test(l));
	if (headline) out.headline = headline.replace(/\s*[|•·–-]\s*$/, '');

	// years of experience: span of the years in work dates, leaving out education
	const work = text.replace(/\n(education|qualifications|academic)\b[\s\S]*?(?=\n(experience|employment|work history|projects|skills)\b|$)/i, '\n');
	const years = [...work.matchAll(/\b(19[89]\d|20[0-3]\d)\b/g)].map((m) => Number(m[1]));
	const now = new Date().getFullYear();
	const present = /\b(present|current|now)\b/i.test(work);
	if (years.length >= 2) {
		const first = Math.min(...years);
		const last = present ? now : Math.max(...years);
		if (last - first > 0 && last - first < 45) out.years = last - first;
	}

	out.skills = SKILL_WORDS.filter((s) =>
		new RegExp(`(^|[^\\w+#])${s.replace(/[.+#]/g, '\\$&')}(?![\\w+#])`, s.length <= 3 ? '' : 'i').test(text)
	).slice(0, 12);
	return out;
}

const withScheme = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

// ---------------------------------------------------------------------------
// The questions most application forms ask
// ---------------------------------------------------------------------------

export interface Question {
	key: string;
	ask: string;
	/** quick replies; typing a free answer also works */
	choices: string[];
	/** turn a reply into a stored answer, or null when it is not an answer */
	parse: (reply: string) => string | null;
	/** already answered by the CV or earlier replies */
	known: (p: Profile) => boolean;
	label: string;
	show: (p: Profile) => string;
}

const yesNo = (reply: string): string | null =>
	/^(y|yes|yep|yeah|i do|correct|sure)\b/i.test(reply.trim())
		? 'Yes'
		: /^(n|no|nope|i don'?t|not)\b/i.test(reply.trim())
		? 'No'
		: null;

const fieldQuestion = (
	key: 'name' | 'email' | 'phone' | 'location',
	ask: string,
	label: string,
	valid: RegExp
): Question => ({
	key,
	ask,
	choices: [],
	parse: (r) => (valid.test(r.trim()) ? r.trim() : null),
	known: (p) => Boolean(p[key]) || key in p.answers,
	label,
	show: (p) => p[key] || p.answers[key] || '—'
});

export const QUESTIONS: Question[] = [
	fieldQuestion('name', 'I couldn’t find your name on the CV. What should applications use?', 'Name', /^[^\d@]{2,60}$/),
	fieldQuestion('email', 'What email should employers reply to?', 'Email', /^[\w.+-]+@[\w-]+\.[\w.-]+$/),
	fieldQuestion('phone', 'And a phone number? Say “skip” to leave it off.', 'Phone', /^\+?[\d\s()-]{9,18}$/),
	fieldQuestion('location', 'Where are you based?', 'Location', /^[^@]{2,60}$/),
	{
		key: 'rightToWork',
		ask: 'Do you have the right to work in the UK?',
		choices: ['Yes', 'No'],
		parse: yesNo,
		known: (p) => 'rightToWork' in p.answers,
		label: 'Right to work in the UK',
		show: (p) => p.answers.rightToWork || '—'
	},
	{
		key: 'sponsorship',
		ask: 'Will you need visa sponsorship, now or in the future?',
		choices: ['No', 'Yes'],
		parse: yesNo,
		known: (p) => 'sponsorship' in p.answers,
		label: 'Needs sponsorship',
		show: (p) => p.answers.sponsorship || '—'
	},
	{
		key: 'notice',
		ask: 'What’s your notice period?',
		choices: ['Immediately', '2 weeks', '1 month', '3 months'],
		parse: (r) => {
			const t = r.trim().toLowerCase();
			if (/^(now|immediate|asap|none|0)/.test(t)) return 'Immediately';
			const m = /(\d+)\s*(day|week|month)s?/.exec(t);
			if (m) return `${m[1]} ${m[2]}${m[1] === '1' ? '' : 's'}`;
			const words: Record<string, string> = { one: '1', two: '2', three: '3', four: '4', six: '6' };
			const w = /\b(one|two|three|four|six)\s*(week|month)s?/.exec(t);
			return w ? `${words[w[1]]} ${w[2]}${w[1] === 'one' ? '' : 's'}` : null;
		},
		known: (p) => 'notice' in p.answers,
		label: 'Notice period',
		show: (p) => p.answers.notice || '—'
	},
	{
		key: 'salary',
		ask: 'What salary are you looking for? A base figure like “£95k” is fine.',
		choices: ['£60k', '£80k', '£100k', '£130k', 'Prefer not to say'],
		parse: (r) => {
			if (/prefer not|rather not|open|flexible|negotiable/i.test(r)) return 'Open to discussion';
			const m = /£?\s?(\d{2,3})(?:[,.]?000|\s?k)\b/i.exec(r) ?? /^£?\s?(\d{2,3})$/.exec(r.trim());
			return m ? `£${m[1]}k` : null;
		},
		known: (p) => 'salary' in p.answers,
		label: 'Salary expectation',
		show: (p) => p.answers.salary || '—'
	},
	{
		key: 'setup',
		ask: 'Which ways of working suit you?',
		choices: ['Remote, hybrid or office', 'Remote or hybrid', 'Remote only', 'Office only'],
		parse: (r) => {
			const t = r.toLowerCase();
			if (/any|all|either|flexible|remote, hybrid or office/.test(t)) return 'Remote, hybrid or office';
			const parts = ['remote', 'hybrid', 'office'].filter((w) => t.includes(w) || (w === 'office' && /on-?site/.test(t)));
			if (!parts.length) return null;
			if (/only/.test(t) && parts.length === 1) return `${cap(parts[0])} only`;
			return parts.map(cap).join(' or ');
		},
		known: (p) => 'setup' in p.answers,
		label: 'Work set-up',
		show: (p) => p.answers.setup || '—'
	},
	{
		key: 'portfolio',
		ask: 'Any portfolio or personal site to include? Say “skip” if not.',
		choices: ['Skip'],
		parse: (r) => {
			const m = /(?:https?:\/\/)?[\w-]+(\.[\w-]+)+\S*/.exec(r);
			return m ? withScheme(m[0]) : null;
		},
		known: (p) => Boolean(p.portfolio || p.github) || 'portfolio' in p.answers,
		label: 'Portfolio',
		show: (p) => p.answers.portfolio || p.portfolio || p.github || '—'
	}
];

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

/** A reply that matches a quick-reply button keeps the button's wording. */
export const parseReply = (q: Question, reply: string): string | null =>
	q.choices.find((c) => c.toLowerCase() === reply.trim().toLowerCase() && c !== 'Skip') ?? q.parse(reply);

export const nextQuestion = (p: Profile): Question | null => QUESTIONS.find((q) => !q.known(p)) ?? null;

export const isSkip = (reply: string): boolean => /^(skip|pass|no thanks|none|leave it|n\/a)\b/i.test(reply.trim());

/** Store a reply: profile fields go on the profile itself, the rest in answers. */
export function answer(p: Profile, q: Question, value: string): Profile {
	const next = { ...p, answers: { ...p.answers, [q.key]: value } };
	if (['name', 'email', 'phone', 'location'].includes(q.key) && value)
		(next as unknown as Record<string, string>)[q.key] = value;
	if (q.key === 'portfolio' && value) next.portfolio = value;
	return next;
}

/** The facts read from a CV, as rows for a card. */
export function profileRows(p: Profile): [string, string][] {
	return (
		[
			['Name', p.name],
			['Email', p.email],
			['Phone', p.phone],
			['Location', p.location],
			['Current role', p.headline],
			['Experience', p.years ? `About ${p.years} years` : ''],
			['LinkedIn', p.linkedin.replace(/^https?:\/\/(www\.)?/, '')],
			['GitHub', p.github.replace(/^https?:\/\/(www\.)?/, '')],
			['Skills', p.skills.join(', ')]
		] as [string, string][]
	).filter(([, v]) => v);
}

// ---------------------------------------------------------------------------
// Filling an application
// ---------------------------------------------------------------------------

export interface Field {
	label: string;
	value: string;
	source: 'cv' | 'you' | 'drafted';
}

export interface Application {
	job: Job;
	/** the applicant tracking system the apply link points at */
	ats: string;
	fields: Field[];
	note: string;
}

const ATS: [RegExp, string][] = [
	[/greenhouse\.io/i, 'Greenhouse'],
	[/lever\.co/i, 'Lever'],
	[/ashbyhq\.com/i, 'Ashby'],
	[/myworkdayjobs\.com|workday/i, 'Workday'],
	[/smartrecruiters\.com/i, 'SmartRecruiters'],
	[/workable\.com/i, 'Workable'],
	[/teamtailor\.com/i, 'Teamtailor']
];

export const atsFor = (url: string): string => ATS.find(([re]) => re.test(url))?.[1] ?? 'Careers site';

/** A short, plain note for “Why do you want to work here?”, built from the CV and the listing. */
export function draftNote(job: Job, p: Profile): string {
	const overlap = p.skills.filter((s) => new RegExp(`\\b${s.replace(/[.+#]/g, '\\$&')}\\b`, 'i').test(`${job.title} ${job.description}`));
	const who = p.headline ? `I’m ${/^[aeiou]/i.test(p.headline) ? 'an' : 'a'} ${p.headline.toLowerCase()}` : 'I’m';
	const exp = p.years ? ` with about ${p.years} years of experience` : '';
	const skills = overlap.length ? `, and my work with ${list(overlap.slice(0, 3))} lines up closely with this role` : '';
	const mission = job.company.mission || job.company.blurb;
	const why = mission
		? ` I’m drawn to ${job.company.name}’s work: ${lowerFirst(mission.replace(/\.$/, ''))}.`
		: ` I’d like to bring that to ${job.company.name}.`;
	return `${who}${exp}${skills}.${why} I’d welcome the chance to talk about the ${job.title} role.`;
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const list = (items: string[]) =>
	items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

export function fillApplication(job: Job, p: Profile): Application {
	const cv = (label: string, value: string): Field => ({ label, value, source: 'cv' });
	const you = (label: string, value: string): Field => ({ label, value, source: 'you' });
	const fromCv = (key: 'name' | 'email' | 'phone' | 'location') =>
		p.answers[key] ? you : cv;
	const fields: Field[] = [
		fromCv('name')('Full name', p.name),
		fromCv('email')('Email', p.email),
		fromCv('phone')('Phone', p.phone),
		fromCv('location')('Location', p.location),
		cv('CV', p.cvName),
		cv('LinkedIn', p.linkedin),
		p.answers.portfolio ? you('Website', p.answers.portfolio) : cv('Website', p.portfolio || p.github),
		you('Right to work in the UK', p.answers.rightToWork ?? ''),
		you('Requires sponsorship', p.answers.sponsorship ?? ''),
		you('Notice period', p.answers.notice ?? ''),
		you('Salary expectation', p.answers.salary ?? ''),
		you('Work set-up', p.answers.setup ?? ''),
		{ label: 'How did you hear about us?', value: 'orbbits job board', source: 'drafted' as const }
	].filter((f) => f.value);
	return { job, ats: atsFor(job.applyUrl), fields, note: draftNote(job, p) };
}

// ---------------------------------------------------------------------------
// Matching roles to a CV
// ---------------------------------------------------------------------------

/**
 * The CV as the agent may read it: contact details, links and the name removed. Only sent when
 * the person asks for roles that fit them.
 */
export function cvForModel(p: Profile): string {
	let text = p.cvText;
	for (const value of [p.name, p.email, p.phone, p.linkedin, p.github, p.portfolio])
		if (value) text = text.split(value).join(' ');
	return text
		.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
		// phone numbers have 10 or more digits; date ranges like "2017 - 2021" have 8
		.replace(/\+?\d[\d\s().-]{8,}\d/g, (m) => (m.replace(/\D/g, '').length >= 10 ? '[phone]' : m))
		.replace(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|io|dev|me|co\.uk|org|net|app)\/?\S*/gi, '[link]')
		.replace(/[ \t]+/g, ' ')
		.trim()
		.slice(0, 6000);
}

const WORK_FROM_TITLE: [RegExp, string][] = [
	[/\b(engineer|developer|programmer|sre|devops|architect)\b/i, 'engineering'],
	[/\b(designer|ux|ui)\b/i, 'design'],
	[/\b(product manager|product owner|head of product|product lead)\b/i, 'product'],
	[/\b(data|analyst|scientist|machine learning|ml)\b/i, 'data'],
	[/\b(marketing|growth|content|brand)\b/i, 'marketing'],
	[/\b(sales|account executive|customer success|business development)\b/i, 'sales'],
	[/\b(operations|recruiter|people|finance|support)\b/i, 'operations']
];

/** The kind of work a CV points to, from its headline. */
export const workTypeFor = (p: Profile): string | null =>
	WORK_FROM_TITLE.find(([re]) => re.test(p.headline))?.[1] ?? null;

/** Seniority implied by years of experience, with the neighbouring levels that are worth a look. */
function senioritiesFor(p: Profile): { best: string[]; near: string[] } {
	const y = p.years;
	if (y === null) return { best: [], near: [] };
	if (/\b(head|director|vp|manager)\b/i.test(p.headline)) return { best: ['manager'], near: ['staff'] };
	if (/\b(staff|principal|lead)\b/i.test(p.headline)) return { best: ['staff'], near: ['senior', 'manager'] };
	if (y < 2) return { best: ['junior'], near: ['mid'] };
	if (y < 5) return { best: ['mid'], near: ['junior', 'senior'] };
	if (y < 9) return { best: ['senior'], near: ['mid', 'staff'] };
	return { best: ['staff', 'senior'], near: ['manager'] };
}

/** Where the person can work from, from their location and work set-up answers. */
export function placesFor(p: Profile): Place[] {
	const setup = (p.answers.setup ?? '').toLowerCase();
	if (/remote only/.test(setup)) return ['remote'];
	const places: Place[] = [];
	if (/london/i.test(p.location)) places.push('london');
	else if (p.location && !/remote/i.test(p.location)) places.push('uk');
	if (!setup || /remote/.test(setup) || /remote/i.test(p.location)) places.push('remote');
	return places;
}

const STOP = new Set(['senior', 'junior', 'lead', 'staff', 'principal', 'the', 'and', 'of', 'at', 'for', 'ii', 'iii', 'i', 'a', 'to', 'in', '-', '&']);
const words = (text: string) =>
	text
		.toLowerCase()
		.split(/[^a-z0-9+#.]+/)
		.filter((w) => w.length > 1 && !STOP.has(w));

export interface Candidate {
	job: Job;
	score: number;
	signals: string[];
}

/**
 * Score every open role against the CV and keep the best. Cheap and generous: the model makes
 * the real judgement from this shortlist.
 */
export function cvCandidates(
	p: Profile,
	jobs: Job[],
	opts: { industries?: string[]; workTypes?: string[]; places?: Place[]; exclude?: Set<string>; limit?: number } = {}
): Candidate[] {
	const workTypes = opts.workTypes?.length ? opts.workTypes : [workTypeFor(p)].filter((w): w is string => Boolean(w));
	const places = opts.places?.length ? opts.places : placesFor(p);
	const { best, near } = senioritiesFor(p);
	const titleWords = new Set(words(p.headline));
	const skillRes = p.skills.map((s) => [s, new RegExp(`(^|[^\\w+#])${s.replace(/[.+#]/g, '\\$&')}(?![\\w+#])`, 'i')] as const);

	const scored: Candidate[] = [];
	for (const job of jobs) {
		if (!job.company.top || opts.exclude?.has(job.id)) continue;
		if (opts.industries?.length && !opts.industries.includes(job.industry)) continue;
		if (places.length && !places.some((pl) => jobPlaces(job).has(pl))) continue;
		if (workTypes.length && !workTypes.includes(job.workType)) continue;

		const signals: string[] = [];
		let score = 0;
		const text = `${job.title} ${job.description}`;
		const skills = skillRes.filter(([, re]) => re.test(text)).map(([s]) => s);
		if (skills.length) {
			score += Math.min(skills.length, 6) * 3;
			signals.push(`mentions ${skills.slice(0, 4).join(', ')}`);
		}
		const shared = [...new Set(words(job.title))].filter((w) => titleWords.has(w));
		if (shared.length) {
			score += shared.length * 4;
			signals.push(`title shares “${shared.join(' ')}”`);
		}
		if (job.seniority && best.includes(job.seniority)) {
			score += 4;
			signals.push('right level');
		} else if (job.seniority && near.includes(job.seniority)) score += 1;
		else if (job.seniority && best.length) score -= 4;
		if (job.postedDays !== null && job.postedDays <= 14) score += 1;
		scored.push({ job, score, signals });
	}
	return scored.sort((a, b) => b.score - a.score || a.job.company.rank - b.job.company.rank).slice(0, opts.limit ?? 40);
}
