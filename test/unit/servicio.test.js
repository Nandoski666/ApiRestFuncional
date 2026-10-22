// Pruebas unitarias del ServicioDeAvistamientos, aislado de SQLite y del reloj del sistema.
// Dobles: RepositorioEnMemoria (fake), RelojFijo (stub) y jest.spyOn sobre el repositorio (spy).
const { ServicioDeAvistamientos } = require('../../src/servicio');
const { ValidadorDeAvistamiento } = require('../../src/validador');
const { ErrorDeValidacion, NoEncontrado } = require('../../src/errores');
const { RepositorioEnMemoria } = require('../dobles/RepositorioEnMemoria');
const { RelojFijo } = require('../dobles/RelojFijo');

const valido = {
  especie: 'Barranquero',
  lugar: 'Humedal La Conejera',
  fecha: '2026-09-20',
  observador: 'Hernando Garcia',
};

function crearServicio(iniciales = []) {
  const repositorio = new RepositorioEnMemoria(iniciales);
  const servicio = new ServicioDeAvistamientos(repositorio, new ValidadorDeAvistamiento(new RelojFijo('2026-10-21')));
  return { servicio, repositorio };
}

// Ejecuta la acción y devuelve el error lanzado, para poder revisar su tipo y sus detalles.
function capturarError(accion) {
  try {
    accion();
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba que la acción lanzara un error');
}

describe('ServicioDeAvistamientos.registrar', () => {
  test('guarda el avistamiento y lo devuelve con el id asignado cuando los datos son válidos', () => {
    // Arrange
    const { servicio, repositorio } = crearServicio();

    // Act
    const creado = servicio.registrar(valido);

    // Assert
    expect(creado).toEqual({ id: 1, ...valido });
    expect(repositorio.buscarPorId(1)).toEqual(creado);
  });

  test('guarda los textos sin espacios sobrantes e ignora el id que envía el cliente', () => {
    // Arrange
    const { servicio } = crearServicio();
    const datos = { ...valido, id: 99, especie: '  Toche  ', lugar: ' Parque La Florida ' };

    // Act
    const creado = servicio.registrar(datos);

    // Assert
    expect(creado).toEqual({ ...valido, id: 1, especie: 'Toche', lugar: 'Parque La Florida' });
  });

  test('no llama al repositorio y lanza un error con el campo que falló cuando los datos son inválidos', () => {
    // Arrange
    const { servicio, repositorio } = crearServicio();
    const espiaCrear = jest.spyOn(repositorio, 'crear');

    // Act
    const error = capturarError(() => servicio.registrar({ ...valido, especie: 'Ab' }));

    // Assert
    expect(error).toBeInstanceOf(ErrorDeValidacion);
    expect(error.detalles.map((d) => d.campo)).toEqual(['especie']);
    expect(espiaCrear).not.toHaveBeenCalled();
  });
});

describe('ServicioDeAvistamientos.obtener', () => {
  test('devuelve el avistamiento cuando el id existe', () => {
    // Arrange
    const { servicio } = crearServicio([valido]);

    // Act
    const encontrado = servicio.obtener('1');

    // Assert
    expect(encontrado).toEqual({ id: 1, ...valido });
  });

  test.each(['999', 'abc', '0', '-1', '1.5'])('lanza NoEncontrado cuando el id es "%s"', (id) => {
    // Arrange
    const { servicio } = crearServicio([valido]);

    // Act
    const accion = () => servicio.obtener(id);

    // Assert
    expect(accion).toThrow(NoEncontrado);
  });
});

describe('ServicioDeAvistamientos.actualizar', () => {
  test('reemplaza los datos del avistamiento cuando existe y los datos son válidos', () => {
    // Arrange
    const { servicio, repositorio } = crearServicio([valido]);
    const nuevos = { ...valido, lugar: 'Humedal Juan Amarillo' };

    // Act
    const actualizado = servicio.actualizar('1', nuevos);

    // Assert
    expect(actualizado).toEqual({ id: 1, ...nuevos });
    expect(repositorio.buscarPorId(1).lugar).toBe('Humedal Juan Amarillo');
  });

  test('lanza NoEncontrado antes de validar cuando el id no existe', () => {
    // Arrange
    const { servicio } = crearServicio();

    // Act
    const accion = () => servicio.actualizar('999', { especie: 'Ab' });

    // Assert
    expect(accion).toThrow(NoEncontrado);
  });

  test('no modifica el registro cuando los datos nuevos son inválidos', () => {
    // Arrange
    const { servicio, repositorio } = crearServicio([valido]);
    const espiaActualizar = jest.spyOn(repositorio, 'actualizar');

    // Act
    const accion = () => servicio.actualizar('1', { ...valido, fecha: '2026-10-22' });

    // Assert
    expect(accion).toThrow(ErrorDeValidacion);
    expect(espiaActualizar).not.toHaveBeenCalled();
    expect(repositorio.buscarPorId(1)).toEqual({ id: 1, ...valido });
  });
});

describe('ServicioDeAvistamientos.eliminar', () => {
  test('borra el avistamiento cuando existe', () => {
    // Arrange
    const { servicio, repositorio } = crearServicio([valido]);

    // Act
    servicio.eliminar('1');

    // Assert
    expect(repositorio.buscarPorId(1)).toBeUndefined();
  });

  test('lanza NoEncontrado cuando el id no existe', () => {
    // Arrange
    const { servicio } = crearServicio();

    // Act
    const accion = () => servicio.eliminar('999');

    // Assert
    expect(accion).toThrow(NoEncontrado);
  });
});
