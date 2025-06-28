import { Router } from 'itty-router'
import { MongoClient } from 'mongodb'

const router = Router()

const auth = request => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Basic ')) return false
  const [user, pass] = atob(authHeader.split(' ')[1]).split(':')
  return user === LOGIN_USERNAME && pass === LOGIN_PASSWORD
}

let db = null
async function getDB() {
  if (!db) {
    const client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db('notepad')
  }
  return db
}

router.get('/api/notes', async request => {
  if (!auth(request)) return new Response('Unauthorized', { status: 401 })
  const db = await getDB()
  const notes = await db.collection('notes').find().toArray()
  return Response.json(notes)
})

router.post('/api/notes', async request => {
  if (!auth(request)) return new Response('Unauthorized', { status: 401 })
  const db = await getDB()
  const { text, imageUrl } = await request.json()
  if (!text && !imageUrl) return new Response('Bad Request', { status: 400 })
  await db.collection('notes').insertOne({ text, imageUrl, createdAt: new Date() })
  return new Response('Note saved')
})

export default {
  async fetch(request, env, ctx) {
    globalThis.MONGO_URI = env.MONGO_URI
    globalThis.LOGIN_USERNAME = env.LOGIN_USERNAME
    globalThis.LOGIN_PASSWORD = env.LOGIN_PASSWORD
    return router.handle(request)
  }
}
