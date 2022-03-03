import { writable } from "svelte/store";

function createFilter() {
	const {subscribe, set, update} = writable(false);

	return {
		subscribe,
		selected: () => set(true)
	}
}

export const filter = createFilter();