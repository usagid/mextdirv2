import { defineEventHandler, getQuery } from "h3";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "../../utils/admin";
import { queryInteger, queryString } from "../../utils/school-validation";
import { listSchools } from "../../utils/school-repository";

export default defineEventHandler(async (event) => {
	await requireAdmin(event);
	const query = getQuery(event);
	const search = queryString(query.search);
	const page = Math.max(1, queryInteger(query.page, 1) || 1);
	const pageSize = Math.min(
		100,
		Math.max(1, queryInteger(query.pageSize, 100) || 100),
	);
	const where: Prisma.SchoolWhereInput = search
		? {
				OR: [
					{ schoolName: { contains: search, mode: "insensitive" } },
					{ prefecture: { contains: search, mode: "insensitive" } },
					{ city: { contains: search, mode: "insensitive" } },
					{ address: { contains: search, mode: "insensitive" } },
				],
			}
		: {};
	const result = await listSchools(
		where,
		{ createdAt: "desc" },
		(page - 1) * pageSize,
		pageSize,
	);
	return {
		items: result.schools,
		total: result.total,
		page,
		pageSize,
		totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
	};
});
