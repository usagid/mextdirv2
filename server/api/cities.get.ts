import { defineEventHandler, getQuery } from "h3";
import type { H3Event } from "h3";
import { citiesForPrefecture } from "../utils/cities";
import { queryString } from "../utils/school-validation";
import { withX402Payment } from "../utils/x402";

function handleCities(event: H3Event) {
	const prefecture = queryString(getQuery(event).prefecture);
	return prefecture ? citiesForPrefecture(prefecture) : [];
}

export default defineEventHandler((event) =>
	withX402Payment(event, () => handleCities(event)),
);
