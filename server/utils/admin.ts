import { timingSafeEqual } from "node:crypto";
import { createError, getRequestHeader } from "h3";
import type { H3Event } from "h3";

function sameSecret(actual: string, expected: string) {
	const actualBuffer = Buffer.from(actual);
	const expectedBuffer = Buffer.from(expected);
	return (
		actualBuffer.length === expectedBuffer.length &&
		timingSafeEqual(actualBuffer, expectedBuffer)
	);
}

export function requireAdmin(event: H3Event) {
	const expected = process.env.ADMIN_API_KEY;

	if (!expected) {
		throw createError({
			statusCode: 503,
			statusMessage: "Admin API is not configured",
		});
	}

	const authorization = getRequestHeader(event, "authorization");
	const bearer = authorization?.startsWith("Bearer ")
		? authorization.slice(7)
		: undefined;
	const provided = getRequestHeader(event, "x-admin-key") || bearer;

	if (!provided || !sameSecret(provided, expected)) {
		throw createError({
			statusCode: 401,
			statusMessage: "Admin authorization required",
		});
	}
}
