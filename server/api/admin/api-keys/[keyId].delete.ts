import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireAdmin } from "../../../utils/admin";
import { prisma } from "../../../utils/db";

export default defineEventHandler(async (event) => {
	await requireAdmin(event, "ADMIN");
	const keyId = getRouterParam(event, "keyId");
	if (!keyId)
		throw createError({
			statusCode: 400,
			statusMessage: "API key ID is required",
		});
	const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
	if (!key)
		throw createError({ statusCode: 404, statusMessage: "API key not found" });
	await prisma.apiKey.update({
		where: { id: keyId },
		data: { revokedAt: new Date() },
	});
	return { ok: true };
});
