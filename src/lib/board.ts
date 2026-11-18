export type CategoryKind = 'industry' | 'work';

export interface Category {
	slug: string;
	name: string;
	kind: CategoryKind;
	blurb: string;
	/** solid accent (tailwind bg class) */
	dot: string;
	/** tinted chip (tailwind bg + text classes) */
	chip: string;
}

export interface Company {
	id: string;
	name: string;
	logo?: string;
	blurb: string;
	location: string;
	size: string;
	industry: string;
	/** lower is better; only ranked companies are "top" */
	rank: number;
	top: boolean;
	/** the company's identity has been checked */
	verified: boolean;
	stage: Stage | '';
	founded: number | null;
	funding: string;
	mission: string;
	investors: string[];
	perks: string[];
	website: string;
	/** set when the company's roles are listed only on its own careers site */
	careersUrl: string;
}

export type Stage = 'seed' | 'series-a' | 'series-b' | 'series-c-plus' | 'bootstrapped' | 'public';

export const STAGES: { value: Stage; label: string }[] = [
	{ value: 'seed', label: 'Seed' },
	{ value: 'series-a', label: 'Series A' },
	{ value: 'series-b', label: 'Series B' },
	{ value: 'series-c-plus', label: 'Series C+' },
	{ value: 'bootstrapped', label: 'Bootstrapped' },
	{ value: 'public', label: 'Public' }
];

export const stageLabel = (stage: string): string =>
	STAGES.find((s) => s.value === stage)?.label ?? '';

export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export const WORK_MODES: { value: WorkMode; label: string }[] = [
	{ value: 'remote', label: 'Remote' },
	{ value: 'hybrid', label: 'Hybrid' },
	{ value: 'onsite', label: 'On-site' }
];

export type Seniority = 'junior' | 'mid' | 'senior' | 'staff' | 'manager';

export const SENIORITIES: { value: Seniority; label: string }[] = [
	{ value: 'junior', label: 'Junior or graduate' },
	{ value: 'mid', label: 'Mid-level' },
	{ value: 'senior', label: 'Senior' },
	{ value: 'staff', label: 'Staff, principal or lead' },
	{ value: 'manager', label: 'Manager or above' }
];

const SENIORITY_SHORT: Record<Seniority, string> = {
	junior: 'Junior',
	mid: 'Mid-level',
	senior: 'Senior',
	staff: 'Staff+',
	manager: 'Manager'
};

/** Short label for cards: "Staff+" rather than "Staff, principal or lead". */
export const seniorityLabel = (value: string): string => SENIORITY_SHORT[value as Seniority] ?? '';

export type Place = 'london' | 'uk' | 'remote';

export const PLACES: { value: Place; label: string }[] = [
	{ value: 'london', label: 'In London' },
	{ value: 'uk', label: 'Elsewhere in the UK' },
	{ value: 'remote', label: 'Remote from the UK' }
];

const UK_ELSEWHERE =
	/\b(manchester|edinburgh|glasgow|bristol|cambridge|oxford|leeds|cardiff|belfast|birmingham|newcastle|brighton|reading|sheffield|nottingham|liverpool|scotland|wales|northern ireland)\b/i;

/** Where someone could do this job from. A role can be in several. */
export function jobPlaces(job: Job): Set<Place> {
	const places = new Set<Place>();
	const where = job.region;
	if (/\blondon\b/i.test(where)) places.add('london');
	if (UK_ELSEWHERE.test(where)) places.add('uk');
	if (job.mode === 'remote' || /\bremote\b/i.test(where)) places.add('remote');
	// "United Kingdom" with no city: assume an office somewhere in the UK
	if (!places.size) places.add('uk');
	return places;
}

export interface Job {
	addedInLatestBatch: boolean;
	id: string;
	title: string;
	company: Company;
	workType: string;
	seniority: Seniority | '';
	industry: string;
	salary: string;
	region: string;
	arrangement: string;
	mode: WorkMode | null;
	description: string;
	applyUrl: string;
	premium: boolean;
	/** days since the role was posted */
	postedDays: number | null;
	/** days since the employer last confirmed the role is open */
	verifiedDays: number | null;
}

