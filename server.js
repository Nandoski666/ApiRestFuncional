// Punto de entrada: arma las piezas (base, repositorio, reloj, validador, servicio) y levanta el servidor.
const path = require('node:path');
const { abrirBaseDeDatos } = require('./src/db');
const { crearRepositorio } = require('./src/repositorio');
const { RelojDelSistema } = require('./src/reloj');
const { ValidadorDeAvistamiento } = require('./src/validador');
const { ServicioDeAvistamientos } = require('./src/servicio');
const { crearApp } = require('./src/app');

const PUERTO = process.env.PORT || 3000;
const RUTA_DB = process.env.DB_PATH || path.join(__dirname, 'avistamientos.db');

const repositorio = crearRepositorio(abrirBaseDeDatos(RUTA_DB));
const validador = new ValidadorDeAvistamiento(new RelojDelSistema());
const app = crearApp(new ServicioDeAvistamientos(repositorio, validador));

app.listen(PUERTO, () => {
  console.log(`API de avistamientos escuchando en http://localhost:${PUERTO}`);
});
