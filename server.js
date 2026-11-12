// Punto de entrada: arma las piezas (base, repositorio, reloj, validador, servicio) y levanta el servidor.
const path = require('node:path');
const { abrirBaseDeDatos } = require('./src/infrastructure/persistence/db');
const { crearRepositorio } = require('./src/infrastructure/persistence/repositorio');
const { RelojDelSistema } = require('./src/infrastructure/clock/reloj');
const { ValidadorDeAvistamiento } = require('./src/domain/validador');
const { ServicioDeAvistamientos } = require('./src/application/ServicioDeAvistamientos');
const { crearApp } = require('./src/infrastructure/http/app');

const PUERTO = process.env.PORT || 3000;
const RUTA_DB = process.env.DB_PATH || path.join(__dirname, 'avistamientos.db');

const repositorio = crearRepositorio(abrirBaseDeDatos(RUTA_DB));
const validador = new ValidadorDeAvistamiento(new RelojDelSistema());
const app = crearApp(new ServicioDeAvistamientos(repositorio, validador));

app.listen(PUERTO, () => {
  console.log(`API de avistamientos escuchando en http://localhost:${PUERTO}`);
});