export interface CompanyGroup {
	company: Company;
	jobs: Job[];
}

export interface CategorySummary {
	category: Category;
	companies: number;
	roles: number;
	leaders: Company[];
}

const UNRANKED = 9999;

export const CATEGORIES: Category[] = [
	{
		slug: 'magnificent-7',
		name: 'Magnificent 7',
		kind: 'industry',
		blurb: 'Apple, Microsoft, Google, Amazon, Meta, Nvidia and Tesla.',
		dot: 'bg-yellow-500',
		chip: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200'
	},
	{
		slug: 'fintech',
		name: 'Fintech',
		kind: 'industry',
		blurb: 'Banks, payments, lending and the plumbing of money.',
		dot: 'bg-sky-500',
		chip: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200'
	},
	{
		slug: 'ai',
		name: 'AI',
		kind: 'industry',
		blurb: 'Model labs and companies building on frontier AI.',
		dot: 'bg-fuchsia-500',
		chip: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-200'
	},
	{
		slug: 'climate-and-energy',
		name: 'Climate and energy',
		kind: 'industry',
		blurb: 'Cleaner power, smarter grids and carbon accounting.',
		dot: 'bg-emerald-500',
		chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
	},
	{
		slug: 'health-and-life-sciences',
		name: 'Health and life sciences',
		kind: 'industry',
		blurb: 'Drug discovery, biotech and care for patients.',
		dot: 'bg-rose-500',
		chip: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200'
	},
	{
		slug: 'defence-and-security',
		name: 'Defence and security',
		kind: 'industry',
		blurb: 'Autonomy, intelligence and national security technology.',
		dot: 'bg-slate-600',
		chip: 'bg-slate-200 text-slate-800 dark:bg-slate-500/30 dark:text-slate-100'
	},
	{
		slug: 'robotics-and-deep-tech',
		name: 'Robotics and deep tech',
		kind: 'industry',
		blurb: 'Self-driving, humanoid robots and quantum computing.',
		dot: 'bg-orange-500',
		chip: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200'
	},
	{
		slug: 'software-and-infrastructure',
		name: 'Software and infrastructure',
		kind: 'industry',
		blurb: 'The cloud, data and developer tools other companies run on.',
		dot: 'bg-violet-500',
		chip: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200'
	},
	{
		slug: 'consumer',
		name: 'Consumer',
		kind: 'industry',
		blurb: 'Products millions of people use every day.',
		dot: 'bg-amber-500',
		chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200'
	},
	{
		slug: 'engineering',
		name: 'Engineering',
		kind: 'work',
		blurb: 'Software, infrastructure and hardware.',
		dot: 'bg-violet-500',
		chip: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200'
	},
	{
		slug: 'design',
		name: 'Design',
		kind: 'work',
		blurb: 'Product, brand and research.',
		dot: 'bg-pink-500',
		chip: 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-200'
	},
	{
		slug: 'product',
		name: 'Product',
		kind: 'work',
		blurb: 'Product management and strategy.',
		dot: 'bg-orange-500',
		chip: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200'
	},
	{
		slug: 'data',
		name: 'Data',
		kind: 'work',
		blurb: 'Analytics, science and machine learning.',
		dot: 'bg-teal-500',
		chip: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200'
	},
	{
		slug: 'marketing',
		name: 'Marketing',
		kind: 'work',
		blurb: 'Growth, content and community.',
		dot: 'bg-lime-500',
		chip: 'bg-lime-100 text-lime-800 dark:bg-lime-500/20 dark:text-lime-200'
	},
	{
		slug: 'sales',
		name: 'Sales and customer success',
		kind: 'work',
		blurb: 'Account executives, solutions and customer success.',
		dot: 'bg-indigo-500',
		chip: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
	},
	{
		slug: 'operations',
		name: 'Operations',
		kind: 'work',
		blurb: 'People, finance, support and the rest of the engine room.',
		dot: 'bg-slate-500',
		chip: 'bg-slate-200 text-slate-800 dark:bg-slate-500/30 dark:text-slate-200'
	}
];

