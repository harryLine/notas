# Notas tipo Padlet (Node.js)

Aplicación web minimalista para gestionar notas con:
- Creación de notas con **color aleatorio** entre 5 tonos pastel predefinidos.
- **Drag & drop** para mover notas por el tablero.
- **Redimensionado** sencillo de cada nota.
- Persistencia en archivo local JSON (`data/notes.json`) para simplificar despliegue.

## Estructura del proyecto

```
notas/
├─ data/
│  └─ notes.json
├─ public/
│  ├─ app.js
│  ├─ index.html
│  └─ styles.css
├─ app.js
├─ package.json
├─ server.js
└─ README.md
```

## Requisitos

- Node.js 18+ (recomendado Node.js 20 en Plesk)
- npm

## Ejecución local

```bash
npm install
npm start
```

Luego abre `http://localhost:3000`.

## Despliegue en Plesk (Node.js)

### 1) Subir archivos
Sube el contenido del proyecto a tu dominio/subdominio en Plesk (por ejemplo, `httpdocs` o una carpeta dedicada para Node).

### 2) Crear aplicación Node.js
1. En Plesk, entra en tu dominio.
2. Abre **Node.js**.
3. Configura:
   - **Document Root**: carpeta raíz del proyecto (donde está `app.js`).
   - **Application Mode**: `production`.
   - **Application Startup File**: `app.js` (recomendado en Passenger/Plesk).

   > `server.js` se incluye para ejecución local/manual, pero en Plesk usa `app.js` para evitar errores de arranque con Passenger.

### 3) Instalar dependencias
Desde la interfaz Node.js en Plesk:
- Pulsa **NPM Install**.

O desde terminal SSH en la carpeta del proyecto:

```bash
npm install --production
```

### 4) Variables y puerto
No necesitas fijar manualmente el puerto; Plesk inyecta `PORT` y `app.js` ya lo usa automáticamente.

### 5) Permisos de escritura para base de datos archivo
Asegúrate de que la carpeta `data/` y el archivo `data/notes.json` tengan permisos de escritura para el usuario de la app Node.js.

### 6) Reiniciar aplicación
En Plesk (pantalla de Node.js), pulsa **Restart App** tras cualquier cambio.

## Notas técnicas

- Backend API:
  - `GET /api/notes`
  - `POST /api/notes`
  - `PUT /api/notes/:id`
  - `DELETE /api/notes/:id`
- Frontend estático servido desde `public/`.
- La persistencia es local por archivo, ideal para proyectos simples o prototipos.

## Mejoras futuras (opcionales)

- Añadir autenticación por usuario.
- Auto-guardado con debounce para reducir escrituras.
- Migrar de JSON a SQLite/PostgreSQL para mayor robustez.

## Solución al error típico de Passenger en Plesk

Si ves un error como:

- `Web application could not be started by the Phusion Passenger application server`

Revisa estos puntos:

1. **Startup file correcto**: en Plesk debe ser `app.js`.
2. **Versión de Node**: usa Node 18+ (ideal Node 20).
3. **Instalación de dependencias**: en este proyecto no hay dependencias externas, por lo que no debería fallar por `npm install`.
4. **Permisos**: `data/` y `data/notes.json` deben ser escribibles por el usuario de la app.
5. **Reinicio y logs**:
   - pulsa **Restart App** en Plesk,
   - abre los logs de Passenger desde Plesk para ver la traza exacta asociada al Error ID.

