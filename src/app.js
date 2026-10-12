// Rutas de la API (equivalente a un controlador).
const express = require('express');
const { validarAvistamiento, limpiarAvistamiento } = require('./validacion');

function crearApp(repo) {
  const app = express();
  app.use(express.json());

  // Convierte el {id} de la URL en entero; si no es válido, no existe.
  const leerId = (req) => {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
  };

  const noEncontrado = (res) => res.status(404).json({ error: 'Avistamiento no encontrado' });
  const datosInvalidos = (res, detalles) => res.status(400).json({ error: 'Datos inválidos', detalles });

  // Listar todos
  app.get('/avistamientos', (req, res) => {
    res.status(200).json(repo.listar());
  });

  // Bonus: cantidad de avistamientos por especie (va antes de /:id)
  app.get('/avistamientos/resumen', (req, res) => {
    res.status(200).json(repo.resumen());
  });

  // Ver uno
  app.get('/avistamientos/:id', (req, res) => {
    const id = leerId(req);
    const avistamiento = id && repo.buscarPorId(id);
    if (!avistamiento) return noEncontrado(res);
    res.status(200).json(avistamiento);
  });

  // Registrar
  app.post('/avistamientos', (req, res) => {
    const errores = validarAvistamiento(req.body);
    if (errores.length > 0) return datosInvalidos(res, errores);
    const creado = repo.crear(limpiarAvistamiento(req.body));
    res.status(201).location(`/avistamientos/${creado.id}`).json(creado);
  });

  // Actualizar
  app.put('/avistamientos/:id', (req, res) => {
    const id = leerId(req);
    if (!id || !repo.buscarPorId(id)) return noEncontrado(res);
    const errores = validarAvistamiento(req.body);
    if (errores.length > 0) return datosInvalidos(res, errores);
    res.status(200).json(repo.actualizar(id, limpiarAvistamiento(req.body)));
  });

  // Eliminar
  app.delete('/avistamientos/:id', (req, res) => {
    const id = leerId(req);
    if (!id || !repo.eliminar(id)) return noEncontrado(res);
    res.status(204).end();
  });

  // Cualquier otra ruta
  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Errores: JSON mal escrito -> 400; cualquier otro -> 500
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

module.exports = { crearApp };
