-- CreateTable
CREATE TABLE "actividad_horarios" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT,
    "horaFin" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actividad_horarios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "actividad_horarios" ADD CONSTRAINT "actividad_horarios_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
