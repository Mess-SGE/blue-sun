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

## Marca

Rosa Blue Sun **`#EA235C`** en toda la app (tokens en `:root`; por historia se llaman `--azul*`/`--sol*`, pero hoy son todos tonos de rosa y blanco). Logos: `logo-blanco.png` (sobre rosa: menú lateral) y `logo-rosa.png` (sobre blanco: ingreso), recortados del logo de la sucursal Mendoza **sin** «Mendoza» ni la dirección; `icono.png` = estrella sobre rosa (favicon / ícono en el celular). Los colores de fichas (gris/dorada) no siguen la marca porque identifican el tipo de ficha.

**Modo oscuro:** todo color de superficie/texto sale de tokens de `:root` (`--superficie`, `--hover`, `--linea`, `--gris-suave`, `--marca-texto`…); el bloque oscuro los redefine bajo `@media (prefers-color-scheme:dark)` con `:root:not([data-tema="claro"])` y otra vez bajo `:root[data-tema="oscuro"]`. El selector Auto/☀️/🌙 del pie del menú (`elegirTema`, `localStorage bs_tema`) pone o saca `data-tema` en `<html>`. **No escribir colores fijos (`#fff`, grises) en reglas nuevas:** usar los tokens, o el oscuro queda con parches blancos. Excepciones a propósito: lo que va sobre el menú rosa (blanco) y el toast (verde/rojo fijos, con texto blanco).

## Presentación de entrada

`#intro` (arriba de todo, `z-index:200`): primero las palabras del sistema (Clientes · Abonos · Caja · Fichas) y después el logo en 3D. El volumen es de verdad CSS 3D: 22 capas de `logo-rosa.png` oscurecidas, cada una con `translateZ` negativo, detrás de `logo-blanco.png`, dentro de un contenedor con `preserve-3d` que gira (`introGira`) y después se mece (`introMece`). El brillo es un degradé enmascarado con el mismo logo. Se muestra **una vez por sesión del navegador** (`sessionStorage bs_intro`), se salta tocando, dura ~8,6 s y con movimiento reducido pasa a un fundido de 2,2 s. Si se cambia la duración, mover juntos los `animation-delay` del CSS de `#intro` y `dura` en `armarIntro()`. Es un overlay: la app/ingreso arrancan debajo al mismo tiempo, no esperan a la animación.

## Navegación

`TABS` / `ALL_TABS` → `mostrarTab(nombre)`. Cada tab tiene su `<section id="tab-<nombre>">` en el HTML y una función `render<Nombre>()`. Para agregar una pantalla hay que tocar los dos lugares.

## Interacción (criterios de diseño tipo Apple)

- **Menú lateral en celular** (`MENU`, `menuResorte`, `menuPointer*`): se arrastra 1:1 respetando dónde se agarró, desde el borde izquierdo (`#bordeMenu`), desde el menú o desde el velo. Se puede agarrar en pleno movimiento, porque arranca desde `MENU.x`, el valor en pantalla. Al soltar se decide abrir o cerrar **proyectando la velocidad** (`proyectar`), no por la posición. El movimiento es un resorte con amortiguación y respuesta: botón = `1 / 0.35`, sin rebote; soltado con impulso = `0.8 / 0.3`. Pasado de abierto tiene resistencia (`rubberband`). `pointermove`/`pointerup` se escuchan en `window`, no en el elemento, porque el dedo sale enseguida de la franja del borde. Un arrastre anula el clic de abajo (`MENU.huboArrastre`). En escritorio (`MQ_MOVIL` falso) no hay transform inline.
- **Modal**: aparece desde el punto donde se tocó (`transform-origin` = `_ultimoToque`) y se cierra por el mismo camino. `cerrarModal()` quita `.visible` y recién a los 260 ms quita `.abierto`; `abrirModal()` cancela ese cierre si llega antes.
- **Toast**: entra y sale desde abajo. **Háptica** (`vibrar`) sólo al guardar un movimiento.
- Todos los tocables responden en el *pointer-down* (`:active` con escala .97, `touch-action: manipulation`).
- Se respetan `prefers-reduced-motion` (el menú salta sin resorte y todo pasa a fundidos), `prefers-reduced-transparency` y `prefers-contrast: more`.

- **Ordenar filas** (Precios: sesiones/abonos/productos, Equipos; Configuración: Sucursales): flechas ▲▼ (`flechasOrden`/`moverOrden`) y manija ⠿ para arrastrar (`asa()`, listeners globales `pointerdown/move/up` con estado `ARR`). Los dos terminan en `aplicarOrden(col, listaOrdenada, id)`, que renumera `orden` 1..n de todo el grupo en un solo `DB.update` y repinta al instante (si la escritura falla, deshace). Las listas se ordenan por `orden` numérico con desempate por nombre (`listaServiciosTipo`, `listaEquipos`, `listaSucursales`), y el selector de servicios de la planilla usa ese mismo orden. Una fila nueva entra con `orden` 99/999, o sea al final.

