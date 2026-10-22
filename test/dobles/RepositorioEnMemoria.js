// Doble de tipo fake: un repositorio que funciona de verdad, pero guarda en un Map en memoria
// en lugar de SQLite. Tiene la misma interfaz que src/repositorio.js.
class RepositorioEnMemoria {
  constructor(iniciales = []) {
    this.datos = new Map();
    this.siguienteId = 1;
    for (const a of iniciales) this.crear(a);
  }

  listar() {
    return [...this.datos.values()];
  }

  buscarPorId(id) {
    return this.datos.get(id);
  }

  crear(a) {
    const nuevo = { id: this.siguienteId++, ...a };
    this.datos.set(nuevo.id, nuevo);
    return nuevo;
  }

  actualizar(id, a) {
    if (!this.datos.has(id)) return undefined;
    const actualizado = { id, ...a };
    this.datos.set(id, actualizado);
    return actualizado;
  }

  eliminar(id) {
    return this.datos.delete(id);
  }

  resumen() {
    const cuenta = {};
    for (const { especie } of this.datos.values()) cuenta[especie] = (cuenta[especie] || 0) + 1;
    return Object.entries(cuenta).map(([especie, cantidad]) => ({ especie, cantidad }));
  }
}

module.exports = { RepositorioEnMemoria };
