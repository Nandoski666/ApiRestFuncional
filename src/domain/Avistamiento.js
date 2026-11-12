/**
 * @typedef {Object} Avistamiento
 * @property {number} id
 * @property {string} especie
 * @property {string} lugar
 * @property {string} fecha
 * @property {string} observador
 */

/** @param {Avistamiento} datos */
function crearAvistamiento(datos) {
  return {
    id: datos.id,
    especie: datos.especie,
    lugar: datos.lugar,
    fecha: datos.fecha,
    observador: datos.observador,
  };
}

module.exports = { crearAvistamiento };
