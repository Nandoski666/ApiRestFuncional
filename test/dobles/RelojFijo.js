// Doble de tipo stub: un reloj que siempre dice la misma fecha.
// Sin él, la prueba de "fecha de mañana" pasaría hoy y fallaría en otro día.
class RelojFijo {
  constructor(hoy) {
    this.fecha = hoy;
  }

  hoy() {
    return this.fecha;
  }
}

module.exports = { RelojFijo };
