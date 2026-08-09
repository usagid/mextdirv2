import { createError, defineEventHandler, getQuery } from "h3";
import type { Prisma } from "@prisma/client";
import type { SchoolFilters } from "../../shared/types/school";
import { isDemoMode } from "../utils/db";
import { listDemoSchools } from "../utils/demo-schools";
import {
	maskSchoolList,
	shouldHideContactInformation,
} from "../utils/access-blocks";
import { listSchools } from "../utils/school-repository";
import { queryInteger, queryString } from "../utils/school-validation";

const sortOrder: Record<string, Prisma.SchoolOrderByWithRelationInput> = {
	newest: { createdAt: "desc" },
	oldest: { createdAt: "asc" },
	"floor-desc": { floorArea: "desc" },
	"floor-asc": { floorArea: "asc" },
};

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const filters: SchoolFilters = {
		prefecture: queryString(query.prefecture) || undefined,
		city: queryString(query.city) || undefined,
		keyword: queryString(query.keyword) || undefined,
		facilityType: queryString(query.facilityType) || undefined,
		structure: queryString(query.structure) || undefined,
		floorAreaMin: queryInteger(query.floorAreaMin),
		floorAreaMax: queryInteger(query.floorAreaMax),
		sort: queryString(query.sort) || "newest",
		page: Math.max(1, queryInteger(query.page, 1) || 1),
	};

	if (
		filters.floorAreaMin !== undefined &&
		filters.floorAreaMax !== undefined &&
		filters.floorAreaMin > filters.floorAreaMax
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "floorAreaMin must be less than floorAreaMax",
		});
	}

	const hideContacts = await shouldHideContactInformation(event);
	if (isDemoMode()) {
		const result = listDemoSchools(filters);
		return hideContacts ? maskSchoolList(result) : result;
	}

	const where: Prisma.SchoolWhereInput = {
		...(filters.prefecture ? { prefecture: filters.prefecture } : {}),
		...(filters.city
			? { city: { contains: filters.city, mode: "insensitive" } }
			: {}),
		...(filters.facilityType
			? {
					facilityInfo: { contains: filters.facilityType, mode: "insensitive" },
				}
			: {}),
		...(filters.structure
			? { structureInfo: { contains: filters.structure, mode: "insensitive" } }
			: {}),
		...(filters.floorAreaMin !== undefined || filters.floorAreaMax !== undefined
			? { floorArea: { gte: filters.floorAreaMin, lte: filters.floorAreaMax } }
			: {}),
		...(filters.keyword
			? {
					OR: [
						{ schoolName: { contains: filters.keyword, mode: "insensitive" } },
						{ city: { contains: filters.keyword, mode: "insensitive" } },
						{ address: { contains: filters.keyword, mode: "insensitive" } },
						{ closestPoi: { contains: filters.keyword, mode: "insensitive" } },
						{
							facilityInfo: { contains: filters.keyword, mode: "insensitive" },
						},
					],
				}
			: {}),
	};

	const pageSize = 9;
	const orderBy: Prisma.SchoolOrderByWithRelationInput = sortOrder[
		filters.sort || "newest"
	] || { createdAt: "desc" };
	const result = await listSchools(
		where,
		orderBy,
		((filters.page || 1) - 1) * pageSize,
		pageSize,
		{ hideContacts },
	);

	return {
		items: result.schools,
		total: result.total,
		page: filters.page || 1,
		pageSize,
		totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
	};
});
