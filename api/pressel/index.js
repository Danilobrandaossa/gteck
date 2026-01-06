const express = require('express');
const convertRouter = require('./convert');
const createRouter = require('./create');

const router = express.Router();

// Montar rotas
router.use('/convert', convertRouter);
router.use('/create', createRouter);

// Rota principal para listar funcionalidades
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Pressel Automation API',
    endpoints: {
      convert: 'POST /api/pressel/convert',
      create: 'POST /api/pressel/create',
      models: 'GET /api/pressel/models',
      sites: 'GET /api/pressel/sites'
    },
    description: 'API para integração com Pressel Automation - criação automática de páginas WordPress'
  });
});

module.exports = router;

