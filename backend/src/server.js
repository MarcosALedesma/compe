const app = require('./app');
const { port } = require('./config/env');
require('./config/db'); // crea tablas si no existen
app.listen(port, () => console.log(`API en http://localhost:${port}/api`));
