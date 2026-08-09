import { defineEventHandler } from "h3";
import { isDemoMode, prisma } from "../../utils/db";

export default defineEventHandler(async () => ({
	available: !isDemoMode() && (await prisma.adminUser.count()) === 0,
}));
