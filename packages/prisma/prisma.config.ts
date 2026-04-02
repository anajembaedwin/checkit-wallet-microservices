import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
  },
  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});