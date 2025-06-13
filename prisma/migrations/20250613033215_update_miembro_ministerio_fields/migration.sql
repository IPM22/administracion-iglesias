/*
  Warnings:

  - You are about to drop the column `activo` on the `miembro_ministerios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "miembro_ministerios" DROP COLUMN "activo",
ADD COLUMN     "esLider" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'Activo',
ADD COLUMN     "rol" TEXT;
