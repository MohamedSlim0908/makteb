import path from 'node:path';
import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL ?? 'postgresql://makteb:makteb_dev@localhost:5432/makteb';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
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
