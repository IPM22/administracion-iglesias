import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Diagnóstico de variables de entorno en arranque
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL no está configurada. Prisma no funcionará.");
}
if (!process.env.DIRECT_URL) {
  console.warn(
    "⚠️ DIRECT_URL no está configurada. Las migraciones pueden fallar."
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
