import {
	createError,
	defineEventHandler,
	readBody,
	setResponseStatus,
} from "h3";
import { requireAdmin } from "../../utils/admin";
import { createApiKeyValue } from "../../utils/admin-auth";
import { apiKeySchema } from "../../utils/admin-validation";
import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
	const actor = await requireAdmin(event, "ADMIN");
	if (actor.id === "legacy-env-key") {
		throw createError({
			statusCode: 403,
			statusMessage: "Log in with a database admin account to create API keys",
		});
	}
	const parsed = apiKeySchema.safeParse(await readBody(event));
	if (!parsed.success) {
		throw createError({
			statusCode: 400,
			statusMessage:
				parsed.error.issues[0]?.message || "Invalid API key details",
		});
	}

	let expiresAt: Date | undefined;
	if (parsed.data.expiresAt) {
		expiresAt = new Date(parsed.data.expiresAt);
		if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
			throw createError({
				statusCode: 400,
				statusMessage: "Expiration must be a future date",
			});
		}
	}

	const generated = createApiKeyValue();
	const key = await prisma.apiKey.create({
		data: {
			name: parsed.data.name,
			prefix: generated.prefix,
			keyHash: generated.keyHash,
			createdById: actor.id,
			expiresAt,
		},
	});
	setResponseStatus(event, 201);
	return {
		key: generated.value,
		metadata: {
			id: key.id,
			name: key.name,
			prefix: key.prefix,
			expiresAt: key.expiresAt?.toISOString() || null,
			createdAt: key.createdAt.toISOString(),
		},
	};
});
