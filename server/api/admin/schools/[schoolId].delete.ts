import {
	createError,
	defineEventHandler,
	getRouterParam,
	setResponseStatus,
} from "h3";
import { requireAdmin } from "../../../utils/admin";
import { isDemoMode, prisma } from "../../../utils/db";

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
	try {
		await prisma.school.delete({ where: { id: schoolId } });
		setResponseStatus(event, 204);
		return null;
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
