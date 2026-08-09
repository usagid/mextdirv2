export interface SchoolImage {
	id: string;
	schoolId: string;
	url: string;
	altText: string | null;
	sortOrder: number;
	createdAt: string;
}

export interface School {
	id: string;
	prefecture: string;
	city: string;
	schoolName: string;
	address: string;
	closestPoi: string;
	lister: string;
	phoneNumber: string;
	additionalContact: string;
	zoningInfo: string;
	landInfo: string;
	structureInfo: string;
	completionInfo: string;
	facilityInfo: string;
	buildingArea: number;
	floorArea: number;
	floorNum: number;
	recruitment: string;
	conditions: string;
	remarks: string;
	images: SchoolImage[];
	createdAt: string;
	updatedAt: string;
}

export interface SchoolListResponse {
	items: School[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface SchoolFilters {
	prefecture?: string;
	city?: string;
	keyword?: string;
	facilityType?: string;
	floorAreaMin?: number;
	floorAreaMax?: number;
	buildingAreaMin?: number;
	buildingAreaMax?: number;
	floorNumMin?: number;
	floorNumMax?: number;
	structure?: string;
	sort?: string;
	page?: number;
}
