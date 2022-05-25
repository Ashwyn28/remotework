import { writable } from 'svelte/store';
import { getListings } from '../routes/_api';

interface FilterCategory {
	id: number;
	type: string;
	name: string;
}

/**
 * create filter store to;
 * 	1. set/apply a filter
 * 	2. track category of filter applied
 * 	3. reset all applied filters
 * @returns filter store
 */
function createFilter() {
	const { subscribe, set, update } = writable({
		selected: false,
		category: { id: 0, type: '', name: '' }
	});

	return {
		subscribe,
		set,
		update,
		setCategory: (category: FilterCategory) =>
			update((self) => {
				self.category = category;
				return self;
			}),
		isSelected: (selected: boolean) =>
			update((self) => {
				self.selected = selected;
				return self;
			}),
		reset: () =>
			update((self) => {
				self.selected = false;
				self.category = { id: 0, type: '', name: '' };
				return self;
			})
	};
}

/**
 * return all unique filters
 * @returns {Array<Object>} filters
 */
async function getAllFilters() {
	const filters = [];
	const listings = await getListings('listings');
	if (listings.results) {
		listings.results.map((l) => {
			filters.push({
				id: l.pk,
				name: l.category
			});
		});
		return filters;
	}
}

function createHeight() {
	const { subscribe, set, update } = writable({
		default: 0,
		updated: 0
	});

	return {
		subscribe,
		set,
		update,
		reset: () =>
			update((self) => {
				self.updated = self.default;
				return self;
			})
	};
}

export const height = createHeight();
export const filter = createFilter();
export const filters = getAllFilters();