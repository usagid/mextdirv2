import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireAdmin } from "../../../utils/admin";
import { prisma } from "../../../utils/db";

export default defineEventHandler(async (event) => {
	await requireAdmin(event, "ADMIN");
	const blockId = getRouterParam(event, "blockId");
	if (!blockId)
		throw createError({
			statusCode: 400,
			statusMessage: "Block ID is required",
		});
	const block = await prisma.accessBlock.findUnique({ where: { id: blockId } });
	if (!block)
		throw createError({ statusCode: 404, statusMessage: "Block not found" });
	await prisma.accessBlock.update({
		where: { id: blockId },
		data: { active: false },
	});
	return { ok: true };
});
