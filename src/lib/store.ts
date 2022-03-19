import { writable } from "svelte/store";

interface FilterCategory {
	id: number,
	type: string,
	name: string,
}

function createFilter() {
	const {subscribe, set, update} = writable({
		selected: false,
		category: {id: 0, type: "", name: ""}
	});

	return {
		subscribe,
		set,
		update,
		setCategory: (category: FilterCategory) => update(self => {
			self.category = category
			return self;
		}),
		isSelected: (selected: boolean) => update(self => {
			self.selected = selected;
			return self;
		}),
		reset: () => update(self => {
			self.selected = false;
			self.category = {id: 0, type: "", name: ""};
			return self;
		})
	}
}

function createHeight() {
	const {subscribe, set, update} = writable({
		default: 0,
		updated: 0
	});

	return {
		subscribe,
		set,
		update,
		reset: () => update(self => {
			self.updated = self.default;
			return self;
		})
	}
}

export const height = createHeight();
export const filter = createFilter();