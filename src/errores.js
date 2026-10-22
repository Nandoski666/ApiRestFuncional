// Errores del dominio. El controlador los traduce a códigos HTTP (400 y 404).
class ErrorDeValidacion extends Error {
  constructor(detalles) {
    super('Datos inválidos');
    this.name = 'ErrorDeValidacion';
    this.detalles = detalles;
  }
}

class NoEncontrado extends Error {
  constructor() {
    super('Avistamiento no encontrado');
    this.name = 'NoEncontrado';
  }
}

module.exports = { ErrorDeValidacion, NoEncontrado };
