import { createAppContext } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const { app } = createAppContext();
const server = app.listen(env.port, () => {
  logger.info({ port: env.port, env: env.nodeEnv }, 'Earthquake API server started');
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Graceful shutdown initiated');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
