import { Router } from 'itty-router'
import { MongoClient } from 'mongodb'

const router = Router()

const basicAuth = (request) => {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Basic ')) return false

  const [username, password] = atob(auth.split(' ')[1]).split(':')
  return (
    username === LOGIN_USERNAME &&
    password === LOGIN_PASSWORD
  )
}

let db = null
async function getDB() {
  if (db) return db
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  db = client.db('notepad') // use your preferred DB name
  return db
}

router.get('/api/notes', async request => {
  if (!basicAuth(request)) return new Response('Unauthorized', { status: 401 })

  const db = await getDB()
  const notes = await db.collection('notes').find().toArray()
  return Response.json(notes)
})

router.post('/api/notes', async request => {
  if (!basicAuth(request)) return new Response('Unauthorized', { status: 401 })

  const db = await getDB()
  const data = await request.json()

  if (!data.text && !data.imageUrl) return new Response('Bad Request', { status: 400 })

  await db.collection('notes').insertOne({
    text: data.text || '',
    imageUrl: data.imageUrl || '',
    createdAt: new Date()
  })

  return new Response('Note saved', { status: 200 })
})

router.all('*', async () => new Response('Not Found', { status: 404 }))

export default {
  async fetch(request, env, ctx) {
    globalThis.MONGO_URI = env.MONGO_URI
    globalThis.LOGIN_USERNAME = env.LOGIN_USERNAME
    globalThis.LOGIN_PASSWORD = env.LOGIN_PASSWORD

    return router.handle(request)
  }
}
