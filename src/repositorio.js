// Capa de acceso a datos: aquí vive todo el SQL.
function crearRepositorio(db) {
  const sql = {
    listar: db.prepare('SELECT id, especie, lugar, fecha, observador FROM avistamientos ORDER BY id'),
    buscar: db.prepare('SELECT id, especie, lugar, fecha, observador FROM avistamientos WHERE id = ?'),
    insertar: db.prepare('INSERT INTO avistamientos (especie, lugar, fecha, observador) VALUES (?, ?, ?, ?)'),
    actualizar: db.prepare('UPDATE avistamientos SET especie = ?, lugar = ?, fecha = ?, observador = ? WHERE id = ?'),
    eliminar: db.prepare('DELETE FROM avistamientos WHERE id = ?'),
    resumen: db.prepare(
      'SELECT especie, COUNT(*) AS cantidad FROM avistamientos GROUP BY especie ORDER BY cantidad DESC, especie'
    ),
  };

  return {
    listar() {
      return sql.listar.all();
    },
    buscarPorId(id) {
      return sql.buscar.get(id);
    },
    crear(a) {
      const resultado = sql.insertar.run(a.especie, a.lugar, a.fecha, a.observador);
      return sql.buscar.get(resultado.lastInsertRowid);
    },
    actualizar(id, a) {
      const resultado = sql.actualizar.run(a.especie, a.lugar, a.fecha, a.observador, id);
      return resultado.changes > 0 ? sql.buscar.get(id) : undefined;
    },
    eliminar(id) {
      return sql.eliminar.run(id).changes > 0;
    },
    resumen() {
      return sql.resumen.all();
    },
  };
}

module.exports = { crearRepositorio };
