// Reloj del sistema: la única fuente de "hoy" de la API.
// Cualquier objeto con hoy() -> 'AAAA-MM-DD' sirve como reloj (en las pruebas se usa RelojFijo).
class RelojDelSistema {
  // ahora: de dónde sale el instante actual. zona: zona horaria del negocio (los avistamientos son en Colombia).
  constructor({ ahora = () => new Date(), zona = 'America/Bogota' } = {}) {
    this.ahora = ahora;
    this.formato = new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  // Fecha de hoy en la zona del negocio, no en UTC: a las 8 p. m. en Bogotá, en UTC ya es el día siguiente.
  hoy() {
    const partes = this.formato.formatToParts(this.ahora());
    const valor = (tipo) => partes.find((p) => p.type === tipo).value;
    return `${valor('year')}-${valor('month')}-${valor('day')}`;
  }
}

module.exports = { RelojDelSistema };
