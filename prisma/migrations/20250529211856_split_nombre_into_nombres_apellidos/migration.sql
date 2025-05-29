/*
  Warnings:

  - You are about to drop the column `nombre` on the `Miembro` table. All the data in the column will be lost.
  - Added the required column `apellidos` to the `Miembro` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombres` to the `Miembro` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Miembro" DROP COLUMN "nombre",
ADD COLUMN     "apellidos" TEXT NOT NULL,
ADD COLUMN     "nombres" TEXT NOT NULL;
