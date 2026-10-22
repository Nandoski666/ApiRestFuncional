// Pruebas unitarias de la regla de negocio (ValidadorDeAvistamiento).
// Los casos salen de la tabla de partición y valores límite de docs/justificacion-pruebas.md.
// "Hoy" se fija con el stub RelojFijo en 2026-10-21, así las pruebas dan lo mismo cualquier día.
const { ValidadorDeAvistamiento } = require('../../src/validador');
const { RelojFijo } = require('../dobles/RelojFijo');

const HOY = '2026-10-21';

const valido = {
  especie: 'Barranquero',
  lugar: 'Humedal La Conejera',
  fecha: '2026-09-20',
  observador: 'Hernando Garcia',
};

const camposConError = (errores) => errores.map((e) => e.campo);

describe('ValidadorDeAvistamiento', () => {
  let validador;

  beforeEach(() => {
    validador = new ValidadorDeAvistamiento(new RelojFijo(HOY));
  });

  test('acepta un avistamiento representativo con todos los campos válidos', () => {
    // Arrange
    const datos = { ...valido };

    // Act
    const errores = validador.validar(datos);

    // Assert
    expect(errores).toEqual([]);
  });

  describe('especie (partición: menos de 3 | de 3 a 50 | más de 50 caracteres)', () => {
    test('rechaza la especie cuando tiene 2 caracteres (límite del tramo inválido inferior)', () => {
      // Arrange
      const datos = { ...valido, especie: 'Ab' };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(errores).toEqual([
        { campo: 'especie', mensaje: 'El campo especie debe tener entre 3 y 50 caracteres (tiene 2)' },
      ]);
    });

    test('acepta la especie cuando tiene 3 caracteres (límite inferior válido)', () => {
      // Arrange
      const datos = { ...valido, especie: 'Emú' };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(errores).toEqual([]);
    });

    test('acepta la especie cuando tiene 50 caracteres (límite superior válido)', () => {
      // Arrange
      const datos = { ...valido, especie: 'A'.repeat(50) };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(errores).toEqual([]);
    });

    test('rechaza la especie cuando tiene 51 caracteres (límite del tramo inválido superior)', () => {
      // Arrange
      const datos = { ...valido, especie: 'A'.repeat(51) };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(camposConError(errores)).toEqual(['especie']);
      expect(errores[0].mensaje).toContain('(tiene 51)');
    });

    test('rechaza la especie cuando tiene 2 letras rodeadas de espacios (los espacios no cuentan)', () => {
      // Arrange
      const datos = { ...valido, especie: ' Ab ' };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(camposConError(errores)).toEqual(['especie']);
    });

    test('rechaza la especie cuando no es texto', () => {
      // Arrange
      const datos = { ...valido, especie: 12345 };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(errores).toEqual([{ campo: 'especie', mensaje: 'El campo especie es obligatorio y debe ser texto' }]);
    });
  });

  describe('fecha (partición: pasada u hoy | posterior a hoy | formato inválido)', () => {
    test('acepta la fecha cuando es hoy (límite superior válido)', () => {
      // Arrange
      const datos = { ...valido, fecha: HOY };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(errores).toEqual([]);
    });

    test('rechaza la fecha cuando es mañana (límite del tramo futuro)', () => {
      // Arrange
      const datos = { ...valido, fecha: '2026-10-22' };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(errores).toEqual([
        { campo: 'fecha', mensaje: 'El campo fecha no puede ser posterior a hoy (2026-10-21)' },
      ]);
    });

    test('rechaza el 1 de enero cuando hoy es 31 de diciembre (límite que cruza de año)', () => {
      // Arrange
      const validadorFinDeAnio = new ValidadorDeAvistamiento(new RelojFijo('2026-12-31'));
      const datos = { ...valido, fecha: '2027-01-01' };

      // Act
      const errores = validadorFinDeAnio.validar(datos);

      // Assert
      expect(camposConError(errores)).toEqual(['fecha']);
    });

    test('rechaza la fecha cuando viene en formato DD/MM/AAAA', () => {
      // Arrange
      const datos = { ...valido, fecha: '20/09/2026' };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(errores).toEqual([
        { campo: 'fecha', mensaje: 'El campo fecha debe tener formato AAAA-MM-DD y ser una fecha real' },
      ]);
    });

    test('rechaza la fecha cuando tiene el formato correcto pero no existe en el calendario', () => {
      // Arrange
      const datos = { ...valido, fecha: '2026-02-30' };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(camposConError(errores)).toEqual(['fecha']);
    });
  });

  describe('lugar y observador (partición: con texto | vacío o solo espacios | ausente)', () => {
    test('rechaza el lugar cuando está vacío', () => {
      // Arrange
      const datos = { ...valido, lugar: '' };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(errores).toEqual([{ campo: 'lugar', mensaje: 'El campo lugar es obligatorio y no puede estar vacío' }]);
    });

    test('rechaza el observador cuando solo tiene espacios', () => {
      // Arrange
      const datos = { ...valido, observador: '   ' };

      // Act
      const errores = validador.validar(datos);

      // Assert
      expect(camposConError(errores)).toEqual(['observador']);
    });

    test('rechaza el observador cuando no viene en los datos', () => {
      // Arrange
      const { observador, ...sinObservador } = valido;

      // Act
      const errores = validador.validar(sinObservador);

      // Assert
      expect(camposConError(errores)).toEqual(['observador']);
    });
  });

  test('informa cada campo que falló cuando varios no cumplen la regla', () => {
    // Arrange
    const datos = { especie: 'Ab', fecha: '2026-10-22' };

    // Act
    const errores = validador.validar(datos);

    // Assert
    expect(camposConError(errores)).toEqual(['especie', 'lugar', 'fecha', 'observador']);
  });

  test('rechaza el cuerpo cuando no es un objeto JSON', () => {
    // Arrange
    const datos = ['Barranquero'];

    // Act
    const errores = validador.validar(datos);

    // Assert
    expect(camposConError(errores)).toEqual(['cuerpo']);
  });
});
