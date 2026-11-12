// Conexión a SQLite usando el módulo integrado de Node.js (node:sqlite).
const { DatabaseSync } = require('node:sqlite');

function abrirBaseDeDatos(ruta) {
  const db = new DatabaseSync(ruta);
  db.exec(`
    CREATE TABLE IF NOT EXISTS avistamientos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      especie    TEXT NOT NULL,
      lugar      TEXT NOT NULL,
      fecha      TEXT NOT NULL,
      observador TEXT NOT NULL
    )
  `);
  return db;
}

module.exports = { abrirBaseDeDatos };
