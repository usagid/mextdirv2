import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireAdmin } from "../../../utils/admin";
import { prisma } from "../../../utils/db";
import {
	schoolDetailInclude,
	serializeSchool,
} from "../../../utils/school-repository";

export default defineEventHandler(async (event) => {
	await requireAdmin(event);
	const schoolId = getRouterParam(event, "schoolId");
	if (!schoolId)
		throw createError({
			statusCode: 400,
			statusMessage: "School ID is required",
		});
	const school = await prisma.school.findUnique({
		where: { id: schoolId },
		include: schoolDetailInclude,
	});
	if (!school)
		throw createError({ statusCode: 404, statusMessage: "School not found" });
	return serializeSchool(school);
});
