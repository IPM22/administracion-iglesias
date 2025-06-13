-- AlterTable
ALTER TABLE "actividades" ADD COLUMN     "esRangoFechas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaFin" TIMESTAMP(3),
ADD COLUMN     "fechaInicio" TIMESTAMP(3);
