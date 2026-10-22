// Prueba de la capa HTTP ante un fallo inesperado (500). Con SQLite en memoria no hay forma natural de
// provocar ese fallo, así que el servicio se reemplaza por un stub que lanza un error, y console.error
// por un spy que lo silencia y deja comprobar que el error sí quedó registrado en el log.
const request = require('supertest');
const { crearApp } = require('../../src/app');

test('responde 500 en JSON sin exponer el detalle del error cuando el servicio falla inesperadamente', async () => {
  // Arrange
  const servicioQueFalla = {
    listar() {
      throw new Error('SQLITE_IOERR: disk I/O error');
    },
  };
  const espiaLog = jest.spyOn(console, 'error').mockImplementation(() => {});
  const app = crearApp(servicioQueFalla);

  // Act
  const res = await request(app).get('/avistamientos');

  // Assert
  expect(res.status).toBe(500);
  expect(res.body).toEqual({ error: 'Error interno del servidor' });
  expect(res.text).not.toContain('SQLITE_IOERR');
  expect(espiaLog).toHaveBeenCalledTimes(1);
  espiaLog.mockRestore();
});
