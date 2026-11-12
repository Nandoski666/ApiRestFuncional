# Taller 5: Clean Architecture y arquitectura hexagonal

**Asignatura:** Ingeniería de Software 2 (ISW-2)  
**Autor:** Hernando Javier García Mogollón  
**Fecha:** 11 de noviembre de 2026  
**Repositorio:** https://github.com/Nandoski666/ApiRestFuncional  
**Rama:** `refactor/clean-architecture`

## Parte 1. Investigación

### 1. Arquitectura hexagonal: problema, puertos y adaptadores

Cockburn observa que la lógica del negocio suele filtrarse hacia la interfaz de usuario. Como resultado, las pruebas dependen de detalles visuales que cambian, cuesta ejecutar la aplicación sin una persona y se dificulta cambiar la interfaz. El mismo acoplamiento aparece en el otro extremo cuando la lógica depende directamente de una base de datos: trabajar o probar queda condicionado a que esa tecnología esté disponible. Aunque ocurren en lados distintos, ambos problemas nacen de mezclar las reglas internas con la interacción con elementos externos (Cockburn, 2005).

Un **puerto** define una conversación con un propósito y su protocolo, expresado como una API. Un **adaptador** traduce entre ese protocolo y una tecnología concreta. Por ejemplo, Express adapta HTTP a las operaciones de la aplicación; un repositorio SQLite adapta el contrato de almacenamiento a consultas SQL. Para un mismo puerto pueden existir adaptadores distintos, como una base en memoria para pruebas y SQLite para producción. La simetría consiste en tratar tanto al actor que conduce la aplicación como al servicio que la aplicación utiliza como elementos exteriores: el interior no debe depender de sus detalles tecnológicos (Cockburn, 2005).

### 2. Círculos y regla de dependencia de Clean Architecture

Martin presenta cuatro círculos como una guía, no como una cantidad obligatoria de carpetas. En el centro están las **entidades**, con las reglas generales del negocio. A su alrededor están los **casos de uso**, que coordinan reglas específicas de la aplicación. Luego están los **adaptadores de interfaz**, que transforman datos entre el formato interno y formatos de entrada, salida o persistencia. En el círculo exterior están **frameworks y drivers**, como Express, SQLite y herramientas concretas (Martin, 2012).

La regla de dependencia dice que las dependencias del código fuente apuntan hacia dentro. Una política interna no puede conocer nombres, tipos, formatos ni APIs que pertenecen a un círculo externo. Así, el caso de uso no importa Express ni ejecuta SQL; esos detalles pueden cambiar sin obligar a modificar las reglas internas (Martin, 2012).

### 3. Cómo guarda datos un caso de uso sin depender de la base de datos

La necesidad de persistir se resuelve invirtiendo la dependencia. El caso de uso define o consume un contrato interno que expresa lo que necesita del almacenamiento, por ejemplo `crear`, `buscarPorId` y `eliminar`. El adaptador externo implementa ese contrato usando la base elegida. En tiempo de ejecución, la raíz de composición entrega el adaptador al caso de uso; el flujo de llamadas puede ir hacia la base, mientras que la dependencia del código sigue apuntando al contrato interior. Martin explica esta técnica mediante inversión de dependencias y polimorfismo (Martin, 2012).

En esta API, `ServicioDeAvistamientos` recibe el repositorio por constructor y documenta su forma mediante JSDoc. No importa el módulo SQLite. `crearRepositorio` implementa las operaciones con `node:sqlite`, y `server.js` inyecta esa implementación. En las pruebas unitarias se inyecta `RepositorioEnMemoria`. Como JavaScript no tiene interfaces nativas, JSDoc hace explícito el puerto sin añadir una dependencia de framework.

### 4. Hexagonal, Onion y Clean Architecture

