import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import {
	createError,
	deleteCookie,
	getCookie,
	getRequestHeader,
	getRequestIP,
	getRequestProtocol,
	setCookie,
} from "h3";
import type { H3Event } from "h3";
import { prisma } from "./db";

const passwordCost = {
	N: 32_768,
	r: 8,
	p: 1,
	maxmem: 64 * 1024 * 1024,
} as const;
const passwordKeyLength = 64;

function derivePasswordKey(password: string, salt: string) {
	return new Promise<Buffer>((resolve, reject) => {
		scrypt(password, salt, passwordKeyLength, passwordCost, (error, key) => {
			if (error) reject(error);
			else resolve(key);
		});
	});
}
const sessionCookie = "mextdir_admin_session";
const sessionLifetimeSeconds = 7 * 24 * 60 * 60;

function secureSessionCookie(event: H3Event) {
	if (process.env.ADMIN_COOKIE_SECURE === "true") return true;
	if (process.env.ADMIN_COOKIE_SECURE === "false") return false;
	return (
		process.env.NODE_ENV === "production" &&
		getRequestProtocol(event, {
			xForwardedProto: process.env.TRUST_PROXY === "true",
		}) === "https"
	);
}

const loginFailures = new Map<string, { count: number; resetAt: number }>();

type AdminRole = "ADMIN" | "EDITOR";

export type AdminActor = {
	id: string;
	username: string;
	role: AdminRole;
};

export type PublicAdminUser = AdminActor & {
	active: boolean;
	createdAt: string;
};

function sameSecret(actual: string, expected: string) {
	const actualBuffer = Buffer.from(actual);
	const expectedBuffer = Buffer.from(expected);
	return (
		actualBuffer.length === expectedBuffer.length &&
		timingSafeEqual(actualBuffer, expectedBuffer)
	);
}

function tokenHash(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
	const salt = randomBytes(16).toString("hex");
	const derivedKey = await derivePasswordKey(password, salt);
	return `scrypt$${passwordCost.N}$${passwordCost.r}$${passwordCost.p}$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
	const [scheme, n, r, p, salt, expectedHex] = storedHash.split("$");
	if (
		scheme !== "scrypt" ||
		n !== String(passwordCost.N) ||
		r !== String(passwordCost.r) ||
		p !== String(passwordCost.p) ||
		!salt ||
		!/^[a-f0-9]{32}$/i.test(salt) ||
		!expectedHex ||
		!/^[a-f0-9]{128}$/i.test(expectedHex)
	) {
		return false;
	}

	const derivedKey = await derivePasswordKey(password, salt);
	const expected = Buffer.from(expectedHex, "hex");
	return (
		expected.length === derivedKey.length &&
		timingSafeEqual(expected, derivedKey)
	);
}

export function serializeAdminUser(user: {
	id: string;
	username: string;
	role: AdminRole;
	active: boolean;
	createdAt: Date;
}): PublicAdminUser {
	return {
		id: user.id,
		username: user.username,
		role: user.role,
		active: user.active,
		createdAt: user.createdAt.toISOString(),
	};
}

function actorFromUser(user: {
	id: string;
	username: string;
	role: AdminRole;
}) {
	return { id: user.id, username: user.username, role: user.role };
}

function authorizationToken(event: H3Event) {
	const authorization = getRequestHeader(event, "authorization");
	const bearer = authorization?.startsWith("Bearer ")
		? authorization.slice(7).trim()
		: undefined;
	return (
		getRequestHeader(event, "x-api-key") ||
		getRequestHeader(event, "x-admin-key") ||
		bearer
	);
}

export async function getAdminActor(
	event: H3Event,
): Promise<AdminActor | null> {
	const sessionToken = getCookie(event, sessionCookie);
	if (sessionToken) {
		const session = await prisma.adminSession.findUnique({
			where: { tokenHash: tokenHash(sessionToken) },
			include: { user: true },
		});
		if (session && session.expiresAt > new Date() && session.user.active) {
			return actorFromUser(session.user);
		}
	}

	const provided = authorizationToken(event);
	if (!provided) return null;

	const legacyKey = process.env.ADMIN_API_KEY;
	if (legacyKey && sameSecret(provided, legacyKey)) {
		return { id: "legacy-env-key", username: "environment-key", role: "ADMIN" };
	}

	const apiKey = await prisma.apiKey.findUnique({
		where: { keyHash: tokenHash(provided) },
		include: { createdBy: true },
	});
	if (
		!apiKey ||
		apiKey.revokedAt ||
		(apiKey.expiresAt && apiKey.expiresAt <= new Date()) ||
		!apiKey.createdBy.active
	) {
		return null;
	}

	await prisma.apiKey.update({
		where: { id: apiKey.id },
		data: { lastUsedAt: new Date() },
	});
	return actorFromUser(apiKey.createdBy);
}

export async function requireAdminActor(
	event: H3Event,
	requiredRole?: AdminRole,
) {
	const actor = await getAdminActor(event);
	if (!actor) {
		throw createError({
			statusCode: 401,
			statusMessage: "Admin authorization required",
		});
	}
	if (requiredRole && actor.role !== requiredRole) {
		throw createError({
			statusCode: 403,
			statusMessage: "Administrator permission required",
		});
	}
	return actor;
}

export function assertLoginAllowed(event: H3Event) {
	const key = getRequestIP(event) || "unknown";
	const current = loginFailures.get(key);
	if (current && current.resetAt > Date.now() && current.count >= 10) {
		throw createError({
			statusCode: 429,
			statusMessage: "Too many login attempts. Try again later.",
		});
	}
	if (current && current.resetAt <= Date.now()) loginFailures.delete(key);
	return key;
}

export function noteLoginFailure(key: string) {
	const current = loginFailures.get(key);
	if (!current || current.resetAt <= Date.now()) {
		loginFailures.set(key, { count: 1, resetAt: Date.now() + 15 * 60 * 1000 });
		return;
	}
	current.count += 1;
}

export function clearLoginFailures(key: string) {
	loginFailures.delete(key);
}

export async function createAdminSession(event: H3Event, userId: string) {
	const rawToken = randomBytes(32).toString("base64url");
	await prisma.adminSession.create({
		data: {
			userId,
			tokenHash: tokenHash(rawToken),
			expiresAt: new Date(Date.now() + sessionLifetimeSeconds * 1000),
		},
	});
	setCookie(event, sessionCookie, rawToken, {
		httpOnly: true,
		sameSite: "lax",
		secure: secureSessionCookie(event),
		path: "/",
		maxAge: sessionLifetimeSeconds,
	});
}

export async function clearAdminSession(event: H3Event) {
	const rawToken = getCookie(event, sessionCookie);
	if (rawToken) {
		await prisma.adminSession.deleteMany({
			where: { tokenHash: tokenHash(rawToken) },
		});
	}
	deleteCookie(event, sessionCookie, { path: "/" });
}

export function createApiKeyValue() {
	const value = `mext_${randomBytes(32).toString("base64url")}`;
	return {
		value,
		prefix: value.slice(0, 12),
		keyHash: tokenHash(value),
	};
}
