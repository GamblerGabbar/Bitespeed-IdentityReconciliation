// src/routes/index.ts
import { Router } from 'express';
import { identify } from '../controllers/identifyController';

const router = Router();

router.post('/identify', identify);

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Bitespeed Identity Reconciliation'
  });
});

router.get('/', (req, res) => {
  res.json({
    message: 'Bitespeed Identity Reconciliation Service',
    version: '1.0.0',
    endpoints: {
      identify: 'POST /identify',
      health: 'GET /health'
    }
  });
});

router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

export default router;