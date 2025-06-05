/*
  Warnings:

  - You are about to drop the `Miembro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ministerio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MinisterioMiembro` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'PASTOR', 'LIDER', 'SECRETARIO', 'MIEMBRO');

-- CreateEnum
CREATE TYPE "EstadoUsuarioIglesia" AS ENUM ('ACTIVO', 'PENDIENTE', 'RECHAZADO', 'SUSPENDIDO');

-- DropForeignKey
ALTER TABLE "MinisterioMiembro" DROP CONSTRAINT "MinisterioMiembro_miembroId_fkey";

-- DropForeignKey
ALTER TABLE "MinisterioMiembro" DROP CONSTRAINT "MinisterioMiembro_ministerioId_fkey";

-- DropTable
DROP TABLE "Miembro";

-- DropTable
DROP TABLE "Ministerio";

-- DropTable
DROP TABLE "MinisterioMiembro";

-- CreateTable
CREATE TABLE "iglesias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "sitioWeb" TEXT,
    "logoUrl" TEXT,
    "configuracion" JSONB,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iglesias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "avatar" TEXT,
    "telefono" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "primerLogin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ultimoLogin" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_iglesias" (
    "id" SERIAL NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "iglesiaId" INTEGER NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'MIEMBRO',
    "estado" "EstadoUsuarioIglesia" NOT NULL DEFAULT 'PENDIENTE',
    "permisos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_iglesias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "miembros" (
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
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaBautismo" TIMESTAMP(3),
    "fechaConfirmacion" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "familiaId" INTEGER,
    "relacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "miembros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "familias" (
    "id" SERIAL NOT NULL,
    "iglesiaId" INTEGER NOT NULL,
    "apellido" TEXT NOT NULL,
    "nombre" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "familias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas" (
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
    "fechaPrimeraVisita" TIMESTAMP(3),
    "comoConocioIglesia" TEXT,
    "motivoVisita" TEXT,
    "intereses" TEXT,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activa',
    "familia" TEXT,
    "familiaId" INTEGER,
    "miembroInvitaId" INTEGER,
    "miembroConvertidoId" INTEGER,
    "fechaConversion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ministerios" (
    "id" SERIAL NOT NULL,
    "iglesiaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "liderPrincipalId" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "colorHex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ministerios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" SERIAL NOT NULL,
    "iglesiaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT,
    "horaFin" TEXT,
    "ubicacion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Programada',
    "tipoActividadId" INTEGER NOT NULL,
    "ministerioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_actividad" (
    "id" SERIAL NOT NULL,
    "iglesiaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'Regular',
    "colorHex" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "miembro_ministerios" (
    "id" SERIAL NOT NULL,
    "miembroId" INTEGER NOT NULL,
    "ministerioId" INTEGER NOT NULL,
    "cargo" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "miembro_ministerios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_visitas" (
    "id" SERIAL NOT NULL,
    "miembroId" INTEGER,
    "visitaId" INTEGER,
    "actividadId" INTEGER,
    "tipoActividadId" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historial_visitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "familiares" (
    "id" SERIAL NOT NULL,
    "miembroId" INTEGER NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "relacion" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "telefono" TEXT,
    "esMiembro" BOOLEAN NOT NULL DEFAULT false,
    "miembroRelacionadoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "familiares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vinculos_familiares" (
    "id" SERIAL NOT NULL,
    "familiaOrigenId" INTEGER NOT NULL,
    "familiaRelacionadaId" INTEGER NOT NULL,
    "tipoVinculo" TEXT NOT NULL,
    "descripcion" TEXT,
    "miembroVinculoId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vinculos_familiares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_iglesias_usuarioId_iglesiaId_key" ON "usuario_iglesias"("usuarioId", "iglesiaId");

-- CreateIndex
CREATE UNIQUE INDEX "visitas_miembroConvertidoId_key" ON "visitas"("miembroConvertidoId");

-- CreateIndex
CREATE UNIQUE INDEX "miembro_ministerios_miembroId_ministerioId_key" ON "miembro_ministerios"("miembroId", "ministerioId");

-- CreateIndex
CREATE UNIQUE INDEX "vinculos_familiares_familiaOrigenId_familiaRelacionadaId_key" ON "vinculos_familiares"("familiaOrigenId", "familiaRelacionadaId");

-- AddForeignKey
ALTER TABLE "usuario_iglesias" ADD CONSTRAINT "usuario_iglesias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_iglesias" ADD CONSTRAINT "usuario_iglesias_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros" ADD CONSTRAINT "miembros_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros" ADD CONSTRAINT "miembros_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "familias" ADD CONSTRAINT "familias_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_miembroInvitaId_fkey" FOREIGN KEY ("miembroInvitaId") REFERENCES "miembros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_miembroConvertidoId_fkey" FOREIGN KEY ("miembroConvertidoId") REFERENCES "miembros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ministerios" ADD CONSTRAINT "ministerios_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_tipoActividadId_fkey" FOREIGN KEY ("tipoActividadId") REFERENCES "tipos_actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_ministerioId_fkey" FOREIGN KEY ("ministerioId") REFERENCES "ministerios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_actividad" ADD CONSTRAINT "tipos_actividad_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembro_ministerios" ADD CONSTRAINT "miembro_ministerios_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "miembros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembro_ministerios" ADD CONSTRAINT "miembro_ministerios_ministerioId_fkey" FOREIGN KEY ("ministerioId") REFERENCES "ministerios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_visitas" ADD CONSTRAINT "historial_visitas_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "miembros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_visitas" ADD CONSTRAINT "historial_visitas_visitaId_fkey" FOREIGN KEY ("visitaId") REFERENCES "visitas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_visitas" ADD CONSTRAINT "historial_visitas_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_visitas" ADD CONSTRAINT "historial_visitas_tipoActividadId_fkey" FOREIGN KEY ("tipoActividadId") REFERENCES "tipos_actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "familiares" ADD CONSTRAINT "familiares_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "miembros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculos_familiares" ADD CONSTRAINT "vinculos_familiares_familiaOrigenId_fkey" FOREIGN KEY ("familiaOrigenId") REFERENCES "familias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculos_familiares" ADD CONSTRAINT "vinculos_familiares_familiaRelacionadaId_fkey" FOREIGN KEY ("familiaRelacionadaId") REFERENCES "familias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
