// Casos de uso de los avistamientos. Recibe el repositorio y el validador por el constructor
// (inversión de dependencias), así en las pruebas se le pueden entregar dobles.
const { ErrorDeValidacion, NoEncontrado } = require('./errores');

// El {id} de la URL debe ser un entero positivo; si no lo es, ese avistamiento no existe.
function aId(valor) {
  if (!/^[1-9]\d*$/.test(String(valor))) throw new NoEncontrado();
  return Number(valor);
}

class ServicioDeAvistamientos {
  constructor(repositorio, validador) {
    this.repositorio = repositorio;
    this.validador = validador;
  }

  listar() {
    return this.repositorio.listar();
  }

  obtener(id) {
    const avistamiento = this.repositorio.buscarPorId(aId(id));
    if (!avistamiento) throw new NoEncontrado();
    return avistamiento;
  }

  registrar(datos) {
    this.validarOFallar(datos);
    return this.repositorio.crear(this.validador.limpiar(datos));
  }

  // Primero se comprueba que exista (404) y después que los datos sean válidos (400).
  actualizar(id, datos) {
    const numero = aId(id);
    if (!this.repositorio.buscarPorId(numero)) throw new NoEncontrado();
    this.validarOFallar(datos);
    return this.repositorio.actualizar(numero, this.validador.limpiar(datos));
  }

  eliminar(id) {
    if (!this.repositorio.eliminar(aId(id))) throw new NoEncontrado();
  }

  resumen() {
    return this.repositorio.resumen();
  }

  validarOFallar(datos) {
    const errores = this.validador.validar(datos);
    if (errores.length > 0) throw new ErrorDeValidacion(errores);
  }
}

module.exports = { ServicioDeAvistamientos };