const FALLBACK_STYLE = {
	dot: 'bg-slate-400',
	chip: 'bg-slate-200 text-slate-800 dark:bg-slate-500/30 dark:text-slate-200'
};

export const slugify = (value: unknown): string =>
	String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

const titleCase = (slug: string): string =>
	slug
		.split('-')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');

/** Look up a category; unknown slugs coming from the API get a neutral style. */
export const getCategory = (slug: string, kind: CategoryKind = 'work'): Category =>
	CATEGORIES.find((c) => c.slug === slug) ?? {
		slug,
		name: titleCase(slug),
		kind,
		blurb: '',
		...FALLBACK_STYLE
	};

// ---------------------------------------------------------------------------
// API — GET /board/ returns every listing from a top company, company nested.
// ---------------------------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000;

const daysSince = (iso: string | null | undefined): number | null => {
	const then = iso ? Date.parse(iso) : NaN;
	return Number.isNaN(then) ? null : Math.max(0, Math.floor((Date.now() - then) / DAY));
};

/** "today", "3d ago", "2w ago", "5mo ago", "2y ago" */
export const ago = (days: number): string =>
	days === 0
		? 'today'
		: days < 14
		? `${days}d ago`
		: days < 60
		? `${Math.floor(days / 7)}w ago`
		: days < 730
		? `${Math.floor(days / 30)}mo ago`
		: `${Math.floor(days / 365)}y ago`;

/** Roles posted within this many days are flagged as new. */
export const NEW_DAYS = 7;

const modeOf = (arrangement: string): WorkMode | null => {
	const a = arrangement.toLowerCase();
	if (a.startsWith('remote')) return 'remote';
	if (a.startsWith('hybrid')) return 'hybrid';
	if (a.startsWith('on-site') || a.startsWith('onsite') || a.startsWith('office')) return 'onsite';
	return null;
};

const splitList = (value: unknown, sep: string): string[] =>
	String(value ?? '')
		.split(sep)
		.map((part) => part.trim())
		.filter(Boolean);

/* eslint-disable @typescript-eslint/no-explicit-any */
export function companyFromApi(c: any): Company {
	const industry = slugify(c.industry) || 'other';
	return {
		id: String(c.id),
		name: c.name ?? 'Unknown company',
		// a path on this site ("/static/logos/…") or an absolute http(s) URL
		logo: /^(https?:\/\/|\/(?!\/))/.test(c.logo ?? '') ? c.logo : c.profile_url || undefined,
		blurb: c.description ?? '',
		location: c.location ?? '',
		size: c.size ?? '',
		industry,
		rank: c.rank ?? UNRANKED,
		top: Boolean(c.is_top),
		verified: Boolean(c.is_verified),
		stage: STAGES.some((s) => s.value === c.stage) ? c.stage : '',
		founded: c.founded ?? null,
		funding: c.funding ?? '',
		mission: c.mission ?? '',
		investors: splitList(c.investors, ','),
		perks: splitList(c.perks, '\n'),
		website: c.website ?? '',
		careersUrl: /^https:\/\//.test(c.careers_url ?? '') ? c.careers_url : ''
	};
}

