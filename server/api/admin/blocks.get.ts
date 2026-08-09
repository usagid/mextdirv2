import { defineEventHandler } from "h3";
import { requireAdmin } from "../../utils/admin";
import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
	await requireAdmin(event, "ADMIN");
	const blocks = await prisma.accessBlock.findMany({
		orderBy: { createdAt: "desc" },
		include: { createdBy: { select: { username: true } } },
	});
	return blocks.map((block) => ({
		...block,
		createdAt: block.createdAt.toISOString(),
		updatedAt: block.updatedAt.toISOString(),
	}));
});
