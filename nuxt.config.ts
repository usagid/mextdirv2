import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
	future: {
		compatibilityVersion: 4,
	},

	devtools: { enabled: true },

	modules: ["@nuxtjs/tailwindcss", "@nuxt/image", "@nuxtjs/i18n"],

	css: ["~/assets/css/main.css"],

	typescript: {
		strict: true,
		typeCheck: true,
	},

	runtimeConfig: {
		adminApiKey: process.env.ADMIN_API_KEY,
		storageDriver: process.env.STORAGE_DRIVER || "local",
		public: {
			appName: "mextdir",
		},
	},

	i18n: {
		strategy: "prefix",
		defaultLocale: "ja",
		langDir: "../locales",
		detectBrowserLanguage: false,
		locales: [
			{ code: "ja", language: "ja-JP", file: "ja.json", name: "日本語" },
			{ code: "en", language: "en-US", file: "en.json", name: "EN" },
			{ code: "zh", language: "zh-CN", file: "zh.json", name: "中文" },
			{ code: "ko", language: "ko-KR", file: "ko.json", name: "한국어" },
		],
	},

	image: {
		screens: {
			xs: 320,
			sm: 640,
			md: 768,
			lg: 1024,
			xl: 1280,
			xxl: 1536,
		},
	},

	app: {
		head: {
			title: "mextdir — Abandoned school listings",
			meta: [
				{
					name: "description",
					content: "Find new owners for abandoned Japanese schools.",
				},
				{ name: "theme-color", content: "#f5f1e8" },
			],
		},
	},

	nitro: {
		compressPublicAssets: true,
	},
});
