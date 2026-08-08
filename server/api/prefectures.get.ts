import { defineEventHandler } from "h3";
import type { PrefectureOption } from "../../shared/types/prefecture";
import { isDemoMode, prisma } from "../utils/db";
import { demoSchools } from "../utils/demo-schools";
import { prefectureOptions } from "../utils/prefectures";

export default defineEventHandler(async (): Promise<PrefectureOption[]> => {
	if (isDemoMode()) {
		const counts = new Map<string, number>();
		for (const school of demoSchools) {
			counts.set(school.prefecture, (counts.get(school.prefecture) || 0) + 1);
		}
		return prefectureOptions(counts);
	}

	const rows = await prisma.school.groupBy({
		by: ["prefecture"],
		_count: { _all: true },
	});
	const counts = new Map(
		rows.map((row) => [row.prefecture, row._count._all] as const),
	);

	return prefectureOptions(counts);
});
