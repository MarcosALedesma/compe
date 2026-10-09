const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { corsOrigin } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: corsOrigin.split(',') }));
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
