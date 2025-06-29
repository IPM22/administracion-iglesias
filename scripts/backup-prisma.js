#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, "..", "backups");

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Función para generar nombre de archivo con timestamp
function generateBackupFilename(prefix = "prisma") {
  const now = new Date();
  const timestamp =
    now.toISOString().replace(/[:.]/g, "-").split("T")[0] +
    "_" +
    now.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `${prefix}_backup_${timestamp}.json`;
}

// Función para hacer backup de todas las tablas
async function createBackup() {
  console.log("🔄 Iniciando backup con Prisma...");

  try {
    const backupData = {};

    // Backup de Iglesias
    console.log("📋 Haciendo backup de iglesias...");
    backupData.iglesias = await prisma.iglesia.findMany();

    // Backup de Usuarios
    console.log("📋 Haciendo backup de usuarios...");
    backupData.usuarios = await prisma.usuario.findMany();

    // Backup de UsuarioIglesias
    console.log("📋 Haciendo backup de usuario_iglesias...");
    backupData.usuarioIglesias = await prisma.usuarioIglesia.findMany();

    // Backup de Personas
    console.log("📋 Haciendo backup de personas...");
    backupData.personas = await prisma.persona.findMany();

    // Backup de Familias
    console.log("📋 Haciendo backup de familias...");
    backupData.familias = await prisma.familia.findMany();

    // Backup de Ministerios
    console.log("📋 Haciendo backup de ministerios...");
    backupData.ministerios = await prisma.ministerio.findMany();

    // Backup de Actividades
    console.log("📋 Haciendo backup de actividades...");
    backupData.actividades = await prisma.actividad.findMany();

    // Backup de Tipos de Actividad
    console.log("📋 Haciendo backup de tipos de actividad...");
    backupData.tiposActividad = await prisma.tipoActividad.findMany();

    // Backup de PersonaMinisterios
    console.log("📋 Haciendo backup de persona_ministerios...");
    backupData.personaMinisterios = await prisma.personaMinisterio.findMany();

    // Backup de Historial de Visitas
    console.log("📋 Haciendo backup de historial de visitas...");
    backupData.historialVisitas = await prisma.historialVisita.findMany();

    // Backup de Familiares
    console.log("📋 Haciendo backup de familiares...");
    backupData.familiares = await prisma.familiar.findMany();

    // Backup de Vínculos Familiares
    console.log("📋 Haciendo backup de vínculos familiares...");
    backupData.vinculosFamiliares = await prisma.vinculoFamiliar.findMany();

    // Backup de ActividadHorarios
    console.log("📋 Haciendo backup de horarios de actividades...");
    backupData.actividadHorarios = await prisma.actividadHorario.findMany();

    // Guardar backup en archivo JSON
    const backupFile = path.join(BACKUP_DIR, generateBackupFilename());
    const backupContent = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      tables: Object.keys(backupData),
      data: backupData,
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupContent, null, 2));

    console.log("✅ Backup completado exitosamente!");
    console.log(`📁 Archivo guardado en: ${backupFile}`);

    // Mostrar estadísticas
    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Tamaño del archivo: ${fileSizeInMB} MB`);

    // Mostrar resumen de datos
    console.log("\n📈 Resumen de datos:");
    Object.entries(backupData).forEach(([table, data]) => {
      console.log(`  📋 ${table}: ${data.length} registros`);
    });
  } catch (error) {
    console.error("❌ Error al crear el backup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para listar backups existentes
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log("📁 No hay directorio de backups");
    return;
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter(
      (file) => file.startsWith("prisma_backup_") && file.endsWith(".json")
    )
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log("📁 No hay backups de Prisma disponibles");
    return;
  }

  console.log("📋 Backups de Prisma disponibles:");
  files.forEach((file) => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    const date = stats.mtime.toLocaleString("es-ES");

    // Leer y mostrar información del backup
    try {
      const backupContent = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const tableCount = Object.keys(backupContent.data).length;
      console.log(
        `  📄 ${file} (${fileSizeInMB} MB) - ${tableCount} tablas - ${date}`
      );
    } catch (error) {
      console.log(`  📄 ${file} (${fileSizeInMB} MB) - ${date}`);
    }
  });
}

// Función para restaurar backup (solo para desarrollo)
async function restoreBackup(filename) {
  const backupFile = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Error: El archivo ${filename} no existe`);
    process.exit(1);
  }

  console.log(`🔄 Restaurando backup desde: ${backupFile}`);
  console.log("⚠️  ADVERTENCIA: Esto sobrescribirá los datos actuales!");
  console.log("⚠️  ¿Estás seguro? (Ctrl+C para cancelar)");

  try {
    const backupContent = JSON.parse(fs.readFileSync(backupFile, "utf8"));
    const { data } = backupContent;

    console.log("⏳ Iniciando restauración...");

    // Limpiar datos existentes (en orden inverso para evitar problemas de FK)
    console.log("🧹 Limpiando datos existentes...");
    await prisma.vinculoFamiliar.deleteMany();
    await prisma.familiar.deleteMany();
    await prisma.historialVisita.deleteMany();
    await prisma.personaMinisterio.deleteMany();
    await prisma.actividadHorario.deleteMany();
    await prisma.actividad.deleteMany();
    await prisma.tipoActividad.deleteMany();
    await prisma.ministerio.deleteMany();
    await prisma.persona.deleteMany();
    await prisma.familia.deleteMany();
    await prisma.usuarioIglesia.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.iglesia.deleteMany();

    // Restaurar datos
    console.log("📥 Restaurando iglesias...");
    if (data.iglesias && data.iglesias.length > 0) {
      await prisma.iglesia.createMany({ data: data.iglesias });
    }

    console.log("📥 Restaurando usuarios...");
    if (data.usuarios && data.usuarios.length > 0) {
      await prisma.usuario.createMany({ data: data.usuarios });
    }

    console.log("📥 Restaurando usuario_iglesias...");
    if (data.usuarioIglesias && data.usuarioIglesias.length > 0) {
      await prisma.usuarioIglesia.createMany({ data: data.usuarioIglesias });
    }

    console.log("📥 Restaurando familias...");
    if (data.familias && data.familias.length > 0) {
      await prisma.familia.createMany({ data: data.familias });
    }

    console.log("📥 Restaurando personas...");
    if (data.personas && data.personas.length > 0) {
      await prisma.persona.createMany({ data: data.personas });
    }

    console.log("📥 Restaurando ministerios...");
    if (data.ministerios && data.ministerios.length > 0) {
      await prisma.ministerio.createMany({ data: data.ministerios });
    }

    console.log("📥 Restaurando tipos de actividad...");
    if (data.tiposActividad && data.tiposActividad.length > 0) {
      await prisma.tipoActividad.createMany({ data: data.tiposActividad });
    }

    console.log("📥 Restaurando actividades...");
    if (data.actividades && data.actividades.length > 0) {
      await prisma.actividad.createMany({ data: data.actividades });
    }

    console.log("📥 Restaurando horarios de actividades...");
    if (data.actividadHorarios && data.actividadHorarios.length > 0) {
      await prisma.actividadHorario.createMany({
        data: data.actividadHorarios,
      });
    }

    console.log("📥 Restaurando persona_ministerios...");
    if (data.personaMinisterios && data.personaMinisterios.length > 0) {
      await prisma.personaMinisterio.createMany({
        data: data.personaMinisterios,
      });
    }

    console.log("📥 Restaurando historial de visitas...");
    if (data.historialVisitas && data.historialVisitas.length > 0) {
      await prisma.historialVisita.createMany({ data: data.historialVisitas });
    }

    console.log("📥 Restaurando familiares...");
    if (data.familiares && data.familiares.length > 0) {
      await prisma.familiar.createMany({ data: data.familiares });
    }

    console.log("📥 Restaurando vínculos familiares...");
    if (data.vinculosFamiliares && data.vinculosFamiliares.length > 0) {
      await prisma.vinculoFamiliar.createMany({
        data: data.vinculosFamiliares,
      });
    }

    console.log("✅ Restauración completada exitosamente!");
  } catch (error) {
    console.error("❌ Error al restaurar el backup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Manejo de argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "create":
  case undefined:
    createBackup();
    break;
  case "list":
    listBackups();
    break;
  case "restore":
    const filename = args[1];
    if (!filename) {
      console.error(
        "❌ Error: Debes especificar el nombre del archivo de backup"
      );
      console.log("💡 Uso: node backup-prisma.js restore <nombre-archivo>");
      process.exit(1);
    }
    restoreBackup(filename);
    break;
  case "help":
    console.log(`
🔄 Script de Backup con Prisma para Base de Datos

Uso:
  node backup-prisma.js [comando]

Comandos:
  create    Crear un nuevo backup usando Prisma (por defecto)
  list      Listar backups existentes
  restore   Restaurar un backup específico (SOLO DESARROLLO)
  help      Mostrar esta ayuda

Ejemplos:
  node backup-prisma.js create
  node backup-prisma.js list
  node backup-prisma.js restore prisma_backup_2024-01-15_10-30-00.json

Ventajas de este método:
  ✅ No requiere pg_dump instalado
  ✅ Backup específico de datos de la aplicación
  ✅ Formato JSON legible
  ✅ Restauración selectiva por tablas
  ✅ Más seguro para desarrollo

⚠️  Notas:
  - Este método es más lento que pg_dump
  - Solo hace backup de datos, no de estructura
  - La restauración es solo para desarrollo
  - Usa pg_dump para backups de producción
    `);
    break;
  default:
    console.error(`❌ Comando desconocido: ${command}`);
    console.log(
      '💡 Usa "node backup-prisma.js help" para ver los comandos disponibles'
    );
    process.exit(1);
}
