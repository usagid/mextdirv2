import { defineEventHandler } from "h3";
import { clearAdminSession } from "../../utils/admin-auth";

export default defineEventHandler(async (event) => {
	await clearAdminSession(event);
	return { ok: true };
});
