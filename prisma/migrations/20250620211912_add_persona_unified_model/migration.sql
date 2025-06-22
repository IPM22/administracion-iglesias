-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('NINO', 'ADOLESCENTE', 'JOVEN', 'ADULTO', 'ADULTO_MAYOR', 'ENVEJECIENTE');

-- CreateEnum
CREATE TYPE "RolPersona" AS ENUM ('MIEMBRO', 'VISITA', 'INVITADO');

-- CreateEnum
CREATE TYPE "EstadoPersona" AS ENUM ('ACTIVA', 'INACTIVA', 'RECURRENTE', 'NUEVA');

-- AlterTable
ALTER TABLE "historial_visitas" ADD COLUMN     "personaId" INTEGER;

-- CreateTable
CREATE TABLE "personas" (
    "id" SERIAL NOT NULL,
    "iglesiaId" INTEGER NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "correo" TEXT,
    "telefono" TEXT,
    "celular" TEXT,
    "direccion" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "sexo" TEXT,
    "estadoCivil" TEXT,
    "ocupacion" TEXT,
    "foto" TEXT,
    "notas" TEXT,
    "tipo" "TipoPersona" NOT NULL DEFAULT 'NINO',
    "rol" "RolPersona" NOT NULL DEFAULT 'VISITA',
    "estado" "EstadoPersona" NOT NULL DEFAULT 'ACTIVA',
    "fechaIngreso" TIMESTAMP(3),
    "fechaBautismo" TIMESTAMP(3),
    "fechaConfirmacion" TIMESTAMP(3),
    "fechaPrimeraVisita" TIMESTAMP(3),
    "comoConocioIglesia" TEXT,
    "motivoVisita" TEXT,
    "intereses" TEXT,
    "familiaId" INTEGER,
    "relacionFamiliar" TEXT,
    "personaInvitaId" INTEGER,
    "personaConvertidaId" INTEGER,
    "fechaConversion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persona_ministerios" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "ministerioId" INTEGER NOT NULL,
    "cargo" TEXT,
    "rol" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "esLider" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persona_ministerios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personas_personaConvertidaId_key" ON "personas"("personaConvertidaId");

-- CreateIndex
CREATE UNIQUE INDEX "persona_ministerios_personaId_ministerioId_key" ON "persona_ministerios"("personaId", "ministerioId");

-- AddForeignKey
ALTER TABLE "historial_visitas" ADD CONSTRAINT "historial_visitas_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_personaInvitaId_fkey" FOREIGN KEY ("personaInvitaId") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_personaConvertidaId_fkey" FOREIGN KEY ("personaConvertidaId") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_ministerios" ADD CONSTRAINT "persona_ministerios_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_ministerios" ADD CONSTRAINT "persona_ministerios_ministerioId_fkey" FOREIGN KEY ("ministerioId") REFERENCES "ministerios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
