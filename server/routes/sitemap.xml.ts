import { defineEventHandler, getRequestURL, setResponseHeader } from "h3";
import { isDemoMode, prisma } from "../utils/db";
import { demoSchools } from "../utils/demo-schools";
import { withX402Payment } from "../utils/x402";

const locales = ["ja", "en", "zh", "ko"] as const;
const xmlContentType = "application/xml; charset=UTF-8";

type SitemapSchool = {
	id: string;
	updatedAt: Date | string;
};

function escapeXml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

function getSiteUrl(event: Parameters<typeof getRequestURL>[0]) {
	return (
		process.env.PUBLIC_SITE_URL?.trim() || getRequestURL(event).origin
	).replace(/\/+$/, "");
}

function urlEntry(siteUrl: string, path: string, updatedAt?: Date | string) {
	const lastmod = updatedAt ? new Date(updatedAt).toISOString() : undefined;
	return [
		"<url>",
		`<loc>${escapeXml(`${siteUrl}${path}`)}</loc>`,
		lastmod && `<lastmod>${lastmod}</lastmod>`,
		"</url>",
	]
		.filter(Boolean)
		.join("");
}

async function handleSitemap(event: Parameters<typeof getRequestURL>[0]) {
	setResponseHeader(event, "content-type", xmlContentType);
	const siteUrl = getSiteUrl(event);
	const schools: SitemapSchool[] = isDemoMode()
		? demoSchools.map(({ id, updatedAt }) => ({ id, updatedAt }))
		: await prisma.school.findMany({
				select: { id: true, updatedAt: true },
				orderBy: { id: "asc" },
			});

	const staticPaths = locales.flatMap((locale) => [
		`/${locale}/`,
		`/${locale}/schools`,
		`/${locale}/about`,
	]);
	const schoolPaths = locales.flatMap((locale) =>
		schools.map((school) => ({
			path: `/${locale}/schools/${encodeURIComponent(school.id)}`,
			updatedAt: school.updatedAt,
		})),
	);
	const entries = [
		...staticPaths.map((path) => urlEntry(siteUrl, path)),
		...schoolPaths.map(({ path, updatedAt }) =>
			urlEntry(siteUrl, path, updatedAt),
		),
	].join("");

	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export default defineEventHandler((event) =>
	withX402Payment(event, () => handleSitemap(event), {
		"content-type": xmlContentType,
	}),
);
