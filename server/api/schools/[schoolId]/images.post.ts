import {
	createError,
	defineEventHandler,
	getRouterParam,
	readBody,
	readMultipartFormData,
	setResponseStatus,
} from "h3";
import { z } from "zod";
import { isDemoMode, prisma } from "../../../utils/db";
import { requireAdmin } from "../../../utils/admin";
import { assertSupportedStorage, saveLocalImage } from "../../../utils/storage";

const urlSchema = z
	.string()
	.trim()
	.refine((value) => {
		try {
			if (value.startsWith("/")) return true;
			const url = new URL(value);
			return url.protocol === "http:" || url.protocol === "https:";
		} catch {
			return false;
		}
	}, "Image URL must be an absolute HTTP(S) URL or a local path");

export default defineEventHandler(async (event) => {
	requireAdmin(event);
	assertSupportedStorage();

	if (isDemoMode()) {
		throw createError({
			statusCode: 503,
			statusMessage:
				"Demo mode is read-only. Set DEMO_MODE=false and configure PostgreSQL to upload images.",
		});
	}

	const schoolId = getRouterParam(event, "schoolId");
	if (!schoolId)
		throw createError({
			statusCode: 400,
			statusMessage: "School ID is required",
		});

	const school = await prisma.school.findUnique({
		where: { id: schoolId },
		select: { id: true },
	});
	if (!school)
		throw createError({ statusCode: 404, statusMessage: "School not found" });

	const form = await readMultipartFormData(event);
	const files = (form || []).filter((part) =>
		Boolean(part.filename && part.data?.byteLength),
	);
	const urlParts = (form || []).filter(
		(part) => part.name === "url" || part.name === "urls",
	);
	const altText =
		(form || [])
			.find((part) => part.name === "altText")
			?.data?.toString()
			.trim() || null;
	const sources: Array<{
		url?: string;
		data?: Buffer;
		contentType?: string;
		filename?: string;
	}> = [];

	for (const part of files) {
		sources.push({
			data: Buffer.from(part.data),
			contentType: part.type,
			filename: part.filename,
		});
	}

	for (const part of urlParts) {
		const url = urlSchema.safeParse(part.data.toString());
		if (!url.success) {
			throw createError({
				statusCode: 400,
				statusMessage: url.error.issues[0]?.message || "Invalid image URL",
			});
		}
		sources.push({ url: url.data });
	}

	if (!sources.length && !form) {
		const body = await readBody<{
			url?: string;
			altText?: string;
			sortOrder?: number;
		}>(event);
		const url = urlSchema.safeParse(body?.url || "");
		if (!url.success)
			throw createError({
				statusCode: 400,
				statusMessage: "Provide an image file or url",
			});
		sources.push({ url: url.data });
	}

	if (!sources.length) {
		throw createError({
			statusCode: 400,
			statusMessage: "Provide at least one image file or url",
		});
	}

	const lastImage = await prisma.image.aggregate({
		where: { schoolId },
		_max: { sortOrder: true },
	});
	let sortOrder = (lastImage._max.sortOrder ?? -1) + 1;
	const created = [];

	for (const source of sources) {
		const url = source.data
			? await saveLocalImage(
					source.data,
					source.contentType,
					source.filename,
					schoolId,
				)
			: source.url;

		if (!url) continue;

		created.push(
			await prisma.image.create({
				data: { schoolId, url, altText, sortOrder: sortOrder++ },
			}),
		);
	}

	setResponseStatus(event, 201);
	return created.map((image) => ({
		...image,
		createdAt: image.createdAt.toISOString(),
	}));
});
