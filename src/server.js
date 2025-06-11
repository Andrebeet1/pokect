import express from 'express';
import webhookRouter from './webhook/webhook.js';
import { PORT } from './config.js';

// (Optionnel) Importer socketService si tu veux activer les websockets
// import './services/socketService.js';

const app = express();

// Middleware pour parser le JSON (plus besoin de body-parser)
app.use(express.json());

// Middleware (optionnel) pour permettre des requêtes CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Webhook Telegram
app.use('/webhook', webhookRouter);

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur Express démarré sur le port ${PORT}`);
});
