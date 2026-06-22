-- CreateTable
CREATE TABLE "CourseTrack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "status" "CourseStatus" NOT NULL DEFAULT 'draft',
    "isBundle" BOOLEAN NOT NULL DEFAULT false,
    "bundlePriceOneTime" DECIMAL(65,30),
    "stripePriceIdBundle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTrackItem" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "CourseTrackItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseTrack_slug_key" ON "CourseTrack"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTrackItem_trackId_courseId_key" ON "CourseTrackItem"("trackId", "courseId");

-- AddForeignKey
ALTER TABLE "CourseTrackItem" ADD CONSTRAINT "CourseTrackItem_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "CourseTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTrackItem" ADD CONSTRAINT "CourseTrackItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