function fromApi(l: any, c: any, addedInLatestBatch: boolean): Job {
	const company = companyFromApi(c);
	const industry = company.industry;
	return {
		id: String(l.id),
		addedInLatestBatch,
		title: l.job_title ?? '',
		company,
		workType: slugify(l.category) || 'other',
		industry,
		salary: l.salary ?? '',
		region: l.region ?? '',
		arrangement: l.arrangement ?? '',
		mode: modeOf(l.arrangement ?? ''),
		description: l.description ?? '',
		applyUrl: /^https?:\/\//.test(l.application_url ?? '') ? l.application_url : '',
		seniority: SENIORITIES.some((x) => x.value === l.seniority) ? l.seniority : '',
		premium: Boolean(l.premium),
		postedDays: daysSince(l.posted_at),
		verifiedDays: daysSince(l.verified_at)
	};
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Where the daily sync publishes every open role, beside the site itself. */
export const BOARD_URL = '/data/board.json';

/**
 * Load the board. `offline` is true when the file could not be fetched.
 * Pass SvelteKit's `fetch` from a load function.
 */
export async function loadBoard(
	fetcher: typeof fetch = fetch
): Promise<{ jobs: Job[]; companies: Company[]; offline: boolean; generatedAt: string | null }> {
	try {
		const res = await fetcher(BOARD_URL, { headers: { Accept: 'application/json' } });
		if (!res.ok) return { jobs: [], companies: [], offline: true, generatedAt: null };
		/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
		const data: any = await res.json();
		/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
		const companies = new Map<string, any>(
			(data.companies ?? []).map((c: any) => [String(c.id), c])
		);
		const addedIds = new Set(data.added_ids ?? []);
		const jobs = (data.listings ?? [])
			/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
			.filter((l: any) => companies.has(String(l.company)))
			/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
			.map((l: any) => fromApi(l, companies.get(String(l.company)), addedIds.has(String(l.id))));
		return {
			jobs,
			companies: [...companies.values()].map(companyFromApi),
			offline: false,
			generatedAt: data.generated_at ?? null
		};
	} catch {
		return { jobs: [], companies: [], offline: true, generatedAt: null };
	}
}

// ---------------------------------------------------------------------------
// Selection — the board only ever shows top companies.
// ---------------------------------------------------------------------------

/** Jobs that belong on the board: only those from top companies. */
export const topJobs = (jobs: Job[]): Job[] => jobs.filter((job) => job.company.top);

export interface Filters {
	modes: WorkMode[];
	stages: Stage[];
}

export const NO_FILTERS: Filters = { modes: [], stages: [] };

/** Keep jobs matching any chosen mode and any chosen stage; an empty list means no narrowing. */
export const applyFilters = (jobs: Job[], { modes, stages }: Filters): Job[] =>
	jobs.filter(
		(job) =>
			(!modes.length || (job.mode !== null && modes.includes(job.mode))) &&
			(!stages.length || (job.company.stage !== '' && stages.includes(job.company.stage)))
	);

/** Stages at least one listed company is at, in the usual order. */
export const presentStages = (jobs: Job[]): typeof STAGES => {
	const present = new Set(jobs.map((job) => job.company.stage));
	return STAGES.filter((stage) => present.has(stage.value));
};

export const hasFilters = ({ modes, stages }: Filters): boolean =>
	modes.length > 0 || stages.length > 0;

// ---------------------------------------------------------------------------
// Matching — score a job against a seeker's stated preferences.
// ---------------------------------------------------------------------------

export interface Preferences {
	/** required: roles in other industries never match */
	industries: string[];
	/** required: roles the seeker could not work from never match */
	places: Place[];
	/** optional: when set, roles of other types never match */
	workTypes: string[];
	seniorities: Seniority[];
	stages: Stage[];
	/** minimum salary in thousands; 0 means any */
	minSalary: number;
}

export const EMPTY_PREFERENCES: Preferences = {
	industries: [],
	places: [],
	workTypes: [],
	seniorities: [],
	stages: [],
	minSalary: 0
};

/** Top of a salary range in thousands: "£85k – £105k" → 105. */
export const salaryTop = (salary: string): number | null => {
	const nums = [...salary.matchAll(/(\d+(?:\.\d+)?)\s*k/gi)].map((m) => Number(m[1]));
	return nums.length ? Math.max(...nums) : null;
};

const WEIGHTS = { seniorities: 50, stages: 20, minSalary: 30 };

/**
 * 0–100. Industry, location and (when chosen) type of work are hard requirements: a job
 * failing any of them scores 0.
 * Every other preference the seeker set adds its weight when the job meets it. Preferences
 * left empty, and facts a listing does not state (most do not publish pay), are skipped
 * rather than counted as misses.
 */
export function matchScore(job: Job, prefs: Preferences): number {
	if (prefs.industries.length && !prefs.industries.includes(job.industry)) return 0;
	if (prefs.workTypes.length && !prefs.workTypes.includes(job.workType)) return 0;
	if (prefs.places.length) {
		const places = jobPlaces(job);
		if (!prefs.places.some((p) => places.has(p))) return 0;
	}
	let possible = 0;
	let earned = 0;
	const check = (key: keyof typeof WEIGHTS, active: boolean, ok: boolean) => {
		if (!active) return;
		possible += WEIGHTS[key];
		if (ok) earned += WEIGHTS[key];
	};
	check(
		'seniorities',
		prefs.seniorities.length > 0 && job.seniority !== '',
		prefs.seniorities.includes(job.seniority as Seniority)
	);
	check(
		'stages',
		prefs.stages.length > 0 && job.company.stage !== '',
		prefs.stages.includes(job.company.stage as Stage)
	);
	const top = salaryTop(job.salary);
	check('minSalary', prefs.minSalary > 0 && top !== null, top !== null && top >= prefs.minSalary);
	// meeting every hard requirement with nothing else to check is a full match
	return possible ? Math.round((earned / possible) * 100) : 100;
}

/** The questions every visitor answers before seeing listings. */
export const isOnboarded = (prefs: Preferences): boolean =>
	prefs.industries.length > 0 && prefs.places.length > 0;

export const hasPreferences = isOnboarded;

/** Only roles the seeker could do from where they want to work. */
/** Companies in an industry whose roles we can only link to, on their own careers site. */
export const linkOnlyCompanies = (companies: Company[], industry: string): Company[] =>
	companies.filter((c) => c.industry === industry && c.careersUrl).sort((a, b) => a.rank - b.rank);

export const inPlaces = (jobs: Job[], places: Place[]): Job[] =>
	places.length ? jobs.filter((job) => places.some((p) => jobPlaces(job).has(p))) : jobs;

/** Scores at or above this are shown as matches. */
export const MATCH_THRESHOLD = 60;

const inCategory = (job: Job, slug: string) => job.industry === slug || job.workType === slug;

/** Top companies (best first), each with its roles, optionally within one or more categories. */
export function topCompanies(jobs: Job[], ...slugs: string[]): CompanyGroup[] {
	const groups = new Map<string, CompanyGroup>();
	for (const job of topJobs(jobs)) {
		if (!slugs.every((slug) => inCategory(job, slug))) continue;
		const group = groups.get(job.company.id) ?? { company: job.company, jobs: [] };
		group.jobs.push(job);
		groups.set(job.company.id, group);
	}
	const list = [...groups.values()];
	for (const g of list) g.jobs.sort((a, b) => Number(b.premium) - Number(a.premium));
	return list.sort(
		(a, b) =>
			a.company.rank - b.company.rank ||
			Number(b.jobs[0].premium) - Number(a.jobs[0].premium) ||
			a.company.name.localeCompare(b.company.name)
	);
}

/** Every category that has at least one top role, with counts and its leading companies. */
export function categorySummaries(jobs: Job[], kind: CategoryKind): CategorySummary[] {
	const top = topJobs(jobs);
	const slugs = new Set(top.map((j) => (kind === 'industry' ? j.industry : j.workType)));
	const known = CATEGORIES.filter((c) => c.kind === kind && slugs.has(c.slug));
	const unknown = [...slugs]
		.filter((s) => !CATEGORIES.some((c) => c.slug === s))
		.sort()
		.map((s) => getCategory(s, kind));
	return [...known, ...unknown].map((category) => {
		const groups = topCompanies(jobs, category.slug);
		return {
			category,
			companies: groups.length,
			roles: groups.reduce((n, g) => n + g.jobs.length, 0),
			leaders: groups.slice(0, 4).map((g) => g.company)
		};
	});
}

/** Case-insensitive match on title, company, category or location. */
export function searchJobs(jobs: Job[], query: string): CompanyGroup[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	const hits = topJobs(jobs).filter((j) =>
		[j.title, j.company.name, j.company.industry, j.workType, j.region, j.arrangement, j.seniority]
			.join(' ')
			.toLowerCase()
			.includes(q)
	);
	return topCompanies(hits);
}
