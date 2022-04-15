export const categoryColours = {
	a: 'bg-teal-400',
	b: 'bg-red-400',
	c: 'bg-violet-400',
	d: 'bg-amber-400',
	e: 'bg-emerald-400',
	f: 'bg-cyan-400',
	g: 'bg-indigo-400',
	h: 'bg-rose-400',
	i: 'bg-pink-400',
	j: 'bg-fuchsia-400',
	k: 'bg-purple-400',
	l: 'bg-blue-400',
	m: 'bg-lime-400',
	o: 'bg-yellow-400',
	p: 'bg-orange-400',
	q: 'bg-stone-400',
	r: 'bg-neutral-400',
	s: 'bg-zinc-400',
	t: 'bg-gray-400',
	u: 'bg-slate-400',
	v: '',
	w: '',
	x: '',
	y: '',
	z: ''
};

export const setCategoryColor = (category) => {
	const firstChar = category.charAt(0).toLowerCase();
	if (!categoryColours[firstChar]) {
		return 'bg-sky-400';
	}
	return categoryColours[firstChar];
}