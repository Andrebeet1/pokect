import dotenv from 'dotenv';
dotenv.config();

export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const WEBHOOK_URL = process.env.WEBHOOK_URL;
export const PORT = process.env.PORT || 3000;