Las tres propuestas separan reglas de negocio de mecanismos externos y buscan reducir el acoplamiento para que el núcleo pueda probarse sin la interfaz ni la base de datos. También permiten cambiar adaptadores con menos impacto en las reglas (Cockburn, 2005; Palermo, 2008; Martin, 2012).

Cambian el vocabulario y el modo de explicar la estructura. Hexagonal destaca los **puertos** y **adaptadores** alrededor de una aplicación interior; el hexágono es un dibujo que permite mostrar varios lados, no exige seis componentes ni fija una pila de capas (Cockburn, 2005). Onion representa un **modelo de dominio** en el centro, contratos como repositorios hacia dentro y UI e infraestructura en el borde; las dependencias se dirigen al centro (Palermo, 2008). Clean Architecture organiza la explicación en **entidades, casos de uso, adaptadores de interfaz y frameworks/drivers**, y hace explícita la regla de dependencia hacia dentro (Martin, 2012). Las capas concretas pueden variar: el número de círculos de Martin es esquemático.

### 5. ¿Se justifica en una API pequeña?

Aplicarla tiene un costo: aparecen límites y contratos que una API con pocos endpoints podría resolver con menos archivos. En JavaScript, el puerto necesita documentación de tipos JSDoc y hay que mantener sincronizadas las rutas y pruebas. Si se crean interfaces, factories o capas sin una necesidad real, la arquitectura puede convertirse en ceremonia.

En este caso hay beneficios concretos: las reglas de validación y los errores no dependen de Express ni SQLite; el servicio se prueba con un repositorio en memoria; y la integración verifica por separado HTTP y persistencia. Además, la condición de actualizar primero verifica existencia y después valida los datos queda dentro del caso de uso, sin alterar el contrato HTTP. La decisión fue aplicar una versión deliberadamente pequeña de Clean Architecture: conservar Node.js, Express y SQLite, usar un modelo plano y un contrato JSDoc, y no incorporar Spring, ORM ni abstracciones sin uso. Para esta API el beneficio de aislar reglas que ya tenían pruebas propias justifica el costo moderado de separar las tres capas.

## Parte 2. Aplicación

### Arquitectura y estructura

Se eligió **Clean Architecture**, con dependencias de código hacia el dominio y el caso de uso. Se conservaron las tecnologías y el contrato HTTP que ya tenía el proyecto.

```text
server.js                                      raíz de composición
src/
  domain/
    Avistamiento.js                            modelo plano serializable
    errores.js                                 excepciones de negocio
    validador.js                               reglas de validación
  application/
    ServicioDeAvistamientos.js                 casos de uso + puerto JSDoc
  infrastructure/
    http/app.js                                adaptador Express
    persistence/db.js                          conexión y esquema SQLite
    persistence/repositorio.js                 adaptador SQL del repositorio
    clock/reloj.js                             reloj de sistema (America/Bogota)
test/
  unit/                                        reglas, servicio, modelo y reloj
  integracion/                                 contrato HTTP y persistencia real
  dobles/                                      reloj fijo y repositorio en memoria
```

Dirección de dependencias y composición:

```text
server.js (compone las implementaciones concretas)
  ├── infrastructure/http/app.js ──invoca──> application/ServicioDeAvistamientos.js
  │                                            └──depende de──> domain
  ├── infrastructure/persistence/repositorio.js ──implementa──> puerto JSDoc de Application
  │                                                    └──usa──> domain/Avistamiento.js
  └── infrastructure/clock/reloj.js ──inyectado en──> domain/validador.js

Dependencias de código: Infrastructure ──> Application/Domain; Application ──> Domain.
Application y Domain no importan Express, SQLite ni el reloj concreto.
```

La representación de `Avistamiento` sigue siendo un objeto JavaScript plano con `id`, `especie`, `lugar`, `fecha` y `observador`. El adaptador de persistencia convierte las filas SQLite a ese modelo antes de devolverlas.

### Evolución en commits

