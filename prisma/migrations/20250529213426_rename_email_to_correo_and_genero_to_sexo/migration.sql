/*
  Warnings:

  - You are about to drop the column `email` on the `Miembro` table. All the data in the column will be lost.
  - You are about to drop the column `genero` on the `Miembro` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[correo]` on the table `Miembro` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `correo` to the `Miembro` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sexo` to the `Miembro` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Miembro_email_key";

-- AlterTable
ALTER TABLE "Miembro" DROP COLUMN "email",
DROP COLUMN "genero",
ADD COLUMN     "correo" TEXT NOT NULL,
ADD COLUMN     "sexo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Miembro_correo_key" ON "Miembro"("correo");
