/*
  Warnings:

  - You are about to drop the column `miembroId` on the `familiares` table. All the data in the column will be lost.
  - You are about to drop the column `miembroRelacionadoId` on the `familiares` table. All the data in the column will be lost.
  - You are about to drop the column `miembroId` on the `historial_visitas` table. All the data in the column will be lost.
  - You are about to drop the column `visitaId` on the `historial_visitas` table. All the data in the column will be lost.
  - You are about to drop the column `miembroVinculoId` on the `vinculos_familiares` table. All the data in the column will be lost.
  - You are about to drop the `miembro_ministerios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `miembros` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `visitas` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `personaId` to the `familiares` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "familiares" DROP CONSTRAINT "familiares_miembroId_fkey";

-- DropForeignKey
ALTER TABLE "historial_visitas" DROP CONSTRAINT "historial_visitas_miembroId_fkey";

-- DropForeignKey
ALTER TABLE "historial_visitas" DROP CONSTRAINT "historial_visitas_visitaId_fkey";

-- DropForeignKey
ALTER TABLE "miembro_ministerios" DROP CONSTRAINT "miembro_ministerios_miembroId_fkey";

-- DropForeignKey
ALTER TABLE "miembro_ministerios" DROP CONSTRAINT "miembro_ministerios_ministerioId_fkey";

-- DropForeignKey
ALTER TABLE "miembros" DROP CONSTRAINT "miembros_familiaId_fkey";

-- DropForeignKey
ALTER TABLE "miembros" DROP CONSTRAINT "miembros_iglesiaId_fkey";

-- DropForeignKey
ALTER TABLE "visitas" DROP CONSTRAINT "visitas_familiaId_fkey";

-- DropForeignKey
ALTER TABLE "visitas" DROP CONSTRAINT "visitas_iglesiaId_fkey";

-- DropForeignKey
ALTER TABLE "visitas" DROP CONSTRAINT "visitas_miembroConvertidoId_fkey";

-- DropForeignKey
ALTER TABLE "visitas" DROP CONSTRAINT "visitas_miembroInvitaId_fkey";

-- AlterTable
ALTER TABLE "familiares" DROP COLUMN "miembroId",
DROP COLUMN "miembroRelacionadoId",
ADD COLUMN     "personaId" INTEGER NOT NULL,
ADD COLUMN     "personaRelacionadaId" INTEGER;

-- AlterTable
ALTER TABLE "historial_visitas" DROP COLUMN "miembroId",
DROP COLUMN "visitaId";

-- AlterTable
ALTER TABLE "vinculos_familiares" DROP COLUMN "miembroVinculoId",
ADD COLUMN     "personaVinculoId" INTEGER;

-- DropTable
DROP TABLE "miembro_ministerios";

-- DropTable
DROP TABLE "miembros";

-- DropTable
DROP TABLE "visitas";

-- AddForeignKey
ALTER TABLE "familiares" ADD CONSTRAINT "familiares_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
