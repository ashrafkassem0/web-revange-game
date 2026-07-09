const { z } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    try {
      req.validated = schema.parse(req.body);
      next();
    } catch (e) {
      if (e instanceof z.ZodError) {
        const errors = e.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({ error: 'بيانات غير صالحة', details: errors });
      }
      next(e);
    }
  };
}

module.exports = { validate };
