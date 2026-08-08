import type { Prisma } from "@prisma/client";
import type { School } from "../../shared/types/school";
import { prisma } from "./db";

export const schoolListInclude = {
	images: {
		orderBy: { sortOrder: "asc" as const },
		take: 1,
	},
} satisfies Prisma.SchoolInclude;

export const schoolDetailInclude = {
	images: {
		orderBy: { sortOrder: "asc" as const },
	},
} satisfies Prisma.SchoolInclude;

type SchoolWithImages = Prisma.SchoolGetPayload<{
	include: typeof schoolDetailInclude;
}>;

export function serializeSchool(school: SchoolWithImages): School {
	return {
		...school,
		createdAt: school.createdAt.toISOString(),
		updatedAt: school.updatedAt.toISOString(),
		images: school.images.map((image) => ({
			...image,
			createdAt: image.createdAt.toISOString(),
		})),
	};
}

export async function listSchools(
	where: Prisma.SchoolWhereInput,
	orderBy: Prisma.SchoolOrderByWithRelationInput,
	skip: number,
	take: number,
) {
	const [total, schools] = await Promise.all([
		prisma.school.count({ where }),
		prisma.school.findMany({
			where,
			orderBy,
			skip,
			take,
			include: schoolListInclude,
		}),
	]);

	return {
		total,
		schools: schools.map((school) =>
			serializeSchool(school as SchoolWithImages),
		),
	};
}
