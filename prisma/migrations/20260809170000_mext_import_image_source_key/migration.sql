ALTER TABLE "Image" ADD COLUMN "sourceKey" TEXT;

CREATE UNIQUE INDEX "Image_sourceKey_key" ON "Image"("sourceKey");
