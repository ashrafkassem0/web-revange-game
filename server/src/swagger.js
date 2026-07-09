const path = require('path');
const swaggerUi = require('swagger-ui-express');
const openApiSpec = require('../docs/openapi.json');

function setupSwagger(app) {
  app.get('/api/docs/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'Revenge API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  }));
}

module.exports = setupSwagger;
