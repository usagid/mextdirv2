ALTER TABLE "School" ADD COLUMN "sourceKey" TEXT;

CREATE UNIQUE INDEX "School_sourceKey_key" ON "School"("sourceKey");
