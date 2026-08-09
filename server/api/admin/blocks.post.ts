import {
	createError,
	defineEventHandler,
	readBody,
	setResponseStatus,
} from "h3";
import { requireAdmin } from "../../utils/admin";
import { blockSchema } from "../../utils/admin-validation";
import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
	const actor = await requireAdmin(event, "ADMIN");
	const parsed = blockSchema.safeParse(await readBody(event));
	if (!parsed.success) {
		throw createError({
			statusCode: 400,
			statusMessage: parsed.error.issues[0]?.message || "Invalid block details",
		});
	}

	const block = await prisma.accessBlock.create({
		data: {
			ipAddress: parsed.data.ipAddress || null,
			userAgentContains: parsed.data.userAgentContains || null,
			reason: parsed.data.reason || null,
			createdById: actor.id === "legacy-env-key" ? null : actor.id,
		},
		include: { createdBy: { select: { username: true } } },
	});
	setResponseStatus(event, 201);
	return {
		...block,
		createdAt: block.createdAt.toISOString(),
		updatedAt: block.updatedAt.toISOString(),
	};
});
