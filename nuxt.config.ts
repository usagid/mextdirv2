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
			umamiUrl: process.env.UMAMI_URL || "",
			umamiWebsiteId: process.env.UMAMI_WEBSITE_ID || "",
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
						"日本全国の廃校・未利用の学校施設を検索できる情報ディレクトリ。地域、面積、構造などの条件から、活用を検討できる学校施設を探せます。",
				},
				{
					name: "keywords",
					content:
						"みんなの廃校, 廃校, 廃校活用, 廃校利用, 未利用校舎, 学校施設, 学校跡地, 地域活性化, 公共施設活用, abandoned schools, vacant schools, unused school buildings, school reuse, school facilities, community revitalization, Japan",
				},
				{ name: "theme-color", content: "#f5f1e8" },
			],
		},
	},

	nitro: {
		compressPublicAssets: true,
	},
});
