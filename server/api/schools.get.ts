import { createError, defineEventHandler, getQuery } from "h3";
import type { H3Event } from "h3";
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
import { withX402Payment } from "../utils/x402";

const sortOrder: Record<string, Prisma.SchoolOrderByWithRelationInput> = {
	newest: { createdAt: "desc" },
	oldest: { createdAt: "asc" },
	"floor-desc": { floorArea: "desc" },
	"floor-asc": { floorArea: "asc" },
};

function structureWhere(value: string): Prisma.SchoolWhereInput {
	const matchers: Record<string, string[]> = {
		wood: ["木造"],
		concrete: ["鉄筋コンクリート", "RC"],
		steel: ["鉄骨", "S造"],
	};
	const values = matchers[value];
	if (!values)
		return { structureInfo: { contains: value, mode: "insensitive" } };
	return {
		OR: values.map((matcher) => ({
			structureInfo: { contains: matcher, mode: "insensitive" },
		})),
	};
}

function facilityWhere(value: string): Prisma.SchoolWhereInput {
	const matchers: Record<string, string[]> = {
		"school-building": ["校舎", "園舎"],
		gym: ["体育館", "屋内運動場", "屋体"],
		pool: ["プール"],
		field: ["グラウンド", "グランド", "校庭", "運動場"],
		residence: ["寮", "教員住宅", "宿舎"],
	};
	const values = matchers[value];
	if (!values)
		return { facilityInfo: { contains: value, mode: "insensitive" } };
	return {
		OR: values.map((matcher) => ({
			facilityInfo: { contains: matcher, mode: "insensitive" },
		})),
	};
}

async function handleSchools(event: H3Event) {
	const query = getQuery(event);
	const filters: SchoolFilters = {
		prefecture: queryString(query.prefecture) || undefined,
		city: queryString(query.city) || undefined,
		keyword: queryString(query.keyword) || undefined,
		facilityType: queryString(query.facilityType) || undefined,
		structure: queryString(query.structure) || undefined,
		floorAreaMin: queryInteger(query.floorAreaMin),
		floorAreaMax: queryInteger(query.floorAreaMax),
		buildingAreaMin: queryInteger(query.buildingAreaMin),
		buildingAreaMax: queryInteger(query.buildingAreaMax),
		floorNumMin: queryInteger(query.floorNumMin),
		floorNumMax: queryInteger(query.floorNumMax),
		sort: queryString(query.sort) || "newest",
		page: Math.max(1, queryInteger(query.page, 1) || 1),
	};

	const ranges = [
		["floorArea", filters.floorAreaMin, filters.floorAreaMax],
		["buildingArea", filters.buildingAreaMin, filters.buildingAreaMax],
		["floorNum", filters.floorNumMin, filters.floorNumMax],
	] as const;
	const invalidRange = ranges.find(
		([, minimum, maximum]) =>
			minimum !== undefined && maximum !== undefined && minimum > maximum,
	);
	if (invalidRange) {
		throw createError({
			statusCode: 400,
			statusMessage: `${invalidRange[0]} minimum must be less than maximum`,
		});
	}

	const hideContacts = await shouldHideContactInformation(event);
	if (isDemoMode()) {
		const result = listDemoSchools(filters);
		return hideContacts ? maskSchoolList(result) : result;
	}

	const conditions: Prisma.SchoolWhereInput[] = [];
	if (filters.facilityType)
		conditions.push(facilityWhere(filters.facilityType));
	if (filters.structure) conditions.push(structureWhere(filters.structure));
	if (
		filters.floorAreaMin !== undefined ||
		filters.floorAreaMax !== undefined
	) {
		conditions.push({
			floorArea: { gte: filters.floorAreaMin, lte: filters.floorAreaMax },
		});
	}
	if (
		filters.buildingAreaMin !== undefined ||
		filters.buildingAreaMax !== undefined
	) {
		conditions.push({
			buildingArea: {
				gte: filters.buildingAreaMin,
				lte: filters.buildingAreaMax,
			},
		});
	}
	if (filters.floorNumMin !== undefined || filters.floorNumMax !== undefined) {
		conditions.push({
			floorNum: { gte: filters.floorNumMin, lte: filters.floorNumMax },
		});
	}
	if (filters.keyword) {
		conditions.push({
			OR: [
				{ schoolName: { contains: filters.keyword, mode: "insensitive" } },
				{ city: { contains: filters.keyword, mode: "insensitive" } },
				{ address: { contains: filters.keyword, mode: "insensitive" } },
				{ closestPoi: { contains: filters.keyword, mode: "insensitive" } },
				{ facilityInfo: { contains: filters.keyword, mode: "insensitive" } },
				{ structureInfo: { contains: filters.keyword, mode: "insensitive" } },
				{ lister: { contains: filters.keyword, mode: "insensitive" } },
				{ recruitment: { contains: filters.keyword, mode: "insensitive" } },
				{ conditions: { contains: filters.keyword, mode: "insensitive" } },
			],
		});
	}

	const where: Prisma.SchoolWhereInput = {
		...(filters.prefecture ? { prefecture: filters.prefecture } : {}),
		...(filters.city
			? { city: { contains: filters.city, mode: "insensitive" } }
			: {}),
		...(conditions.length ? { AND: conditions } : {}),
	};

	const pageSize = 10;
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
}

export default defineEventHandler((event) =>
	withX402Payment(event, () => handleSchools(event)),
);
