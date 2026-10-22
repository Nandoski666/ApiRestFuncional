// Pruebas de integración: la API completa (Express + servicio + validador + SQLite real) a través de HTTP,
// con Supertest. Cada prueba arma su propia app con una base SQLite nueva en memoria, así ninguna depende
// de otra ni del orden. Lo único que se reemplaza es el reloj (stub RelojFijo), para que "hoy" no cambie.
const request = require('supertest');
const { abrirBaseDeDatos } = require('../../src/db');
const { crearRepositorio } = require('../../src/repositorio');
const { ValidadorDeAvistamiento } = require('../../src/validador');
const { ServicioDeAvistamientos } = require('../../src/servicio');
const { crearApp } = require('../../src/app');
const { RelojFijo } = require('../dobles/RelojFijo');

const barranquero = {
  especie: 'Barranquero',
  lugar: 'Humedal La Conejera',
  fecha: '2026-09-20',
  observador: 'Hernando Garcia',
};
const toche = { especie: 'Toche', lugar: 'Parque La Florida', fecha: '2026-09-21', observador: 'Hernando Garcia' };

let app;

beforeEach(() => {
  const repositorio = crearRepositorio(abrirBaseDeDatos(':memory:'));
  const validador = new ValidadorDeAvistamiento(new RelojFijo('2026-10-21'));
  app = crearApp(new ServicioDeAvistamientos(repositorio, validador));
});

// Prepara datos a través de la propia API (POST), como lo haría un cliente.
async function registrar(datos) {
  const res = await request(app).post('/avistamientos').send(datos);
  return res.body;
}

describe('GET /avistamientos', () => {
  test('responde 200 con una lista vacía cuando no hay avistamientos', async () => {
    // Act
    const res = await request(app).get('/avistamientos');

    // Assert
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual([]);
  });

  test('responde 200 con todos los avistamientos registrados', async () => {
    // Arrange
    await registrar(barranquero);
    await registrar(toche);

    // Act
    const res = await request(app).get('/avistamientos');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 1, ...barranquero },
      { id: 2, ...toche },
    ]);
  });
});

describe('GET /avistamientos/:id', () => {
  test('responde 200 con el avistamiento completo cuando existe', async () => {
    // Arrange
    const creado = await registrar(barranquero);

    // Act
    const res = await request(app).get(`/avistamientos/${creado.id}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: creado.id, ...barranquero });
  });

  test('responde 404 con un mensaje de error en JSON cuando el id no existe', async () => {
    // Act
    const res = await request(app).get('/avistamientos/999');

    // Assert
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: 'Avistamiento no encontrado' });
  });

  test('responde 404 cuando el id no es un número', async () => {
    // Act
    const res = await request(app).get('/avistamientos/abc');

    // Assert
    expect(res.status).toBe(404);
  });
});

describe('POST /avistamientos', () => {
  test('responde 201 con el avistamiento creado y después el GET al nuevo id lo devuelve', async () => {
    // Act
    const res = await request(app).post('/avistamientos').send(barranquero);

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, ...barranquero });
    expect(res.headers.location).toBe('/avistamientos/1');
    const consulta = await request(app).get('/avistamientos/1');
    expect(consulta.body).toEqual(res.body);
  });

  test('responde 400 indicando los campos que faltan y no guarda nada', async () => {
    // Act
    const res = await request(app).post('/avistamientos').send({ especie: 'Toche' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
    expect(res.body.detalles.map((d) => d.campo)).toEqual(['lugar', 'fecha', 'observador']);
    const lista = await request(app).get('/avistamientos');
    expect(lista.body).toEqual([]);
  });

  test('responde 400 con el campo especie cuando la especie tiene 2 caracteres', async () => {
    // Act
    const res = await request(app).post('/avistamientos').send({ ...barranquero, especie: 'Ab' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.detalles).toEqual([
      { campo: 'especie', mensaje: 'El campo especie debe tener entre 3 y 50 caracteres (tiene 2)' },
    ]);
  });

  test('responde 400 con el campo fecha cuando la fecha es posterior a hoy', async () => {
    // Act
    const res = await request(app).post('/avistamientos').send({ ...barranquero, fecha: '2026-10-22' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.detalles).toEqual([
      { campo: 'fecha', mensaje: 'El campo fecha no puede ser posterior a hoy (2026-10-21)' },
    ]);
  });

  test('responde 400 cuando el cuerpo no es un JSON válido', async () => {
    // Act
    const res = await request(app)
      .post('/avistamientos')
      .set('Content-Type', 'application/json')
      .send('{ "especie": ');

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'El cuerpo de la petición no es un JSON válido' });
  });
});

describe('PUT /avistamientos/:id', () => {
  test('responde 200 con los datos nuevos y después el GET devuelve la versión actualizada', async () => {
    // Arrange
    const creado = await registrar(barranquero);
    const nuevos = { ...barranquero, lugar: 'Humedal Juan Amarillo', fecha: '2026-09-22' };

    // Act
    const res = await request(app).put(`/avistamientos/${creado.id}`).send(nuevos);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: creado.id, ...nuevos });
    const consulta = await request(app).get(`/avistamientos/${creado.id}`);
    expect(consulta.body).toEqual({ id: creado.id, ...nuevos });
  });

  test('responde 404 cuando el avistamiento no existe', async () => {
    // Act
    const res = await request(app).put('/avistamientos/999').send(barranquero);

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Avistamiento no encontrado' });
  });

  test('responde 400 indicando el campo que falló y no modifica el registro guardado', async () => {
    // Arrange
    const creado = await registrar(barranquero);

    // Act
    const res = await request(app).put(`/avistamientos/${creado.id}`).send({ ...barranquero, lugar: '' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.detalles.map((d) => d.campo)).toEqual(['lugar']);
    const consulta = await request(app).get(`/avistamientos/${creado.id}`);
    expect(consulta.body).toEqual(creado);
  });
});

describe('DELETE /avistamientos/:id', () => {
  test('responde 204 sin cuerpo y después el GET al mismo id responde 404', async () => {
    // Arrange
    const creado = await registrar(barranquero);

    // Act
    const res = await request(app).delete(`/avistamientos/${creado.id}`);

    // Assert
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    const consulta = await request(app).get(`/avistamientos/${creado.id}`);
    expect(consulta.status).toBe(404);
  });

  test('responde 404 cuando el avistamiento no existe', async () => {
    // Act
    const res = await request(app).delete('/avistamientos/999');

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Avistamiento no encontrado' });
  });
});

describe('GET /avistamientos/resumen (bonus)', () => {
  test('responde 200 con la cantidad de avistamientos por especie, de mayor a menor', async () => {
    // Arrange
    await registrar(barranquero);
    await registrar(toche);
    await registrar({ ...barranquero, lugar: 'Jardin Botanico de Bogota' });

    // Act
    const res = await request(app).get('/avistamientos/resumen');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { especie: 'Barranquero', cantidad: 2 },
      { especie: 'Toche', cantidad: 1 },
    ]);
  });
});

describe('Rutas que no existen', () => {
  test('responde 404 en JSON cuando la ruta no existe', async () => {
    // Act
    const res = await request(app).get('/aves');

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Ruta no encontrada' });
  });
});
