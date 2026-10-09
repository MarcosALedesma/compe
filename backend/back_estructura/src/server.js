import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`🚀 API EETP 602 en http://localhost:${env.PORT}/api`);
});