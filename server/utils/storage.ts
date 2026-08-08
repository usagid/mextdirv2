import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { createError } from "h3";

const allowedTypes = new Map([
	["image/jpeg", ".jpg"],
	["image/png", ".png"],
	["image/webp", ".webp"],
	["image/gif", ".gif"],
	["image/svg+xml", ".svg"],
]);

export async function saveLocalImage(
	data: Buffer,
	contentType: string | undefined,
	originalName: string | undefined,
	schoolId: string,
) {
	const extension =
		allowedTypes.get(contentType || "") ||
		extname(originalName || "").toLowerCase();

	if (
		!allowedTypes.has(contentType || "") &&
		![".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(extension)
	) {
		throw createError({
			statusCode: 415,
			statusMessage: "Unsupported image type",
		});
	}

	if (data.byteLength > 10 * 1024 * 1024) {
		throw createError({
			statusCode: 413,
			statusMessage: "Image must be 10 MB or smaller",
		});
	}

	const filename = `${schoolId}-${randomUUID()}${extension === ".jpeg" ? ".jpg" : extension}`;
	const directory =
		process.env.UPLOAD_DIR || join(process.cwd(), "public", "uploads");
	await mkdir(directory, { recursive: true });
	await writeFile(join(directory, filename), data);
	return `/uploads/${filename}`;
}

export function assertSupportedStorage() {
	const driver = process.env.STORAGE_DRIVER || "local";
	if (driver !== "local") {
		throw createError({
			statusCode: 501,
			statusMessage: `Storage driver "${driver}" is not wired in this build. Use local or follow the S3 notes in README.md.`,
		});
	}
}
