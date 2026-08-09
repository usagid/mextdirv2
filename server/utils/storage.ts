import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { createError } from "h3";

const allowedTypes = new Map([
	["image/jpeg", ".jpg"],
	["image/png", ".png"],
	["image/webp", ".webp"],
	["image/gif", ".gif"],
	["image/svg+xml", ".svg"],
]);
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
const contentTypeByExtension: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".gif": "image/gif",
	".svg": "image/svg+xml",
};
const maxImageBytes = 10 * 1024 * 1024;

let s3Client: S3Client | undefined;

type S3Config = {
	endpoint: string;
	region: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	publicUrl: string;
	forcePathStyle: boolean;
};

function storageDriver() {
	return process.env.STORAGE_DRIVER || "local";
}

function imageExtension(
	contentType: string | undefined,
	originalName: string | undefined,
) {
	const normalizedType = contentType?.split(";")[0]?.trim() || "";
	const extension =
		allowedTypes.get(normalizedType) ||
		extname(originalName || "").toLowerCase();

	if (
		!allowedTypes.has(normalizedType) &&
		!allowedExtensions.includes(extension)
	) {
		throw createError({
			statusCode: 415,
			statusMessage: "Unsupported image type",
		});
	}

	return extension === ".jpeg" ? ".jpg" : extension;
}

function validateImage(
	data: Buffer,
	contentType: string | undefined,
	originalName: string | undefined,
) {
	if (data.byteLength > maxImageBytes) {
		throw createError({
			statusCode: 413,
			statusMessage: "Image must be 10 MB or smaller",
		});
	}

	return imageExtension(contentType, originalName);
}

function s3Config(): S3Config {
	const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "");
	const region = process.env.S3_REGION || "us-east-1";
	const bucket = process.env.S3_BUCKET;
	const accessKeyId = process.env.S3_ACCESS_KEY_ID;
	const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

	const missing = [
		!endpoint && "S3_ENDPOINT",
		!bucket && "S3_BUCKET",
		!accessKeyId && "S3_ACCESS_KEY_ID",
		!secretAccessKey && "S3_SECRET_ACCESS_KEY",
	].filter(Boolean);

	if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
		throw createError({
			statusCode: 503,
			statusMessage: `S3 storage is missing configuration: ${missing.join(", ")}`,
		});
	}

	return {
		endpoint,
		region,
		bucket,
		accessKeyId,
		secretAccessKey,
		publicUrl: (process.env.S3_PUBLIC_URL || `${endpoint}/${bucket}`).replace(
			/\/$/,
			"",
		),
		forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
	};
}

function getS3Client(config: S3Config) {
	if (!s3Client) {
		s3Client = new S3Client({
			endpoint: config.endpoint,
			region: config.region,
			forcePathStyle: config.forcePathStyle,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
		});
	}
	return s3Client;
}

function publicObjectUrl(config: S3Config, key: string) {
	const encodedKey = key
		.split("/")
		.map((segment) => encodeURIComponent(segment))
		.join("/");
	return `${config.publicUrl}/${encodedKey}`;
}

async function saveS3Image(
	data: Buffer,
	contentType: string | undefined,
	originalName: string | undefined,
	schoolId: string,
) {
	const extension = validateImage(data, contentType, originalName);
	const config = s3Config();
	const key = `schools/${schoolId}/${randomUUID()}${extension}`;

	await getS3Client(config).send(
		new PutObjectCommand({
			Bucket: config.bucket,
			Key: key,
			Body: data,
			ContentType:
				contentType?.split(";")[0]?.trim() || contentTypeByExtension[extension],
			CacheControl: "public, max-age=31536000, immutable",
		}),
	);

	return publicObjectUrl(config, key);
}

export async function saveImage(
	data: Buffer,
	contentType: string | undefined,
	originalName: string | undefined,
	schoolId: string,
) {
	if (storageDriver() === "s3") {
		return saveS3Image(data, contentType, originalName, schoolId);
	}

	const extension = validateImage(data, contentType, originalName);
	const filename = `${schoolId}-${randomUUID()}${extension}`;
	const directory =
		process.env.UPLOAD_DIR || join(process.cwd(), "public", "uploads");
	await mkdir(directory, { recursive: true });
	await writeFile(join(directory, filename), data);
	return `/uploads/${filename}`;
}

export function assertSupportedStorage() {
	const driver = storageDriver();
	if (driver === "s3") {
		s3Config();
		return;
	}
	if (driver !== "local") {
		throw createError({
			statusCode: 501,
			statusMessage: `Storage driver "${driver}" is not supported. Use local or s3.`,
		});
	}
}
