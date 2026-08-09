import {
	createError,
	defineEventHandler,
	readBody,
	setResponseStatus,
} from "h3";
import { isDemoMode, prisma } from "../../utils/db";
import {
	createAdminSession,
	hashPassword,
	serializeAdminUser,
} from "../../utils/admin-auth";
import { setupSchema } from "../../utils/admin-validation";

export default defineEventHandler(async (event) => {
	if (isDemoMode()) {
		throw createError({
			statusCode: 503,
			statusMessage: "Disable demo mode before creating an admin",
		});
	}
	const parsed = setupSchema.safeParse(await readBody(event));
	if (!parsed.success) {
		throw createError({
			statusCode: 400,
			statusMessage: parsed.error.issues[0]?.message || "Invalid setup details",
		});
	}

	const passwordHash = await hashPassword(parsed.data.password);
	const user = await prisma.$transaction(async (transaction) => {
		await transaction.$executeRaw`SELECT pg_advisory_xact_lock(73849102)`;
		if ((await transaction.adminUser.count()) > 0) {
			throw createError({
				statusCode: 409,
				statusMessage: "Initial admin setup is already complete",
			});
		}
		return transaction.adminUser.create({
			data: {
				username: parsed.data.username,
				passwordHash,
				role: "ADMIN",
			},
		});
	});
	await createAdminSession(event, user.id);
	setResponseStatus(event, 201);
	return { user: serializeAdminUser(user) };
});
