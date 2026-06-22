-- CreateEnum
CREATE TYPE "ModuleReleaseType" AS ENUM ('immediate', 'fixed_date', 'days_after_enrollment');

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "releaseAfterDays" INTEGER,
ADD COLUMN     "releaseDate" TIMESTAMP(3),
ADD COLUMN     "releaseType" "ModuleReleaseType" NOT NULL DEFAULT 'immediate';
