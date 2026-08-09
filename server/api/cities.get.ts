import { defineEventHandler, getQuery } from "h3";
import { citiesForPrefecture } from "../utils/cities";
import { queryString } from "../utils/school-validation";

export default defineEventHandler((event) => {
	const prefecture = queryString(getQuery(event).prefecture);
	return prefecture ? citiesForPrefecture(prefecture) : [];
});
