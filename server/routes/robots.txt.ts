import { defineEventHandler, getRequestURL } from "h3";

export default defineEventHandler((event) => {
	const siteUrl = (
		process.env.PUBLIC_SITE_URL?.trim() || getRequestURL(event).origin
	).replace(/\/+$/, "");

	return [
		"User-agent: *",
		"Allow: /",
		"Disallow: /admin",
		"Disallow: /api",
		`Sitemap: ${siteUrl}/sitemap.xml`,
		"",
	].join("\n");
});
