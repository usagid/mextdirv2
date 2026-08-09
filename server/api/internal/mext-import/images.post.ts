import { timingSafeEqual } from "node:crypto";
import {
	createError,
	defineEventHandler,
	getRequestHeader,
	readMultipartFormData,
} from "h3";
import type { H3Event } from "h3";
import { z } from "zod";
import { isDemoMode, prisma } from "../../../utils/db";
import { assertSupportedStorage, saveImage } from "../../../utils/storage";

const manifestSchema = z.array(
	z.object({
		sourceKey: z.string().trim().min(1).max(200),
		images: z
			.array(
				z.object({
					field: z.string().trim().min(1).max(100),
					sourceKey: z.string().trim().min(1).max(300),
				}),
			)
			.max(10),
	}),
).max(100);

function requireImporter(event: H3Event) {
	const expected = process.env.MEXT_IMPORT_SECRET;
	const provided = getRequestHeader(event, "x-mext-import-secret") || "";
	if (!expected) {
		throw createError({
			statusCode: 503,
			statusMessage: "MEXT importer secret is not configured",
		});
	}

	const expectedBytes = Buffer.from(expected);
	const providedBytes = Buffer.from(provided);
	if (
		expectedBytes.length !== providedBytes.length ||
		!timingSafeEqual(expectedBytes, providedBytes)
	) {
		throw createError({
			statusCode: 401,
			statusMessage: "MEXT importer authorization required",
		});
	}
}

export default defineEventHandler(async (event) => {
	requireImporter(event);
	assertSupportedStorage();

	if (isDemoMode()) {
		throw createError({
			statusCode: 503,
			statusMessage: "MEXT image import is unavailable in demo mode",
		});
	}

	const form = await readMultipartFormData(event);
	const manifestPart = form?.find((part) => part.name === "manifest");
	if (!manifestPart?.data) {
		throw createError({
			statusCode: 400,
			statusMessage: "MEXT image manifest is required",
		});
	}

	let manifest: unknown;
	try {
		manifest = JSON.parse(manifestPart.data.toString());
	} catch {
		throw createError({
			statusCode: 400,
			statusMessage: "MEXT image manifest is invalid JSON",
		});
	}
	const parsedManifest = manifestSchema.safeParse(manifest);
	if (!parsedManifest.success) {
		throw createError({
			statusCode: 400,
			statusMessage: "MEXT image manifest is invalid",
		});
	}

	const files = new Map(
		(form || [])
			.filter((part) => Boolean(part.name && part.filename && part.data?.byteLength))
			.map((part) => [part.name as string, part]),
	);
	let created = 0;
	let retained = 0;
	let deleted = 0;

	for (const schoolEntry of parsedManifest.data) {
		const school = await prisma.school.findUnique({
			where: { sourceKey: schoolEntry.sourceKey },
			select: { id: true, schoolName: true },
		});
		if (!school) {
			throw createError({
			statusCode: 404,
			statusMessage: `School not found for source key ${schoolEntry.sourceKey}`,
			});
		}

		const existing = await prisma.image.findMany({
			where: { schoolId: school.id, sourceKey: { not: null } },
		});
		const existingByKey = new Map(
			existing.map((image) => [image.sourceKey as string, image]),
		);
		const keepKeys: string[] = [];

		for (const [index, imageEntry] of schoolEntry.images.entries()) {
			keepKeys.push(imageEntry.sourceKey);
			const current = existingByKey.get(imageEntry.sourceKey);
			if (current) {
				await prisma.image.update({
					where: { id: current.id },
					data: { sortOrder: index, altText: `${school.schoolName} image ${index + 1}` },
				});
				retained += 1;
				continue;
			}

			const file = files.get(imageEntry.field);
			if (!file?.data) {
				throw createError({
					statusCode: 400,
					statusMessage: `Missing MEXT image file ${imageEntry.field}`,
				});
			}
			const url = await saveImage(
				Buffer.from(file.data),
				file.type,
				file.filename,
				school.id,
			);
			await prisma.image.create({
				data: {
					schoolId: school.id,
					sourceKey: imageEntry.sourceKey,
					url,
					altText: `${school.schoolName} image ${index + 1}`,
					sortOrder: index,
				},
			});
			created += 1;
		}

		const stale = keepKeys.length
			? await prisma.image.deleteMany({
					where: { schoolId: school.id, sourceKey: { not: null, notIn: keepKeys } },
			  })
			: await prisma.image.deleteMany({
					where: { schoolId: school.id, sourceKey: { not: null } },
			  });
		deleted += stale.count;
	}

	return { schools: parsedManifest.data.length, created, retained, deleted };
});
