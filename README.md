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
   - **Document Root**: carpeta raíz del proyecto (donde está `server.js`).
   - **Application Mode**: `production`.
   - **Application Startup File**: `server.js`.

### 3) Instalar dependencias
Desde la interfaz Node.js en Plesk:
- Pulsa **NPM Install**.

O desde terminal SSH en la carpeta del proyecto:

```bash
npm install --production
```

### 4) Variables y puerto
No necesitas fijar manualmente el puerto; Plesk inyecta `PORT` y `server.js` ya lo usa automáticamente.

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
