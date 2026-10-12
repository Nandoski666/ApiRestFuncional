// Pruebas de integración: levantan la API con una base SQLite en memoria
// y le hacen peticiones HTTP reales con fetch.
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { abrirBaseDeDatos } = require('../src/db');
const { crearRepositorio } = require('../src/repositorio');
const { crearApp } = require('../src/app');

let servidor;
let base;

beforeEach(async () => {
  const app = crearApp(crearRepositorio(abrirBaseDeDatos(':memory:')));
  await new Promise((resolve) => {
    servidor = app.listen(0, resolve);
  });
  base = `http://localhost:${servidor.address().port}`;
});

afterEach(() => {
  servidor.close();
});

const ejemplo = {
  especie: 'Barranquero',
  lugar: 'Humedal La Conejera',
  fecha: '2026-09-20',
  observador: 'Hernando Garcia',
};

function peticion(metodo, ruta, cuerpo) {
  const opciones = { method: metodo, headers: { 'Content-Type': 'application/json' } };
  if (cuerpo !== undefined) opciones.body = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo);
  return fetch(base + ruta, opciones);
}

async function crear(datos = ejemplo) {
  const res = await peticion('POST', '/avistamientos', datos);
  return res.json();
}

describe('POST /avistamientos', () => {
  it('crea un avistamiento y responde 201', async () => {
    const res = await peticion('POST', '/avistamientos', ejemplo);
    assert.equal(res.status, 201);
    const cuerpo = await res.json();
    assert.equal(typeof cuerpo.id, 'number');
    assert.equal(cuerpo.especie, 'Barranquero');
    assert.equal(res.headers.get('location'), `/avistamientos/${cuerpo.id}`);
  });

  it('responde 400 si faltan datos', async () => {
    const res = await peticion('POST', '/avistamientos', { especie: 'Toche' });
    assert.equal(res.status, 400);
    const cuerpo = await res.json();
    assert.ok(cuerpo.detalles.length >= 3);
  });

  it('responde 400 si la fecha no es AAAA-MM-DD', async () => {
    const res = await peticion('POST', '/avistamientos', { ...ejemplo, fecha: '20/09/2026' });
    assert.equal(res.status, 400);
  });

  it('responde 400 si el JSON está mal formado', async () => {
    const res = await peticion('POST', '/avistamientos', '{ especie: ');
    assert.equal(res.status, 400);
  });
});

describe('GET /avistamientos', () => {
  it('lista todos con 200', async () => {
    await crear();
    await crear({ ...ejemplo, especie: 'Toche' });
    const res = await peticion('GET', '/avistamientos');
    assert.equal(res.status, 200);
    const lista = await res.json();
    assert.equal(lista.length, 2);
  });

  it('devuelve uno con 200', async () => {
    const creado = await crear();
    const res = await peticion('GET', `/avistamientos/${creado.id}`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), creado);
  });

  it('responde 404 si no existe', async () => {
    const res = await peticion('GET', '/avistamientos/999');
    assert.equal(res.status, 404);
  });
});

describe('PUT /avistamientos/:id', () => {
  it('actualiza con 200', async () => {
    const creado = await crear();
    const res = await peticion('PUT', `/avistamientos/${creado.id}`, { ...ejemplo, lugar: 'Parque La Florida' });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).lugar, 'Parque La Florida');
  });

  it('responde 404 si no existe', async () => {
    const res = await peticion('PUT', '/avistamientos/999', ejemplo);
    assert.equal(res.status, 404);
  });

  it('responde 400 si faltan datos', async () => {
    const creado = await crear();
    const res = await peticion('PUT', `/avistamientos/${creado.id}`, { especie: 'Toche' });
    assert.equal(res.status, 400);
  });
});

describe('DELETE /avistamientos/:id', () => {
  it('elimina con 204 y luego ya no existe', async () => {
    const creado = await crear();
    const res = await peticion('DELETE', `/avistamientos/${creado.id}`);
    assert.equal(res.status, 204);
    const otraVez = await peticion('GET', `/avistamientos/${creado.id}`);
    assert.equal(otraVez.status, 404);
  });

  it('responde 404 si no existe', async () => {
    const res = await peticion('DELETE', '/avistamientos/999');
    assert.equal(res.status, 404);
  });
});

describe('GET /avistamientos/resumen (bonus)', () => {
  it('cuenta avistamientos por especie', async () => {
    await crear();
    await crear();
    await crear({ ...ejemplo, especie: 'Toche' });
    const res = await peticion('GET', '/avistamientos/resumen');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), [
      { especie: 'Barranquero', cantidad: 2 },
      { especie: 'Toche', cantidad: 1 },
    ]);
  });
});
