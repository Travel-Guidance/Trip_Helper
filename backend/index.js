require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { swaggerUi, swaggerSpec } = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');

const flightRoutes = require('./routes/flightRoutes');
const orderRoutes = require('./routes/orderRoutes');
const seatRoutes = require('./routes/seatRoutes');
const popularRoutes = require('./routes/popularRoutes');
const esimRoutes = require('./routes/esimRoutes');

const app = express();
// app.use(cors()) // 로컬 개발용 (전체 허용)
app.use(cors({ origin: 'https://travel-generation-ten.vercel.app' })) // 배포용
app.use(express.json());
app.use(morgan('dev'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', flightRoutes);
app.use('/api', orderRoutes);
app.use('/api', seatRoutes);
app.use('/api', popularRoutes);
app.use('/api', esimRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server:  http://localhost:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});

process.stdin.resume();
