// Rutas de la API (el controlador). Solo traduce HTTP <-> servicio; la lógica está en el servicio y el validador.
const express = require('express');
const { ErrorDeValidacion, NoEncontrado } = require('./errores');

function crearApp(servicio) {
  const app = express();
  app.use(express.json());

  // Listar todos
  app.get('/avistamientos', (req, res) => {
    res.status(200).json(servicio.listar());
  });

  // Bonus: cantidad de avistamientos por especie (va antes de /:id)
  app.get('/avistamientos/resumen', (req, res) => {
    res.status(200).json(servicio.resumen());
  });

  // Ver uno
  app.get('/avistamientos/:id', (req, res) => {
    res.status(200).json(servicio.obtener(req.params.id));
  });

  // Registrar
  app.post('/avistamientos', (req, res) => {
    const creado = servicio.registrar(req.body);
    res.status(201).location(`/avistamientos/${creado.id}`).json(creado);
  });

  // Actualizar
  app.put('/avistamientos/:id', (req, res) => {
    res.status(200).json(servicio.actualizar(req.params.id, req.body));
  });

  // Eliminar
  app.delete('/avistamientos/:id', (req, res) => {
    servicio.eliminar(req.params.id);
    res.status(204).end();
  });

  // Cualquier otra ruta
  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Errores del dominio -> 400 / 404; JSON mal escrito -> 400; cualquier otro -> 500
  app.use((err, req, res, next) => {
    if (err instanceof ErrorDeValidacion) {
      return res.status(400).json({ error: err.message, detalles: err.detalles });
    }
    if (err instanceof NoEncontrado) {
      return res.status(404).json({ error: err.message });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

module.exports = { crearApp };
