import { defineEventHandler } from "h3";
import { requireAdmin } from "../../utils/admin";
import { prisma } from "../../utils/db";

function serializeKey(key: {
	id: string;
	name: string;
	prefix: string;
	lastUsedAt: Date | null;
	expiresAt: Date | null;
	revokedAt: Date | null;
	createdAt: Date;
}) {
	return {
		...key,
		lastUsedAt: key.lastUsedAt?.toISOString() || null,
		expiresAt: key.expiresAt?.toISOString() || null,
		revokedAt: key.revokedAt?.toISOString() || null,
		createdAt: key.createdAt.toISOString(),
	};
}

export default defineEventHandler(async (event) => {
	await requireAdmin(event, "ADMIN");
	const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });
	return keys.map(serializeKey);
});
