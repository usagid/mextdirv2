import { z } from "zod";

const text = z.string().trim().default("");
const integer = z.coerce.number().int().nonnegative().default(0);

export const schoolInputSchema = z
	.object({
		prefecture: text,
		city: text,
		schoolName: text,
		address: text,
		closestPoi: text,
		lister: text,
		phoneNumber: text,
		additionalContact: text,
		zoningInfo: text,
		landInfo: text,
		structureInfo: text,
		completionInfo: text,
		facilityInfo: text,
		buildingArea: integer,
		floorArea: integer,
		floorNum: integer,
		recruitment: text,
		conditions: text,
		remarks: text,
	})
	.superRefine((value, context) => {
		for (const field of [
			"prefecture",
			"city",
			"schoolName",
			"address",
			"lister",
		] as const) {
			if (!value[field]) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					path: [field],
					message: `${field} is required`,
				});
			}
		}
	});

export function queryString(value: unknown) {
	if (Array.isArray(value)) return String(value[0] ?? "");
	return typeof value === "string" ? value : "";
}

export function queryInteger(value: unknown, fallback?: number) {
	const parsed = Number.parseInt(queryString(value), 10);
	return Number.isFinite(parsed) ? parsed : fallback;
}