## App instalable (PWA)

`manifest.json` (scope `./`, íconos `icono-192/512`, `icono-maskable-512` con zona segura, `apple-touch-icon.png`) + `sw.js`. El SW hace **network-first para `index.html`** (siempre la última versión; sin conexión, la copia) y cache-first para archivos propios; **no toca otros dominios** (Firebase, Google Fonts, gstatic): los datos van siempre en vivo. **Al publicar cambios subir `CACHE` en `sw.js`** (`bluesun-v1` → `v2`…): el SW nuevo queda esperando y la app muestra el banner «🔄 Hay una versión nueva — Actualizar» (`avisarVersion`/`actualizarApp`); no hace `skipWaiting` solo para no recargar en medio de una carga. Botón «📲 Instalar app» en el pie del menú cuando el navegador dispara `beforeinstallprompt` (Chrome/Edge/Android); en iPhone se instala desde Safari → Compartir → Agregar a inicio.

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
| `cajas/<suc>/<YYYY-MM-DD>` | `inicial, gastos/<id>{desc,importe}, retiros/<id>{quien→desc,importe}, observaciones, fichas/{gris,dorada}/{inicio,repuestas}, control/<equipoId>/sacadas, aCargo/<personalId>=nombre, supervisor{id,nombre}, resumen{…}`. Se guarda el **nombre** además del id para que el historial se lea aunque la ficha cambie o se borre. |
| `roles/<uid>` | `rol ('admin'|'recepcion'|'lector'), sucursal, email` |
| `solicitudes/<uid>` | Cuentas que ingresaron y todavía no tienen rol. |
| `config/personal/<id>` | `nombre, puesto ('encargada'|'recepcionista'|'supervisora'), sucursalId ('' = todas), telefono, dni, notas, activo, orden`. Vive dentro de `config` a propósito: así lo cubre la regla de admin ya publicada y no hizo falta tocar las reglas (`RUTA_COL` mapea la colección `personal` a esa ruta para ordenar). |
| `config/general` | `abonoMultiLocalDefault, diasAvisoVencimiento` |

### Reglas de negocio a respetar

- **Saldo del abono** = `sesiones − usadas`. `usadas` se mueve **sólo** con `DB.incr` (transacción): +1 al anotar una sesión con abono y −1 al borrarla. Al vender un abono con «Usa la 1ª sesión hoy», se crea con `usadas:1`.
- Un abono se puede usar en otra sucursal sólo si `multiLocal` es true (`abonoUsableAca`). Si está vencido, pide confirmación pero deja usarlo.
- `estadoAbono(a)` → `agotado | vencido | porvencer | activo`.
- **Fichas usadas** = cantidad de movimientos con `sesion:true`, agrupados por el color de ficha del equipo. Nunca se cargan a mano.
- **`cajas/…/resumen`** se recalcula con `recalcularDia()` después de **cada** cambio del día. De ahí salen la caja inicial y las fichas de inicio **del día siguiente** (`DB.ultimoHasta`). Si se agrega un camino nuevo que modifique movimientos o la caja, tiene que llamar a `recalcularDia()`.
- Borrar movimientos es sólo para admin. Borrar una venta de abono borra también el abono.

## Roles

Se aplican en el cliente (`esAdmin`, `puedeCargar`, `TABS[].visible`) **y además** en `database.rules.json`. Recepción sólo escribe movimientos y caja de **su** sucursal y no puede borrar (`newData.exists()`). Los mails de `ADMIN_EMAILS` (`speranza.emiliano@gmail.com`, `speranzaemiliano1@gmail.com`) se autoasignan admin la primera vez que entran; la misma lista está en la regla de `roles` de `database.rules.json` y hay que mantener las dos iguales.

⚠️ `database.rules.json` **no se aplica solo**: hay que publicarlo a mano en Firebase Console.

## Datos iniciales

`armarSemilla()` carga los equipos, los precios y la sucursal Congreso la primera vez que entra un admin. Los precios salen de la planilla de septiembre; los que no están confirmados llevan `aConfirmar:true`. `CLIENTES_PLANILLA` tiene los 105 clientes de la planilla, ya limpios y unificados, y se importan desde Configuración.

## Pendiente / ideas

- Duración de cada abono (hoy está sin definir).
- Cargar el resto de las sucursales.
- Cargar los abonos vendidos antes de empezar a usar el sistema, con el saldo que tienen.
- Turnos o agenda, si hace falta.
