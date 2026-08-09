import type {
	School,
	SchoolFilters,
	SchoolListResponse,
} from "../../shared/types/school";

const demoImage = (number: number, schoolId: string, altText: string) => ({
	id: `${schoolId}-image-${number}`,
	schoolId,
	url: `/uploads/school-${String(number).padStart(2, "0")}.svg`,
	altText,
	sortOrder: number,
	createdAt: "2025-01-01T00:00:00.000Z",
});

function makeSchool(
	input: Pick<
		School,
		| "id"
		| "prefecture"
		| "city"
		| "schoolName"
		| "address"
		| "closestPoi"
		| "lister"
		| "phoneNumber"
		| "additionalContact"
		| "zoningInfo"
		| "landInfo"
		| "structureInfo"
		| "completionInfo"
		| "facilityInfo"
		| "buildingArea"
		| "floorArea"
		| "floorNum"
		| "recruitment"
		| "conditions"
		| "remarks"
	> & { imageNumbers: number[]; createdAt: string },
): School {
	const { imageNumbers, ...school } = input;
	return {
		...school,
		images: imageNumbers.map((number, index) =>
			demoImage(number, input.id, `${input.schoolName}の画像 ${index + 1}`),
		),
		updatedAt: input.createdAt,
	};
}

export const demoSchools: School[] = [
	makeSchool({
		id: "demo-nagano-kamihara",
		prefecture: "長野県",
		city: "長野市",
		schoolName: "神原小学校",
		address: "長野県長野市神原 120-4",
		closestPoi: "長野駅から車で24分",
		lister: "長野市地域振興課",
		phoneNumber: "026-000-1001",
		additionalContact: "kamihara@example.jp",
		zoningInfo: "都市計画区域外",
		landInfo: "敷地 約8,420㎡ / 校庭含む",
		structureInfo: "鉄筋コンクリート造",
		completionInfo: "1974年竣工",
		facilityInfo: "小学校 / 体育館 / プール",
		buildingArea: 1840,
		floorArea: 3920,
		floorNum: 3,
		recruitment: "地域の拠点として活用する新しい所有者を募集しています。",
		conditions: "用途・改修計画について要相談。現況有姿での引き渡し。",
		remarks: "冬季の積雪があります。現地確認をおすすめします。",
		imageNumbers: [1, 2],
		createdAt: "2025-02-14T09:00:00.000Z",
	}),
	makeSchool({
		id: "demo-iwate-morioka",
		prefecture: "岩手県",
		city: "盛岡市",
		schoolName: "乙部中学校",
		address: "岩手県盛岡市乙部 33-2",
		closestPoi: "乙部バス停から徒歩8分",
		lister: "盛岡市公共施設活用室",
		phoneNumber: "019-000-2202",
		additionalContact: "otobe@example.jp",
		zoningInfo: "第一種住居地域",
		landInfo: "敷地 約12,100㎡ / 山林隣接",
		structureInfo: "鉄筋コンクリート造・木造",
		completionInfo: "1981年竣工",
		facilityInfo: "中学校 / 体育館 / 部室",
		buildingArea: 2250,
		floorArea: 4780,
		floorNum: 3,
		recruitment: "教育・福祉・ものづくりに関わる提案を募集。",
		conditions: "賃貸・譲渡ともに相談可能。",
		remarks: "体育館は別棟です。",
		imageNumbers: [3, 4],
		createdAt: "2025-02-03T09:00:00.000Z",
	}),
	makeSchool({
		id: "demo-kochi-usa",
		prefecture: "高知県",
		city: "土佐市",
		schoolName: "宇佐分校",
		address: "高知県土佐市宇佐町 55-1",
		closestPoi: "宇佐港から徒歩6分",
		lister: "土佐市まちづくり推進課",
		phoneNumber: "088-000-3303",
		additionalContact: "usa-school@example.jp",
		zoningInfo: "都市計画区域外",
		landInfo: "敷地 約5,800㎡ / 海まで300m",
		structureInfo: "木造",
		completionInfo: "1968年竣工 / 2002年改修",
		facilityInfo: "分校 / 講堂 / 倉庫",
		buildingArea: 980,
		floorArea: 1560,
		floorNum: 2,
		recruitment: "海辺の暮らしと学びをつなぐ活用者を募集。",
		conditions: "短期利用から長期利用まで要相談。",
		remarks: "潮風による塩害があります。",
		imageNumbers: [5, 6],
		createdAt: "2025-01-24T09:00:00.000Z",
	}),
	makeSchool({
		id: "demo-akita-yuzawa",
		prefecture: "秋田県",
		city: "湯沢市",
		schoolName: "皆瀬第一小学校",
		address: "秋田県湯沢市皆瀬字川向 18",
		closestPoi: "皆瀬庁舎から徒歩12分",
		lister: "湯沢市管財課",
		phoneNumber: "0183-000-4404",
		additionalContact: "minase@example.jp",
		zoningInfo: "都市計画区域外",
		landInfo: "敷地 約15,400㎡ / 森林隣接",
		structureInfo: "鉄筋コンクリート造",
		completionInfo: "1979年竣工",
		facilityInfo: "小学校 / 体育館 / 給食室",
		buildingArea: 2050,
		floorArea: 4120,
		floorNum: 3,
		recruitment: "移住・滞在・創作の拠点として活用する方を募集。",
		conditions: "冬季の除雪計画が必要です。",
		remarks: "校庭に桜の木があります。",
		imageNumbers: [7, 8],
		createdAt: "2025-01-15T09:00:00.000Z",
	}),
	makeSchool({
		id: "demo-shimane-oda",
		prefecture: "島根県",
		city: "大田市",
		schoolName: "温泉津小学校旧校舎",
		address: "島根県大田市温泉津町 7-11",
		closestPoi: "温泉津駅から徒歩15分",
		lister: "大田市地域政策課",
		phoneNumber: "0854-000-5505",
		additionalContact: "yunotsu@example.jp",
		zoningInfo: "商業地域",
		landInfo: "敷地 約3,600㎡ / 温泉街内",
		structureInfo: "木造",
		completionInfo: "1936年竣工 / 1988年改修",
		facilityInfo: "校舎 / 講堂 / 中庭",
		buildingArea: 720,
		floorArea: 1280,
		floorNum: 2,
		recruitment: "宿泊・飲食・文化施設などの提案を募集。",
		conditions: "景観条例への適合が必要です。",
		remarks: "歴史的な外観を活かした活用を希望。",
		imageNumbers: [1, 3],
		createdAt: "2024-12-18T09:00:00.000Z",
	}),
	makeSchool({
		id: "demo-yamaguchi-hagi",
		prefecture: "山口県",
		city: "萩市",
		schoolName: "見島小中学校",
		address: "山口県萩市見島 204",
		closestPoi: "見島港から徒歩10分",
		lister: "萩市離島振興室",
		phoneNumber: "0838-000-6606",
		additionalContact: "mishima@example.jp",
		zoningInfo: "都市計画区域外",
		landInfo: "敷地 約9,100㎡ / 島内道路沿い",
		structureInfo: "鉄筋コンクリート造",
		completionInfo: "1970年竣工 / 1995年増築",
		facilityInfo: "小中学校 / 体育館 / 寮",
		buildingArea: 1640,
		floorArea: 3310,
		floorNum: 2,
		recruitment: "島の暮らしを支える事業者・団体を募集。",
		conditions: "物資輸送・通勤方法を含めて要相談。",
		remarks: "港から校舎まで坂道があります。",
		imageNumbers: [2, 5],
		createdAt: "2024-11-30T09:00:00.000Z",
	}),
	makeSchool({
		id: "demo-hokkaido-biei",
		prefecture: "北海道",
		city: "美瑛町",
		schoolName: "白金分校",
		address: "北海道上川郡美瑛町白金 91",
		closestPoi: "白金温泉から車で5分",
		lister: "美瑛町総務課",
		phoneNumber: "0166-000-7707",
		additionalContact: "shirogane@example.jp",
		zoningInfo: "都市計画区域外",
		landInfo: "敷地 約21,500㎡ / 森林内",
		structureInfo: "木造",
		completionInfo: "1958年竣工 / 1990年改修",
		facilityInfo: "分校 / 体育館 / 教員住宅",
		buildingArea: 860,
		floorArea: 1430,
		floorNum: 2,
		recruitment: "滞在制作・自然体験の拠点を運営する方を募集。",
		conditions: "積雪・暖房設備の維持管理が条件です。",
		remarks: "冬季は周辺道路が通行止めになる場合があります。",
		imageNumbers: [4, 7],
		createdAt: "2024-11-04T09:00:00.000Z",
	}),
	makeSchool({
		id: "demo-kumamoto-aso",
		prefecture: "熊本県",
		city: "阿蘇市",
		schoolName: "坂梨小学校",
		address: "熊本県阿蘇市一の宮町坂梨 402",
		closestPoi: "宮地駅から車で10分",
		lister: "阿蘇市教育委員会",
		phoneNumber: "0967-000-8808",
		additionalContact: "sakanashi@example.jp",
		zoningInfo: "都市計画区域外",
		landInfo: "敷地 約10,700㎡ / 田園地帯",
		structureInfo: "鉄筋コンクリート造",
		completionInfo: "1976年竣工",
		facilityInfo: "小学校 / 体育館 / プール",
		buildingArea: 1760,
		floorArea: 3640,
		floorNum: 3,
		recruitment: "食・農・観光をテーマにした活用を募集。",
		conditions: "地域住民との協議を経て用途を決定します。",
		remarks: "阿蘇山を望む校舎です。",
		imageNumbers: [6, 8],
		createdAt: "2024-10-22T09:00:00.000Z",
	}),
];

