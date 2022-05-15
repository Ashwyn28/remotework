export const categoryColours = {
	a: 'bg-dark-tokyo-purple-01',
	b: 'bg-dark-tokyo-purple-02',
	c: 'bg-dark-tokyo-purple-03',
	d: 'bg-dark-tokyo-purple-04',
	e: 'bg-dark-tokyo-purple-05',
	f: 'bg-dark-tokyo-purple-06',
	g: 'bg-dark-tokyo-purple-07',
	h: 'bg-dark-tokyo-purple-08',
	i: 'bg-dark-tokyo-blue-01',
	j: 'bg-light-tokyo-blue-02',
	k: 'bg-dark-tokyo-blue-03',
	l: 'bg-light-tokyo-blue-04',
	m: 'bg-light-tokyo-blue-05',
	n: 'bg-light-tokyo-blue-06',
	o: 'bg-dark-tokyo-green-01',
	p: 'bg-light-tokyo-green-02',
	q: 'bg-dark-tokyo-green-03',
	r: 'bg-dark-tokyo-green-04',
	s: 'bg-light-tokyo-orange-01',
	t: 'bg-dark-tokyo-orange-02',
	u: 'bg-dark-tokyo-orange-03',
	v: 'bg-dark-tokyo-pink-01',
	w: 'bg-dark-tokyo-pink-02',
	x: 'bg-dark-tokyo-pink-03',
	y: 'bg-dark-tokyo-red-01',
	z: 'bg-dark-tokyo-red-02',
};

export const setCategoryColor = (category: string, backound: boolean, border: boolean) => {
	const firstChar = category.charAt(0).toLowerCase();
	if (backound) {
		if (!categoryColours[firstChar]) {
			return 'bg-sky-300';
		}
		return categoryColours[firstChar];
	}
	if (border) {
		if (!categoryColours[firstChar]) {
			return 'border-sky-300';
		}
	
		return `border-${categoryColours[firstChar]}`;
	}
}