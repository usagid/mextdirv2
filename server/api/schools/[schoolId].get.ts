import { createError, defineEventHandler, getRouterParam } from "h3";
import { isDemoMode, prisma } from "../../utils/db";
import { findDemoSchool } from "../../utils/demo-schools";
import {
	maskSchoolContacts,
	shouldHideContactInformation,
} from "../../utils/access-blocks";
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

	const hideContacts = await shouldHideContactInformation(event);
	if (isDemoMode()) {
		const school = findDemoSchool(schoolId);
		if (!school)
			throw createError({ statusCode: 404, statusMessage: "School not found" });
		return hideContacts ? maskSchoolContacts(school) : school;
	}

	const school = await prisma.school.findUnique({
		where: { id: schoolId },
		include: schoolDetailInclude,
	});

	if (!school) {
		throw createError({ statusCode: 404, statusMessage: "School not found" });
	}

	return serializeSchool(school, { hideContacts });
});
