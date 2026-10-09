import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`EETP 602 -> http://localhost:${env.PORT}  (API en /api)`);
});
