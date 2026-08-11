import { computed, toValue } from "vue";
import type { MaybeRefOrGetter } from "vue";

const locales = ["ja", "en", "zh", "ko"] as const;
const localeTags: Record<(typeof locales)[number], string> = {
	ja: "ja-JP",
	en: "en-US",
	zh: "zh-CN",
	ko: "ko-KR",
};

type PublicSeoOptions = {
	title: MaybeRefOrGetter<string>;
	description: MaybeRefOrGetter<string>;
	keywords: MaybeRefOrGetter<string>;
	path: MaybeRefOrGetter<string>;
	structuredData?: MaybeRefOrGetter<unknown | null>;
};

export function usePublicSeo(options: PublicSeoOptions) {
	const { locale, t } = useI18n();
	const localePath = useLocalePath();
	const config = useRuntimeConfig();
	const requestUrl = useRequestURL();
	const title = computed(() => toValue(options.title));
	const description = computed(() => toValue(options.description));
	const keywords = computed(() => toValue(options.keywords));
	const path = computed(() => toValue(options.path));
	const siteUrl = computed(() =>
		String(config.public.siteUrl || requestUrl.origin).replace(/\/+$/, ""),
	);
	const canonicalUrl = computed(() =>
		new URL(
			localePath(path.value, locale.value),
			`${siteUrl.value}/`,
		).toString(),
	);
	// Keep the alternate relation literal for Unhead's link typing.
	const alternateLinks = computed(() => [
		...locales.map((code) => ({
			rel: "alternate" as const,
			type: "text/html" as const,
			hreflang: localeTags[code],
			href: new URL(
				localePath(path.value, code),
				`${siteUrl.value}/`,
			).toString(),
		})),
		{
			rel: "alternate" as const,
			type: "text/html" as const,
			hreflang: "x-default",
			href: new URL(
				localePath(path.value, "ja"),
				`${siteUrl.value}/`,
			).toString(),
		},
	]);
	const structuredData = computed(() =>
		options.structuredData ? toValue(options.structuredData) : null,
	);

	useHead(() => ({
		title: title.value,
		meta: [
			{ name: "description", content: description.value },
			{ name: "keywords", content: keywords.value },
			{ name: "author", content: "mextdir" },
			{ property: "og:title", content: title.value },
			{ property: "og:description", content: description.value },
			{ property: "og:type", content: "website" },
			{ property: "og:url", content: canonicalUrl.value },
			{ property: "og:site_name", content: t("seo.siteName") },
			{
				property: "og:locale",
				content:
					localeTags[locale.value as (typeof locales)[number]] || locale.value,
			},
			{ name: "twitter:card", content: "summary" },
			{ name: "twitter:title", content: title.value },
			{ name: "twitter:description", content: description.value },
		],
		link: [
			{ rel: "canonical", href: canonicalUrl.value },
			...alternateLinks.value,
		],
		script: structuredData.value
			? [
					{
						type: "application/ld+json",
						innerHTML: JSON.stringify(structuredData.value).replace(
							/</g,
							"\\u003c",
						),
					},
				]
			: [],
	}));

	return { canonicalUrl, siteUrl };
}
