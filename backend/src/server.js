import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`La super duper API EETP 602 es http://localhost:${env.PORT}/api`);
});