| Etapa | Commit | Cambio |
|---|---|---|
| Domain | `2e140fd` | Modelo `Avistamiento`, reglas de validación y errores de dominio. |
| Application | `d4e6cf1` | Caso de uso y contrato JSDoc del repositorio. |
| Infrastructure | `b5edea3` | Adaptadores HTTP, SQLite y reloj; raíz de composición actualizada. |

Este documento acompaña la implementación y reúne respuestas, estructura y evidencia del taller.

### Pruebas y cobertura antes y después

Los comandos se ejecutaron en la línea base y después de reorganizar las capas. El nuevo test unitario del modelo explica el aumento de una suite y una prueba.

| Momento | Suites | Pruebas | Sentencias | Ramas | Funciones | Líneas |
|---|---:|---:|---:|---:|---:|---:|
| Antes (`main`) | 5 pasaron | 51 pasaron | 99,17 % | 93,61 % | 97,56 % | 99,09 % |
| Después (`refactor/clean-architecture`) | 6 pasaron | 52 pasaron | 99,20 % | 93,87 % | 97,67 % | 99,13 % |

**Comandos ejecutados antes:** `npm test` y `npm run cobertura`.  
**Salidas:** 5/5 suites y 51/51 pruebas; cobertura: 99,17 % sentencias, 93,61 % ramas, 97,56 % funciones y 99,09 % líneas.

**Comandos ejecutados después:** `npm test` y `npm run cobertura`.  
**Salidas:** 6/6 suites y 52/52 pruebas; cobertura: 99,20 % sentencias, 93,87 % ramas, 97,67 % funciones y 99,13 % líneas.

En ambas mediciones hubo ramas sin cubrir justificadas por el código defensivo: el valor por defecto del reloj del sistema y la salida `undefined` de una actualización sin cambios en el repositorio. Los porcentajes son las salidas reales de Jest, no metas ni resultados de otra aplicación.

### Muestra equivalente de la API

Se envió el mismo POST a una ejecución de la rama base y a la rama refactorizada, cada una con una base SQLite temporal vacía.

**Petición en ambos casos:**

```http
POST /avistamientos
Content-Type: application/json

{"especie":"Barranquero","lugar":"Humedal La Conejera","fecha":"2026-09-20","observador":"Hernando Garcia"}
```

**Respuesta observada antes y después:**

```http
HTTP/1.1 201 Created
Location: /avistamientos/1
Content-Type: application/json; charset=utf-8
Content-Length: 114
ETag: W/"72-Uwsz+7N1Q9oKOTgS5zbKKDKqhAE"

{"id":1,"especie":"Barranquero","lugar":"Humedal La Conejera","fecha":"2026-09-20","observador":"Hernando Garcia"}
```

Coincidieron el estado, `Location`, tipo de contenido, longitud, ETag y cuerpo. Las pruebas de integración también conservan aserciones sobre GET, PUT, DELETE, resumen, validaciones 400, no encontrados 404 y errores internos 500.

### Dificultad principal

Lo más difícil fue mover responsabilidades sin cambiar observables del cliente ni el orden de errores. Por ejemplo, `actualizar` debe responder 404 si el identificador no existe antes de evaluar si el nuevo cuerpo es válido; cambiar esa secuencia habría alterado el contrato. También hubo que establecer un límite claro entre el puerto del reloj (`hoy()`) y el reloj de Bogotá, y entre la forma de las filas SQLite y el objeto plano del dominio. La composición explícita en `server.js` permitió cambiar esos límites manteniendo la suite de integración como verificación del comportamiento.

## Referencias

- Cockburn, A. (2005). *The Hexagonal (Ports & Adapters) Architecture*. HaT Technical Report 2005.02. https://alistair.cockburn.us/hexagonal-architecture/
- Martin, R. C. (2012, 13 de agosto). *The Clean Architecture*. The Clean Code Blog. https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Palermo, J. (2008, 29 de julio). *The Onion Architecture: Part 1*. Programming with Palermo. https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/
