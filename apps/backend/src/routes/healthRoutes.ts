import { Router } from 'express';
import type { HealthController } from '../controllers/HealthController.js';

export function createHealthRoutes(controller: HealthController): Router {
  const router = Router();
  router.get('/', controller.getHealth);
  return router;
}
