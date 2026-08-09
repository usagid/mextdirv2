import { createError, defineEventHandler } from "h3";
import { requireAdmin } from "../../utils/admin";
import { serializeAdminUser } from "../../utils/admin-auth";
import { isDemoMode, prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
	if (isDemoMode())
		throw createError({
			statusCode: 503,
			statusMessage: "Admin panel requires PostgreSQL",
		});
	const actor = await requireAdmin(event);
	if (actor.id === "legacy-env-key") {
		return {
			user: { ...actor, active: true, createdAt: new Date(0).toISOString() },
		};
	}
	const user = await prisma.adminUser.findUnique({ where: { id: actor.id } });
	if (!user)
		throw createError({
			statusCode: 401,
			statusMessage: "Admin user not found",
		});
	return { user: serializeAdminUser(user) };
});
