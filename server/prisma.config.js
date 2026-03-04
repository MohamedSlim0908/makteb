import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbUrl = process.env.DATABASE_URL ?? 'postgresql://makteb:makteb_dev@localhost:5432/makteb';

export default defineConfig({
  earlyAccess: true,
  schema: join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: dbUrl,
  },
  migrate: {
    async development() {
      return { url: dbUrl };
    },
    async production() {
      return { url: dbUrl };
    },
  },
});
