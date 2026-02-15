const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { URL } = require('url');

const DB_PATH = path.join(__dirname, 'data', 'notes.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

async function ensureDatabase() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, '[]\n', 'utf8');
  }
}

async function readNotes() {
  await ensureDatabase();
  const raw = await fs.readFile(DB_PATH, 'utf8');
  return JSON.parse(raw || '[]');
}

async function writeNotes(notes) {
  await fs.writeFile(DB_PATH, `${JSON.stringify(notes, null, 2)}\n`, 'utf8');
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function sendNoContent(res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end();
}

async function parseRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  const body = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(body);
}

function safeNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

async function serveStatic(res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const normalized = path.normalize(requested).replace(/^\.+/, '');
  const fullPath = path.join(PUBLIC_DIR, normalized);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { message: 'Acceso denegado.' });
    return;
  }

  try {
    const data = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    try {
      const indexData = await fs.readFile(path.join(PUBLIC_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
      res.end(indexData);
    } catch {
      sendJson(res, 404, { message: 'Archivo no encontrado.' });
    }
  }
}

function createRequestHandler() {
  return async (req, res) => {
    let reqUrl;
    try {
      reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    } catch {
      return sendJson(res, 400, { message: 'URL inválida.' });
    }

    const { pathname } = reqUrl;

    if (req.method === 'OPTIONS') {
      return sendNoContent(res);
    }

    if (pathname === '/api/notes' && req.method === 'GET') {
      try {
        const notes = await readNotes();
        return sendJson(res, 200, notes);
      } catch (error) {
        return sendJson(res, 500, { message: 'No se pudieron cargar las notas.', error: error.message });
      }
    }

    if (pathname === '/api/notes' && req.method === 'POST') {
      try {
        const notes = await readNotes();
        const body = await parseRequestBody(req);
        const note = {
          id: generateId(),
          text: typeof body.text === 'string' ? body.text : '',
          color: typeof body.color === 'string' ? body.color : '#fde68a',
          x: safeNumber(body.x, 40),
          y: safeNumber(body.y, 40),
          width: safeNumber(body.width, 260),
          height: safeNumber(body.height, 220),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        notes.push(note);
        await writeNotes(notes);
        return sendJson(res, 201, note);
      } catch (error) {
        return sendJson(res, 500, { message: 'No se pudo crear la nota.', error: error.message });
      }
    }

    if (pathname.startsWith('/api/notes/') && req.method === 'PUT') {
      try {
        const id = pathname.split('/').pop();
        const body = await parseRequestBody(req);
        const notes = await readNotes();
        const index = notes.findIndex((note) => note.id === id);

        if (index === -1) {
          return sendJson(res, 404, { message: 'Nota no encontrada.' });
        }

        const current = notes[index];
        const updated = {
          ...current,
          text: typeof body.text === 'string' ? body.text : current.text,
          color: typeof body.color === 'string' ? body.color : current.color,
          x: safeNumber(body.x, current.x),
          y: safeNumber(body.y, current.y),
          width: safeNumber(body.width, current.width),
          height: safeNumber(body.height, current.height),
          updatedAt: new Date().toISOString()
        };

        notes[index] = updated;
        await writeNotes(notes);
        return sendJson(res, 200, updated);
      } catch (error) {
        return sendJson(res, 500, { message: 'No se pudo actualizar la nota.', error: error.message });
      }
    }

    if (pathname.startsWith('/api/notes/') && req.method === 'DELETE') {
      try {
        const id = pathname.split('/').pop();
        const notes = await readNotes();
        const filtered = notes.filter((note) => note.id !== id);

        if (filtered.length === notes.length) {
          return sendJson(res, 404, { message: 'Nota no encontrada.' });
        }

        await writeNotes(filtered);
        return sendNoContent(res);
      } catch (error) {
        return sendJson(res, 500, { message: 'No se pudo eliminar la nota.', error: error.message });
      }
    }

    return serveStatic(res, pathname);
  };
}

function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const server = http.createServer(createRequestHandler());
  server.listen(port, '0.0.0.0', () => {
    console.log(`Servidor iniciado en puerto ${port}`);
  });
  return server;
}

module.exports = {
  createRequestHandler,
  startServer
};

if (require.main === module) {
  startServer();
}
