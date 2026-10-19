-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "salesMode" TEXT NOT NULL DEFAULT 'external';

-- AlterTable
ALTER TABLE "ScheduledPost" ADD COLUMN     "productId" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ALTER COLUMN "accountId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

