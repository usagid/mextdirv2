import {
	createError,
	defineEventHandler,
	readBody,
	setResponseStatus,
} from "h3";
import { requireAdmin } from "../../utils/admin";
import { hashPassword, serializeAdminUser } from "../../utils/admin-auth";
import { userCreateSchema } from "../../utils/admin-validation";
import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
	await requireAdmin(event, "ADMIN");
	const parsed = userCreateSchema.safeParse(await readBody(event));
	if (!parsed.success) {
		throw createError({
			statusCode: 400,
			statusMessage: parsed.error.issues[0]?.message || "Invalid user details",
		});
	}

	try {
		const user = await prisma.adminUser.create({
			data: {
				username: parsed.data.username,
				passwordHash: await hashPassword(parsed.data.password),
				role: parsed.data.role,
			},
		});
		setResponseStatus(event, 201);
		return { user: serializeAdminUser(user) };
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2002"
		) {
			throw createError({
				statusCode: 409,
				statusMessage: "Username already exists",
			});
		}
		throw error;
	}
});
