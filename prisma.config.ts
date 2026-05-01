import { config } from 'dotenv'
config()                                    // load .env
config({ path: '.env.local', override: true }) // .env.local wins, like Next.js
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: env('DIRECT_DATABASE_URL'),
  },
})