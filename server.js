// Punto de entrada: abre la base de datos y levanta el servidor.
const path = require('node:path');
const { abrirBaseDeDatos } = require('./src/db');
const { crearRepositorio } = require('./src/repositorio');
const { crearApp } = require('./src/app');

const PUERTO = process.env.PORT || 3000;
const RUTA_DB = process.env.DB_PATH || path.join(__dirname, 'avistamientos.db');

const app = crearApp(crearRepositorio(abrirBaseDeDatos(RUTA_DB)));

app.listen(PUERTO, () => {
  console.log(`API de avistamientos escuchando en http://localhost:${PUERTO}`);
});
