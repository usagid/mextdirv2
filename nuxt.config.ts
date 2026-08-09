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
			link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
			meta: [
				{
					name: "description",
					content:
						"MEXT（文部科学省）「みんなの廃校」プロジェクトの廃校情報ライブラリー。全国の廃校・未活用の学校施設を地域から検索し、事業や地域活性化、施設活用など、あなたの目的やニーズに合った廃校を見つけましょう。",
				},
				{ name: "theme-color", content: "#f5f1e8" },
			],
		},
	},

	nitro: {
		compressPublicAssets: true,
	},
});