function contains(value: string, query: string) {
	return value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

const facilityMatchers: Record<string, string[]> = {
	"school-building": ["校舎", "園舎"],
	gym: ["体育館", "屋内運動場", "屋体"],
	pool: ["プール"],
	field: ["グラウンド", "グランド", "校庭", "運動場"],
	residence: ["寮", "教員住宅", "宿舎"],
};
const structureMatchers: Record<string, string[]> = {
	wood: ["木造"],
	concrete: ["鉄筋コンクリート", "RC"],
	steel: ["鉄骨", "S造"],
};

function matchesCategory(
	value: string,
	query: string,
	matchers: Record<string, string[]>,
) {
	return (matchers[query] || [query]).some((matcher) =>
		contains(value, matcher),
	);
}

export function listDemoSchools(
	filters: SchoolFilters = {},
): SchoolListResponse {
	let results = demoSchools.filter((school) => {
		if (filters.prefecture && school.prefecture !== filters.prefecture)
			return false;
		if (filters.city && !contains(school.city, filters.city)) return false;
		if (
			filters.facilityType &&
			!matchesCategory(
				school.facilityInfo,
				filters.facilityType,
				facilityMatchers,
			)
		)
			return false;
		if (
			filters.structure &&
			!matchesCategory(
				school.structureInfo,
				filters.structure,
				structureMatchers,
			)
		)
			return false;
		if (
			filters.floorAreaMin !== undefined &&
			school.floorArea < filters.floorAreaMin
		)
			return false;
		if (
			filters.floorAreaMax !== undefined &&
			school.floorArea > filters.floorAreaMax
		)
			return false;
		if (
			filters.buildingAreaMin !== undefined &&
			school.buildingArea < filters.buildingAreaMin
		)
			return false;
		if (
			filters.buildingAreaMax !== undefined &&
			school.buildingArea > filters.buildingAreaMax
		)
			return false;
		if (
			filters.floorNumMin !== undefined &&
			school.floorNum < filters.floorNumMin
		)
			return false;
		if (
			filters.floorNumMax !== undefined &&
			school.floorNum > filters.floorNumMax
		)
			return false;
		if (filters.keyword) {
			const haystack = [
				school.schoolName,
				school.city,
				school.address,
				school.closestPoi,
				school.facilityInfo,
				school.structureInfo,
				school.lister,
				school.recruitment,
				school.conditions,
			].join(" ");
			if (!contains(haystack, filters.keyword)) return false;
		}
		return true;
	});

	results = [...results].sort((a, b) => {
		if (filters.sort === "oldest")
			return a.createdAt.localeCompare(b.createdAt);
		if (filters.sort === "floor-asc") return a.floorArea - b.floorArea;
		if (filters.sort === "floor-desc") return b.floorArea - a.floorArea;
		return b.createdAt.localeCompare(a.createdAt);
	});

	const pageSize = 10;
	const page = Math.max(1, filters.page || 1);
	const total = results.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const safePage = Math.min(page, totalPages);

	return {
		items: results.slice((safePage - 1) * pageSize, safePage * pageSize),
		total,
		page: safePage,
		pageSize,
		totalPages,
	};
}

export function findDemoSchool(id: string) {
	return demoSchools.find((school) => school.id === id);
}
