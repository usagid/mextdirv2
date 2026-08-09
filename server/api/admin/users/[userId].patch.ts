import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { requireAdmin } from "../../../utils/admin";
import { serializeAdminUser } from "../../../utils/admin-auth";
import { userPatchSchema } from "../../../utils/admin-validation";
import { prisma } from "../../../utils/db";

export default defineEventHandler(async (event) => {
	const actor = await requireAdmin(event, "ADMIN");
	const userId = getRouterParam(event, "userId");
	if (!userId)
		throw createError({
			statusCode: 400,
			statusMessage: "User ID is required",
		});

	const parsed = userPatchSchema.safeParse(await readBody(event));
	if (!parsed.success) {
		throw createError({
			statusCode: 400,
			statusMessage: parsed.error.issues[0]?.message || "Invalid user update",
		});
	}
	if (actor.id === userId && parsed.data.active === false) {
		throw createError({
			statusCode: 400,
			statusMessage: "You cannot deactivate your own account",
		});
	}

	const current = await prisma.adminUser.findUnique({ where: { id: userId } });
	if (!current)
		throw createError({ statusCode: 404, statusMessage: "User not found" });
	const removesAdmin =
		current.role === "ADMIN" &&
		(parsed.data.active === false || parsed.data.role === "EDITOR");
	if (removesAdmin) {
		const activeAdmins = await prisma.adminUser.count({
			where: { role: "ADMIN", active: true },
		});
		if (activeAdmins <= 1) {
			throw createError({
				statusCode: 400,
				statusMessage: "Keep at least one active administrator",
			});
		}
	}

	const user = await prisma.adminUser.update({
		where: { id: userId },
		data: parsed.data,
	});
	return { user: serializeAdminUser(user) };
});
