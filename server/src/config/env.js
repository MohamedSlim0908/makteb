import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Charger .env à la racine du projet (documenté dans PROJECT.md)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // permet aussi un .env dans server/ pour override

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  // En dev, accepter aussi le client sur d'autres ports (ex. 5174 si 5173 est pris)
  clientUrls: process.env.CLIENT_URL
    ? [process.env.CLIENT_URL]
    : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],

  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  jwtAccessExpiry: '15m',
  jwtRefreshExpiry: '7d',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
  },

  flouci: {
    appToken: process.env.FLOUCI_APP_TOKEN || '',
    appSecret: process.env.FLOUCI_APP_SECRET || '',
  },
  konnect: {
    apiKey: process.env.KONNECT_API_KEY || '',
  },
};
