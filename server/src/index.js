const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`╔══════════════════════════════════════╗`);
  console.log(`║   الانتقام — Revenge Server v2.0    ║`);
  console.log(`╠══════════════════════════════════════╣`);
  console.log(`║  Port:    ${String(config.port).padEnd(28)}║`);
  console.log(`║  Mode:    ${String(config.nodeEnv).padEnd(28)}║`);
  console.log(`║  API:     http://localhost:${config.port}/api/v1  ║`);
  console.log(`║  Docs:    http://localhost:${config.port}/api/docs ║`);
  console.log(`╚══════════════════════════════════════╝`);
});
