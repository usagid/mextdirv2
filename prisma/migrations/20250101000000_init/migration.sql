-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "closestPoi" TEXT NOT NULL,
    "lister" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "additionalContact" TEXT NOT NULL,
    "zoningInfo" TEXT NOT NULL,
    "landInfo" TEXT NOT NULL,
    "structureInfo" TEXT NOT NULL,
    "completionInfo" TEXT NOT NULL,
    "facilityInfo" TEXT NOT NULL,
    "buildingArea" INTEGER NOT NULL,
    "floorArea" INTEGER NOT NULL,
    "floorNum" INTEGER NOT NULL,
    "recruitment" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "School_prefecture_idx" ON "School"("prefecture");

-- CreateIndex
CREATE INDEX "School_city_idx" ON "School"("city");

-- CreateIndex
CREATE INDEX "School_floorArea_idx" ON "School"("floorArea");

-- CreateIndex
CREATE INDEX "Image_schoolId_sortOrder_idx" ON "Image"("schoolId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
