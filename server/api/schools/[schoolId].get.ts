import { createError, defineEventHandler, getRouterParam } from "h3";
import { isDemoMode, prisma } from "../../utils/db";
import { findDemoSchool } from "../../utils/demo-schools";
import {
	schoolDetailInclude,
	serializeSchool,
} from "../../utils/school-repository";

export default defineEventHandler(async (event) => {
	const schoolId = getRouterParam(event, "schoolId");

	if (!schoolId) {
		throw createError({
			statusCode: 400,
			statusMessage: "School ID is required",
		});
	}

	if (isDemoMode()) {
		const school = findDemoSchool(schoolId);
		if (!school)
			throw createError({ statusCode: 404, statusMessage: "School not found" });
		return school;
	}

	const school = await prisma.school.findUnique({
		where: { id: schoolId },
		include: schoolDetailInclude,
	});

	if (!school) {
		throw createError({ statusCode: 404, statusMessage: "School not found" });
	}

	return serializeSchool(school);
});
