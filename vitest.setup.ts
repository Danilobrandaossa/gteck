import 'dotenv/config'
import { randomUUID } from 'node:crypto'

// @ts-expect-error FIX_BUILD: Suppressing error to allow build
beforeAll(() => {
  process.env.NEXTAUTH_SECRET ??= 'test-secret'
  process.env.OPENAI_API_KEY ??= 'sk-mock-test'
  process.env.DATABASE_URL ??= `file:./test-${randomUUID()}.db`
})


