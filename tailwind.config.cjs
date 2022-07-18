const config = {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				"dark-tokyo-purple-01": "#7B25F2",
				"dark-tokyo-purple-02": "#B217E8",
				"dark-tokyo-purple-03": "#660FAC",
				"dark-tokyo-purple-04": "#542CB3",
				"dark-tokyo-purple-05": "#502B92",
				"dark-tokyo-purple-06": "#6A428B",
				"dark-tokyo-purple-07": "#BA3884",
				"dark-tokyo-purple-08": "#6E506F",
				"dark-tokyo-blue-01": "#05BCE3",
				"light-tokyo-blue-02": "#BBF6FF",
				"dark-tokyo-blue-03": "#1596ED",
				"light-tokyo-blue-04": "#0CF3E3",
				"light-tokyo-blue-05": "#18CABE",
				"dark-tokyo-blue-06": "#6E70DF",
				"dark-tokyo-green-01": "#1A9E00",
				"light-tokyo-green-02": "#C3DDC6",
				"dark-tokyo-green-03": "#059689",
				"dark-tokyo-green-04": "#D70F72",
				"light-tokyo-orange-01": "#F6985A",
				"dark-tokyo-orange-02": "#F3A22D",
				"light-tokyo-orange-03": "#F2BB95",
				"dark-tokyo-pink-01": "#E7116F",
				"dark-tokyo-pink-02": "#FB068A",
				"dark-tokyo-pink-03": "#D70F72",
				"dark-tokyo-red-01": "#EE062F",
				"dark-tokyo-red-02": "#9B0040",
				"light-bedroom-gray": "#E5E5E5",
				"dark-bedroom-green": "#ABCAC5",
				"dark-bedroom-brown": "#B0A494",
				"light-beach-green": "#AEC1B3",
				"dark-beach-black": "#37454F",
				"light-sand-green": "#F1F1E9",
				"send-green": "#48bb78",
			},
			fontSize: {
				"l": '1.0625rem'
			}
		}
	},

	plugins: [
		require('@tailwindcss/forms'),
	]
	
};

module.exports = config;
