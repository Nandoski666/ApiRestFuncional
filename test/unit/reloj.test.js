// Pruebas unitarias del RelojDelSistema. El instante "ahora" se reemplaza por una función fija (stub),
// así se puede probar la hora exacta en la que UTC y Colombia ya están en días distintos.
const { RelojDelSistema } = require('../../src/reloj');

describe('RelojDelSistema.hoy', () => {
  test('devuelve la fecha de Colombia y no la de UTC cuando en UTC ya es el día siguiente', () => {
    // Arrange: 21 de octubre a las 8:24 p. m. en Bogotá = 22 de octubre a la 1:24 a. m. en UTC
    const reloj = new RelojDelSistema({ ahora: () => new Date('2026-10-22T01:24:00Z') });

    // Act
    const hoy = reloj.hoy();

    // Assert
    expect(hoy).toBe('2026-10-21');
  });

  test('devuelve el mes y el día con dos dígitos', () => {
    // Arrange
    const reloj = new RelojDelSistema({ ahora: () => new Date('2026-03-05T15:00:00Z') });

    // Act
    const hoy = reloj.hoy();

    // Assert
    expect(hoy).toBe('2026-03-05');
  });
});
