import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_TOKEN, WEBHOOK_URL } from './config.js';

const bot = new TelegramBot(TELEGRAM_TOKEN);
bot.setWebHook(`${WEBHOOK_URL}`);

export default bot; // ✅ export par défaut

