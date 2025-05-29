-- CreateTable
CREATE TABLE "Miembro" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "celular" TEXT,
    "direccion" TEXT,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "genero" TEXT NOT NULL,
    "estadoCivil" TEXT NOT NULL,
    "ocupacion" TEXT,
    "familia" TEXT,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "fechaBautismo" TIMESTAMP(3),
    "estado" TEXT NOT NULL,
    "notasAdicionales" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Miembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ministerio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ministerio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinisterioMiembro" (
    "id" SERIAL NOT NULL,
    "miembroId" INTEGER NOT NULL,
    "ministerioId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "estado" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MinisterioMiembro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Miembro_email_key" ON "Miembro"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ministerio_nombre_key" ON "Ministerio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MinisterioMiembro_miembroId_ministerioId_key" ON "MinisterioMiembro"("miembroId", "ministerioId");

-- AddForeignKey
ALTER TABLE "MinisterioMiembro" ADD CONSTRAINT "MinisterioMiembro_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinisterioMiembro" ADD CONSTRAINT "MinisterioMiembro_ministerioId_fkey" FOREIGN KEY ("ministerioId") REFERENCES "Ministerio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
