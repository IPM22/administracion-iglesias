#!/usr/bin/env node

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// Configuración
const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(__dirname, "..", "backups");

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Función para extraer credenciales de la URL de Supabase
function parseDatabaseUrl(url) {
  try {
    // Formato: postgresql://postgres:[password]@[host]:[port]/postgres
    const match = url.match(
      /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
    );
    if (!match) {
      throw new Error("Formato de URL de base de datos inválido");
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5],
    };
  } catch (error) {
    console.error(
      "❌ Error al parsear la URL de la base de datos:",
      error.message
    );
    process.exit(1);
  }
}

// Función para generar nombre de archivo con timestamp
function generateBackupFilename() {
  const now = new Date();
  const timestamp =
    now.toISOString().replace(/[:.]/g, "-").split("T")[0] +
    "_" +
    now.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `backup_${timestamp}.sql`;
}

// Función para hacer backup
function createBackup() {
  if (!DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL no está definida en .env.local");
    console.log(
      "💡 Asegúrate de tener la variable DATABASE_URL en tu archivo .env.local"
    );
    process.exit(1);
  }

  const dbConfig = parseDatabaseUrl(DATABASE_URL);
  const backupFile = path.join(BACKUP_DIR, generateBackupFilename());

  console.log("🔄 Iniciando backup de la base de datos...");
  console.log(`📁 Archivo de backup: ${backupFile}`);
  console.log(`🏠 Host: ${dbConfig.host}`);
  console.log(`🗄️  Base de datos: ${dbConfig.database}`);

  // Comando pg_dump
  const pgDumpCommand = `pg_dump --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.user} --dbname=${dbConfig.database} --verbose --clean --no-owner --no-privileges --file="${backupFile}"`;

  // Configurar variable de entorno para la contraseña
  const env = { ...process.env, PGPASSWORD: dbConfig.password };

  console.log("⏳ Ejecutando pg_dump...");

  exec(pgDumpCommand, { env }, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Error al crear el backup:", error.message);
      console.error("💡 Asegúrate de tener pg_dump instalado en tu sistema");
      console.error(
        "💡 En Windows, puedes instalarlo con: https://www.postgresql.org/download/windows/"
      );
      process.exit(1);
    }

    if (stderr) {
      console.log("⚠️  Advertencias:", stderr);
    }

    console.log("✅ Backup completado exitosamente!");
    console.log(`📁 Archivo guardado en: ${backupFile}`);

    // Mostrar tamaño del archivo
    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Tamaño del archivo: ${fileSizeInMB} MB`);
  });
}

// Función para listar backups existentes
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log("📁 No hay directorio de backups");
    return;
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log("📁 No hay backups disponibles");
    return;
  }

  console.log("📋 Backups disponibles:");
  files.forEach((file) => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    const date = stats.mtime.toLocaleString("es-ES");
    console.log(`  📄 ${file} (${fileSizeInMB} MB) - ${date}`);
  });
}

// Función para restaurar backup
function restoreBackup(filename) {
  if (!DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL no está definida en .env.local");
    process.exit(1);
  }

  const backupFile = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Error: El archivo ${filename} no existe`);
    process.exit(1);
  }

  const dbConfig = parseDatabaseUrl(DATABASE_URL);

  console.log(`🔄 Restaurando backup desde: ${backupFile}`);
  console.log("⚠️  ADVERTENCIA: Esto sobrescribirá la base de datos actual!");
  console.log("⚠️  ¿Estás seguro? (Ctrl+C para cancelar)");

  // Comando psql para restaurar
  const psqlCommand = `psql --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.user} --dbname=${dbConfig.database} --file="${backupFile}"`;

  const env = { ...process.env, PGPASSWORD: dbConfig.password };

  exec(psqlCommand, { env }, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Error al restaurar el backup:", error.message);
      process.exit(1);
    }

    console.log("✅ Restauración completada exitosamente!");
  });
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
      console.log("💡 Uso: node backup-database.js restore <nombre-archivo>");
      process.exit(1);
    }
    restoreBackup(filename);
    break;
  case "help":
    console.log(`
🔄 Script de Backup para Base de Datos Supabase

Uso:
  node backup-database.js [comando]

Comandos:
  create    Crear un nuevo backup (por defecto)
  list      Listar backups existentes
  restore   Restaurar un backup específico
  help      Mostrar esta ayuda

Ejemplos:
  node backup-database.js create
  node backup-database.js list
  node backup-database.js restore backup_2024-01-15_10-30-00.sql

Requisitos:
  - pg_dump y psql instalados en tu sistema
  - Variables de entorno configuradas en .env.local
  - Acceso a la base de datos Supabase

💡 Para instalar PostgreSQL en Windows:
  https://www.postgresql.org/download/windows/
    `);
    break;
  default:
    console.error(`❌ Comando desconocido: ${command}`);
    console.log(
      '💡 Usa "node backup-database.js help" para ver los comandos disponibles'
    );
    process.exit(1);
}
