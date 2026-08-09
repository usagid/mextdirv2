import { getRequestHeader, getRequestIP } from "h3";
import type { H3Event } from "h3";
import type { School, SchoolListResponse } from "../../shared/types/school";
import { getAdminActor } from "./admin-auth";
import { prisma, isDemoMode } from "./db";

export async function shouldHideContactInformation(event: H3Event) {
	if (isDemoMode() || (await getAdminActor(event))) return false;

	const ipAddress = getRequestIP(event, {
		xForwardedFor: process.env.TRUST_PROXY === "true",
	});
	const userAgent = (getRequestHeader(event, "user-agent") || "").toLowerCase();
	const blocks = await prisma.accessBlock.findMany({
		where: { active: true },
		select: { ipAddress: true, userAgentContains: true },
	});

	return blocks.some((block) => {
		const ipMatches = !block.ipAddress || block.ipAddress === ipAddress;
		const userAgentMatches =
			!block.userAgentContains ||
			userAgent.includes(block.userAgentContains.toLowerCase());
		return ipMatches && userAgentMatches;
	});
}

export function maskSchoolContacts(school: School): School {
	return { ...school, phoneNumber: "", additionalContact: "" };
}

export function maskSchoolList(
	response: SchoolListResponse,
): SchoolListResponse {
	return { ...response, items: response.items.map(maskSchoolContacts) };
}
