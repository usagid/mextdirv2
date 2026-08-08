import {
	createError,
	defineEventHandler,
	readBody,
	setResponseStatus,
} from "h3";
import { isDemoMode, prisma } from "../utils/db";
import { requireAdmin } from "../utils/admin";
import {
	schoolDetailInclude,
	serializeSchool,
} from "../utils/school-repository";
import { schoolInputSchema } from "../utils/school-validation";

export default defineEventHandler(async (event) => {
	requireAdmin(event);

	if (isDemoMode()) {
		throw createError({
			statusCode: 503,
			statusMessage:
				"Demo mode is read-only. Set DEMO_MODE=false and configure PostgreSQL to create listings.",
		});
	}

	const parsed = schoolInputSchema.safeParse(await readBody(event));
	if (!parsed.success) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid school payload",
			data: parsed.error.flatten(),
		});
	}

	const school = await prisma.school.create({
		data: parsed.data,
		include: schoolDetailInclude,
	});

	setResponseStatus(event, 201);
	return serializeSchool(school);
});
