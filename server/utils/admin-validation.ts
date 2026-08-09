import { isIP } from "node:net";
import { z } from "zod";

const username = z
	.string()
	.trim()
	.min(3)
	.max(64)
	.regex(
		/^[A-Za-z0-9_.@-]+$/,
		"Use letters, numbers, dot, underscore, @, or hyphen",
	);
const password = z.string().min(12).max(200);
const optionalText = (max: number) => z.string().trim().max(max).default("");

export const loginSchema = z.object({ username, password });
export const setupSchema = loginSchema;

export const userCreateSchema = z.object({
	username,
	password,
	role: z.enum(["ADMIN", "EDITOR"]).default("EDITOR"),
});

export const userPatchSchema = z
	.object({
		active: z.boolean().optional(),
		role: z.enum(["ADMIN", "EDITOR"]).optional(),
	})
	.refine((value) => value.active !== undefined || value.role !== undefined, {
		message: "Provide a role or active value",
	});

export const apiKeySchema = z.object({
	name: z.string().trim().min(1).max(100),
	expiresAt: z.string().trim().max(40).default(""),
});

export const blockSchema = z
	.object({
		ipAddress: optionalText(128),
		userAgentContains: optionalText(200),
		reason: optionalText(200),
	})
	.superRefine((value, context) => {
		if (!value.ipAddress && !value.userAgentContains) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["ipAddress"],
				message: "Provide an IP address or user-agent text",
			});
		}
		if (value.ipAddress && isIP(value.ipAddress) === 0) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["ipAddress"],
				message: "Enter a valid IPv4 or IPv6 address",
			});
		}
	});
