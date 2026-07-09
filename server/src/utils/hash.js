const bcrypt = require('bcryptjs');
const config = require('../config');

async function hashPassword(password) {
  return bcrypt.hash(password, config.auth.bcryptRounds);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, verifyPassword };
