-- AlterTable
ALTER TABLE "historial_visitas" ADD COLUMN     "horarioId" INTEGER;

-- AddForeignKey
ALTER TABLE "historial_visitas" ADD CONSTRAINT "historial_visitas_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "actividad_horarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
