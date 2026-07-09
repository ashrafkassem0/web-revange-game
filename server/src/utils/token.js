const jwt = require('jsonwebtoken');
const config = require('../config');

function generateToken(userId, username) {
  return jwt.sign(
    { sub: userId, username },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { generateToken, verifyToken };
