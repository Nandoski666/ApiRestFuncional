// Regla de negocio del avistamiento. Vive separada del controlador para poder probarla sin levantar la API.
const ESPECIE_MIN = 3;
const ESPECIE_MAX = 50;
const CAMPOS = ['especie', 'lugar', 'fecha', 'observador'];

const esTexto = (valor) => typeof valor === 'string';

// Formato AAAA-MM-DD y además una fecha que existe (descarta 2026-02-30).
function esFechaReal(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

function validarNoVacio(campo, valor) {
  if (!esTexto(valor) || valor.trim() === '') {
    return { campo, mensaje: `El campo ${campo} es obligatorio y no puede estar vacío` };
  }
  return null;
}

class ValidadorDeAvistamiento {
  // reloj: objeto con hoy() -> 'AAAA-MM-DD'. Se inyecta para que "hoy" se pueda fijar en las pruebas.
  constructor(reloj) {
    this.reloj = reloj;
  }

  // Devuelve la lista de errores [{ campo, mensaje }]. Si está vacía, el avistamiento es válido.
  validar(datos) {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      return [{ campo: 'cuerpo', mensaje: 'El cuerpo de la petición debe ser un objeto JSON' }];
    }
    return [
      this.validarEspecie(datos.especie),
      validarNoVacio('lugar', datos.lugar),
      this.validarFecha(datos.fecha),
      validarNoVacio('observador', datos.observador),
    ].filter(Boolean);
  }

  // Entre 3 y 50 caracteres, sin contar los espacios de los extremos.
  validarEspecie(valor) {
    if (!esTexto(valor)) {
      return { campo: 'especie', mensaje: 'El campo especie es obligatorio y debe ser texto' };
    }
    const largo = valor.trim().length;
    if (largo < ESPECIE_MIN || largo > ESPECIE_MAX) {
      return {
        campo: 'especie',
        mensaje: `El campo especie debe tener entre ${ESPECIE_MIN} y ${ESPECIE_MAX} caracteres (tiene ${largo})`,
      };
    }
    return null;
  }

  // AAAA-MM-DD, fecha real y no posterior a hoy.
  validarFecha(valor) {
    if (!esTexto(valor) || !esFechaReal(valor.trim())) {
      return { campo: 'fecha', mensaje: 'El campo fecha debe tener formato AAAA-MM-DD y ser una fecha real' };
    }
    const hoy = this.reloj.hoy();
    // Con el formato AAAA-MM-DD, comparar los textos equivale a comparar las fechas.
    if (valor.trim() > hoy) {
      return { campo: 'fecha', mensaje: `El campo fecha no puede ser posterior a hoy (${hoy})` };
    }
    return null;
  }

  // Toma solo los campos del recurso, sin espacios sobrantes (el id lo asigna el sistema).
  limpiar(datos) {
    const limpio = {};
    for (const campo of CAMPOS) limpio[campo] = datos[campo].trim();
    return limpio;
  }
}

module.exports = { ValidadorDeAvistamiento };
