import type { Config } from "tailwindcss";

export default (<Partial<Config>>{
	content: [
		"./app/**/*.{vue,js,ts}",
		"./components/**/*.{vue,js,ts}",
		"./layouts/**/*.{vue,js,ts}",
		"./pages/**/*.{vue,js,ts}",
	],
	theme: {
		extend: {
			colors: {
				paper: "#f5f1e8",
				ink: "#111111",
				accent: "#f1df00",
				tomato: "#ef5b3f",
				sky: "#7cc8d8",
				moss: "#b8ce70",
			},
			fontFamily: {
				sans: ["Arial", "Helvetica Neue", "Helvetica", "sans-serif"],
				display: ["Arial Black", "Arial", "Helvetica Neue", "sans-serif"],
				mono: [
					"ui-monospace",
					"SFMono-Regular",
					"Menlo",
					"Monaco",
					"Consolas",
					"monospace",
				],
			},
			boxShadow: {
				brutal: "4px 4px 0 #111111",
				"brutal-lg": "8px 8px 0 #111111",
			},
		},
	},
	plugins: [],
});
