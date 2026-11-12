const { crearAvistamiento } = require('../../src/domain/Avistamiento');

test('crea un avistamiento como objeto plano serializable con solo los campos del recurso', () => {
  const datos = {
    id: 7,
    especie: 'Barranquero',
    lugar: 'Humedal La Conejera',
    fecha: '2026-09-20',
    observador: 'Hernando Garcia',
    interno: true,
  };

  const avistamiento = crearAvistamiento(datos);

  expect(avistamiento).toEqual({
    id: 7,
    especie: 'Barranquero',
    lugar: 'Humedal La Conejera',
    fecha: '2026-09-20',
    observador: 'Hernando Garcia',
  });
  expect(Object.getPrototypeOf(avistamiento)).toBe(Object.prototype);
  expect(JSON.parse(JSON.stringify(avistamiento))).toEqual(avistamiento);
});
