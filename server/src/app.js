import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());

// API
app.use('/api', routes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

// Frontend compilado (npm run build)
const CLIENT_DIR = join(import.meta.dir, '../../dist/eetp602/browser');
if (existsSync(CLIENT_DIR)) {
  app.use(express.static(CLIENT_DIR));
  app.get('*', (_req, res) => res.sendFile(join(CLIENT_DIR, 'index.html')));
}

app.use(errorHandler);

export default app;
