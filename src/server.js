import express from 'express';
import webhookRouter from './webhook/webhook.js';
import { PORT } from './config.js';

const app = express();

// Middleware JSON
app.use(express.json());

// Middleware CORS (optionnel mais recommandé)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Route d'accueil (GET /)
app.get('/', (req, res) => {
  res.send('🤖 Bot Telegram actif !');
});

// Webhook Telegram
app.use('/webhook', webhookRouter);

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur Express démarré sur le port ${PORT}`);
});
