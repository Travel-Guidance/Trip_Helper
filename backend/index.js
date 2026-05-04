require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { swaggerUi, swaggerSpec } = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');
const apiRoutes = require('./routes');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', apiRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const BASE = process.env.BACKEND_URL || `http://localhost:${PORT}`;
  console.log(`Server:  ${BASE}`);
  console.log(`Swagger: ${BASE}/api-docs`);
});

process.stdin.resume();
