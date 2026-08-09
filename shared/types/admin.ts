export type AdminRole = "ADMIN" | "EDITOR";

export interface AdminUser {
	id: string;
	username: string;
	role: AdminRole;
	active: boolean;
	createdAt: string;
}

export interface AdminSessionResponse {
	user: AdminUser;
}

export interface AdminApiKey {
	id: string;
	name: string;
	prefix: string;
	lastUsedAt: string | null;
	expiresAt: string | null;
	revokedAt: string | null;
	createdAt: string;
}

export interface AdminBlock {
	id: string;
	ipAddress: string | null;
	userAgentContains: string | null;
	reason: string | null;
	active: boolean;
	createdById: string | null;
	createdBy: { username: string } | null;
	createdAt: string;
	updatedAt: string;
}
