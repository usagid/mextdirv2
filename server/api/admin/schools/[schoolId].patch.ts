import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { requireAdmin } from "../../../utils/admin";
import { prisma, isDemoMode } from "../../../utils/db";
import { schoolInputSchema } from "../../../utils/school-validation";
import {
	schoolDetailInclude,
	serializeSchool,
} from "../../../utils/school-repository";

export default defineEventHandler(async (event) => {
	await requireAdmin(event);
	if (isDemoMode())
		throw createError({
			statusCode: 503,
			statusMessage: "Demo mode is read-only",
		});
	const schoolId = getRouterParam(event, "schoolId");
	if (!schoolId)
		throw createError({
			statusCode: 400,
			statusMessage: "School ID is required",
		});
	const parsed = schoolInputSchema.safeParse(await readBody(event));
	if (!parsed.success)
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid school payload",
			data: parsed.error.flatten(),
		});
	try {
		const school = await prisma.school.update({
			where: { id: schoolId },
			data: parsed.data,
			include: schoolDetailInclude,
		});
		return serializeSchool(school);
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2025"
		) {
			throw createError({ statusCode: 404, statusMessage: "School not found" });
		}
		throw error;
	}
});
