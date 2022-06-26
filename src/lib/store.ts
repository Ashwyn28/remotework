import { writable } from 'svelte/store';
import { getListings } from '../routes/_api';
import { browser } from "$app/env";

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

// create store to handle payment states 
// on confirmation payment state should be set to confirm 
// states;
// 1. pay
// 2. successful
// 	  unsuccessful


function createPaymentStates() {
	const { subscribe, set, update } = writable({
		pageNum: 0,
	});

	return {
		subscribe,
		set,
		update,
		currentPage: (self) => {
			return self;
		},
		nextPage: () => (
			update((self) => {
				self.pageNum++
				return self
			})
		),
		setWithLocalStorage: (self) => {
			if (browser) {
				paymentStates.subscribe((value) => {
					localStorage.paymentState = value.pageNum
				})
			}
			return set(self)
		},
		subscribeToLocalStorage: () => {
			if (browser) {
				return localStorage.getItem("paymentState")
			}
		}
	}
}


const paidForListingId = () => {
	const { subscribe, set, update } = writable({
		id: null,
	});

	return {
		subscribe,
		set,
		update,
		setWithLocalStorage: (self) => {
			if (browser) {
				currentPaidForListingId.subscribe((value) => {
					localStorage.userListingId = value.id
				})
			}
			return set(self)
		},
		subscribeToLocalStorage: () => {
			if (browser) {
				return localStorage.getItem("userListingId")
			}
		}
	}
}

// user should not be able to access success page or payment page without correct state
// page redirects should match page store states
//  -> payment states should update the page store
// 	-> redirects in the frontend should map a page store constant

export const height = createHeight();
export const filter = createFilter();
export const filters = getAllFilters();
export const paymentStates = createPaymentStates();
export const currentPaidForListingId = paidForListingId();