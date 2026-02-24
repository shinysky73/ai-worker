/*
  Warnings:

  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_googleId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleId",
ADD COLUMN     "password" TEXT NOT NULL DEFAULT '';

-- Remove default after backfill
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ImageAnalysisHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "imageType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "insights" JSONB NOT NULL,
    "imagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageAnalysisHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageToExcelHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "imageCount" INTEGER NOT NULL,
    "extractedData" JSONB NOT NULL,
    "excelFilename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageToExcelHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jdSummary" TEXT NOT NULL,
    "jobCategory" TEXT NOT NULL,
    "questionsData" JSONB NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImageAnalysisHistory_userId_createdAt_idx" ON "ImageAnalysisHistory"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ImageToExcelHistory_userId_createdAt_idx" ON "ImageToExcelHistory"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "InterviewHistory_userId_createdAt_idx" ON "InterviewHistory"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ImageAnalysisHistory" ADD CONSTRAINT "ImageAnalysisHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageToExcelHistory" ADD CONSTRAINT "ImageToExcelHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewHistory" ADD CONSTRAINT "InterviewHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
