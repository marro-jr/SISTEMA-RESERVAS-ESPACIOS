require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('=================================================');
  console.log(`Servidor ejecutandose en: http://localhost:${PORT}`);
  console.log(`API REST disponible en: http://localhost:${PORT}/api`);
  console.log(`Frontend disponible en: http://localhost:${PORT}`);
  console.log('=================================================');
});
