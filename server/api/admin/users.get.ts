import { defineEventHandler } from "h3";
import { requireAdmin } from "../../utils/admin";
import { serializeAdminUser } from "../../utils/admin-auth";
import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
	await requireAdmin(event, "ADMIN");
	const users = await prisma.adminUser.findMany({
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			username: true,
			role: true,
			active: true,
			createdAt: true,
		},
	});
	return users.map(serializeAdminUser);
});
