import express from 'express';
import { handleUpdate } from '../controllers/marketController.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    await handleUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error('Erreur webhook:', e);
    res.sendStatus(500);
  }
});

export default router;
