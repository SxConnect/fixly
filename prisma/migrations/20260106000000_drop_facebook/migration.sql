-- DropForeignKey
ALTER TABLE "FacebookAccount" DROP CONSTRAINT "FacebookAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "FacebookGroup" DROP CONSTRAINT "FacebookGroup_accountId_fkey";

-- DropTable
DROP TABLE "FacebookAccount";

-- DropTable
DROP TABLE "FacebookGroup";

