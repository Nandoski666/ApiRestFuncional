// Reglas del recurso avistamiento.
const CAMPOS = ['especie', 'lugar', 'fecha', 'observador'];

function esFechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  // Descarta fechas imposibles como 2026-02-30
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

// Devuelve la lista de errores; si está vacía, los datos son válidos.
function validarAvistamiento(cuerpo) {
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return ['El cuerpo de la petición debe ser un objeto JSON'];
  }
  const errores = [];
  for (const campo of CAMPOS) {
    const valor = cuerpo[campo];
    if (typeof valor !== 'string' || valor.trim() === '') {
      errores.push(`El campo "${campo}" es obligatorio y debe ser texto`);
    }
  }
  if (typeof cuerpo.fecha === 'string' && cuerpo.fecha.trim() !== '' && !esFechaValida(cuerpo.fecha.trim())) {
    errores.push('El campo "fecha" debe tener formato AAAA-MM-DD y ser una fecha real');
  }
  return errores;
}

// Toma solo los campos permitidos (el id lo asigna el sistema, se ignora si viene).
function limpiarAvistamiento(cuerpo) {
  const limpio = {};
  for (const campo of CAMPOS) limpio[campo] = cuerpo[campo].trim();
  return limpio;
}

module.exports = { validarAvistamiento, limpiarAvistamiento };
