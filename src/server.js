import express from 'express';
import webhookRouter from './webhook/webhook.js';
import { PORT } from './config.js';

const app = express();

// 🔧 Middleware JSON
app.use(express.json());

// 🌍 Middleware CORS (optionnel mais recommandé)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// 📄 Route d'accueil
app.get('/', (req, res) => {
  res.send('🤖 Bot Telegram actif !');
});

// 📩 Webhook Telegram
app.use('/webhook', webhookRouter);

// 🚀 Lancer le serveur
const port = PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur Express démarré sur le port ${port}`);
});

// 🛑 Gestion des erreurs non prises en charge
process.on('uncaughtException', (err) => {
  console.error('❌ Erreur non interceptée :', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rejet de promesse non géré :', reason);
});
