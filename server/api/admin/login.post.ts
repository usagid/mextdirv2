import { createError, defineEventHandler, readBody } from "h3";
import { isDemoMode, prisma } from "../../utils/db";
import {
	assertLoginAllowed,
	clearLoginFailures,
	createAdminSession,
	hashPassword,
	noteLoginFailure,
	serializeAdminUser,
	verifyPassword,
} from "../../utils/admin-auth";
import { loginSchema } from "../../utils/admin-validation";

export default defineEventHandler(async (event) => {
	if (isDemoMode()) {
		throw createError({
			statusCode: 503,
			statusMessage: "Disable demo mode before logging in",
		});
	}
	const rateKey = assertLoginAllowed(event);
	const parsed = loginSchema.safeParse(await readBody(event));
	if (!parsed.success) {
		noteLoginFailure(rateKey);
		throw createError({
			statusCode: 400,
			statusMessage: "Enter a username and password",
		});
	}

	const user = await prisma.adminUser.findUnique({
		where: { username: parsed.data.username },
	});
	const valid = user?.active
		? await verifyPassword(parsed.data.password, user.passwordHash)
		: await hashPassword(parsed.data.password).then(() => false);
	if (!user || !user.active || !valid) {
		noteLoginFailure(rateKey);
		throw createError({
			statusCode: 401,
			statusMessage: "Invalid username or password",
		});
	}

	clearLoginFailures(rateKey);
	await createAdminSession(event, user.id);
	return { user: serializeAdminUser(user) };
});
