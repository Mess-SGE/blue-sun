# CLAUDE.md

Contexto técnico para asistentes de IA. Documentación para personas: `README.md`.

## Qué es

**Blue Sun · Gestión**: sistema de gestión para una cadena de solariums (camas solares) con varias sucursales. Maneja la planilla del día, clientes, abonos de sesiones, la caja diaria, el control de fichas y el resumen mensual. Está en español (Argentina). Reemplaza un Excel con una hoja por día y una hoja BASE de resumen.

## Arquitectura (marco estándar de Emiliano)

- **Un solo `index.html`** con HTML, CSS y JS juntos. **Sin framework ni paso de build.** El JS es mayormente ES5 (`var`, `function`), con strings entre comillas simples y comentarios en español.
- **Firebase compat SDK 10.x** (Auth email/password + Realtime Database). El nodo raíz es `bluesun`.
- **Modo demo**: si `FIREBASE_CONFIG.apiKey` está vacío, `DB` usa `crearDBLocal()` (localStorage `bluesun_demo`) con la **misma interfaz** que `crearDBFirebase()`: `get`, `update` (multi-ruta, `null` borra), `range` (por clave), `ultimoHasta`, `incr` (transacción) y `key`. Toda lectura y escritura pasa por `DB`: nunca llamar a `firebase.database()` directo.
- Hosting en **GitHub Pages**.
- Validar el JS con `node --check` antes de entregar. Para eso, extraer el script que está entre `<!-- ===== INICIO SCRIPT PRINCIPAL ===== -->` y `<!-- ===== FIN SCRIPT PRINCIPAL ===== -->`.

## Navegación

`TABS` / `ALL_TABS` → `mostrarTab(nombre)`. Cada tab tiene su `<section id="tab-<nombre>">` en el HTML y una función `render<Nombre>()`. Para agregar una pantalla hay que tocar los dos lugares.

## Modelo de datos (`bluesun/…`)

| Ruta | Contenido |
|---|---|
| `sucursales/<id>` | `nombre, direccion, activa, orden` |
| `equipos/<id>` | `nombre, ficha ('gris'|'dorada'), activo, orden`. Blue Sun usa fichas grises; el resto, doradas. |
| `servicios/<id>` | `nombre, tipo ('sesion'|'abono'|'producto'), equipoId, sesiones, dias ('' = sin definir), precioEfectivo, precioTarjeta, activo, aConfirmar`. **La transferencia se cobra al precio de tarjeta** (`precioDe`). La sesión de cada equipo tiene id `ses-<equipoId>`. |
| `clientes/<id>` | `nombre (MAYÚSCULAS), telefono, dni, email, nacimiento, notas, sucursalAlta, ultimaVisita` |
| `abonos/<id>` | `clienteId, servicioId, nombre, equipoId, sesiones, usadas, fechaVenta, vence ('' = no vence), sucursalId, multiLocal, precio, forma, movId, ajustes/<id>` |
| `movimientos/<suc>/<YYYY-MM-DD>/<id>` | Una fila de la planilla: `hora, clienteId, clienteNombre, servicioId, servicioNombre, tipo, equipoId, sesion (bool: consume ficha), forma ('efectivo'|'tarjeta'|'transferencia'|'abono'), importe, abonoId (sesión que descuenta de un abono), abonoCreadoId (venta de abono), nota, usuario` |
| `historial/<clienteId>/<movId>` | Copia liviana del movimiento, para la ficha del cliente (se escribe en el mismo `update`). |
| `cajas/<suc>/<YYYY-MM-DD>` | `inicial, gastos/<id>{desc,importe}, retiros/<id>{quien→desc,importe}, observaciones, fichas/{gris,dorada}/{inicio,repuestas}, control/<equipoId>/sacadas, resumen{…}` |
| `roles/<uid>` | `rol ('admin'|'recepcion'|'lector'), sucursal, email` |
| `solicitudes/<uid>` | Cuentas que ingresaron y todavía no tienen rol. |
| `config/general` | `abonoMultiLocalDefault, diasAvisoVencimiento` |

### Reglas de negocio a respetar

- **Saldo del abono** = `sesiones − usadas`. `usadas` se mueve **sólo** con `DB.incr` (transacción): +1 al anotar una sesión con abono y −1 al borrarla. Al vender un abono con «Usa la 1ª sesión hoy», se crea con `usadas:1`.
- Un abono se puede usar en otra sucursal sólo si `multiLocal` es true (`abonoUsableAca`). Si está vencido, pide confirmación pero deja usarlo.
- `estadoAbono(a)` → `agotado | vencido | porvencer | activo`.
- **Fichas usadas** = cantidad de movimientos con `sesion:true`, agrupados por el color de ficha del equipo. Nunca se cargan a mano.
- **`cajas/…/resumen`** se recalcula con `recalcularDia()` después de **cada** cambio del día. De ahí salen la caja inicial y las fichas de inicio **del día siguiente** (`DB.ultimoHasta`). Si se agrega un camino nuevo que modifique movimientos o la caja, tiene que llamar a `recalcularDia()`.
- Borrar movimientos es sólo para admin. Borrar una venta de abono borra también el abono.

## Roles

Se aplican en el cliente (`esAdmin`, `puedeCargar`, `TABS[].visible`) **y además** en `database.rules.json`. Recepción sólo escribe movimientos y caja de **su** sucursal y no puede borrar (`newData.exists()`). `ADMIN_EMAIL` se autoasigna admin la primera vez que entra.

⚠️ `database.rules.json` **no se aplica solo**: hay que publicarlo a mano en Firebase Console.

## Datos iniciales

`armarSemilla()` carga los equipos, los precios y la sucursal Congreso la primera vez que entra un admin. Los precios salen de la planilla de septiembre; los que no están confirmados llevan `aConfirmar:true`. `CLIENTES_PLANILLA` tiene los 105 clientes de la planilla, ya limpios y unificados, y se importan desde Configuración.

## Pendiente / ideas

- Duración de cada abono (hoy está sin definir).
- Cargar el resto de las sucursales.
- Cargar los abonos vendidos antes de empezar a usar el sistema, con el saldo que tienen.
- Turnos o agenda, si hace falta.
