# ☀️ Blue Sun · Gestión de solarium

Sistema web para manejar los locales de **Blue Sun**: planilla del día, clientes, abonos, caja, fichas y resumen del mes. Reemplaza la planilla de Excel que se usaba por mes y por local (`SEPTIEMBRE_SOLARIUM_CONGRESO.xlsx`).

## Qué hace

| Pantalla | Para qué sirve |
|---|---|
| 🏠 **Inicio** | Resumen del día y del mes, sesiones por equipo, abonos por vencer y clientes en su última sesión, con botón de WhatsApp. |
| 📋 **Planilla del día** | Se anota cada cliente, servicio y forma de pago. Si el cliente tiene abono, se descuenta la sesión. Incluye la **caja del día** (inicial + efectivo − gastos − retiros) y el **control de fichas** grises y doradas. |
| 👥 **Clientes** | Ficha de cada cliente con buscador, abonos e historial de visitas. |
| 🎟️ **Abonos** | Abonos vigentes, por vencer, vencidos y agotados. El admin puede extenderlos o corregirlos, y cada cambio queda registrado. |
| 📊 **Resumen del mes** | Equivale a la hoja BASE del Excel: totales día por día, sesiones por equipo y ventas por servicio. Se puede ver una sucursal o todas juntas, y descargar en CSV. |
| 💲 **Precios y equipos** | Precio en **efectivo** y precio con **tarjeta** para cada servicio (la transferencia se cobra como tarjeta), duración de los abonos y tipo de ficha de cada equipo. |
| 👩‍💼 **Personal** | Encargadas, recepcionistas y supervisoras. En la planilla se elige quién está a cargo cada día y quién supervisó las fichas. |
| ⚙️ **Configuración** | Sucursales, usuarios, opciones de abonos, importación de clientes de la planilla y copia de seguridad. |

## Cómo probarlo ya (modo demo)

Abrí `index.html` en el navegador. Mientras no esté configurado Firebase, la app funciona en **modo demo**: los datos quedan guardados sólo en ese navegador.

## Cómo ponerlo en producción

1. **Crear el proyecto de Firebase** (uno propio, separado de RK) en <https://console.firebase.google.com>.
   - Authentication → Método de acceso → activar **Correo/contraseña**.
   - Realtime Database → Crear base de datos.
   - ⚙️ Configuración del proyecto → Tus apps → Web (`</>`) → copiar el objeto `firebaseConfig`.
2. **Pegar la configuración** en `index.html`, en la variable `FIREBASE_CONFIG` (al principio del script).
3. **Publicar las reglas**: copiar el contenido de `database.rules.json` en Realtime Database → Reglas → Publicar.
   ⚠️ Que el archivo esté en el repositorio no significa que esté aplicado: hay que publicarlo a mano.
4. **Crear tu usuario** en Authentication → Agregar usuario, con `speranza.emiliano@gmail.com`. Cuando entrás por primera vez, quedás como administrador y la app carga los equipos y los precios iniciales.
5. **GitHub Pages**: Settings → Pages → Branch `main` / carpeta `root`. La app queda publicada en `https://mess-sge.github.io/blue-sun/`.

### Sumar a alguien de recepción

1. En Firebase Console → Authentication → **Agregar usuario**, con su mail y una contraseña.
2. La persona entra a la app y le aparece «Falta habilitarte».
3. Vos vas a Configuración → Usuarios, le elegís rol **Recepción** y su **sucursal**, y tocás Habilitar.

## Roles

| Rol | Puede |
|---|---|
| **Administrador** | Todo: todas las sucursales, borrar movimientos, precios, usuarios. |
| **Recepción** | Anotar en la planilla de **su** sucursal, cargar clientes, gastos y retiros. No puede borrar ni ver el resumen del mes. |
| **Sólo lectura** | Ver, sin modificar nada. |

## Instalar la app en el celular o la computadora

- **Android / Chrome / Edge:** abrí el sistema y tocá **«📲 Instalar app»** al pie del menú (o el ícono de instalar en la barra de direcciones). Queda con el ícono de la estrella, en pantalla completa.
- **iPhone / iPad:** abrilo en **Safari** → botón **Compartir** → **«Agregar a inicio»**.
- Cuando se publica una versión nueva, la app muestra **«🔄 Hay una versión nueva — Actualizar»**.
