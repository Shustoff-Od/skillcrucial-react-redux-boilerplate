/* eslint-disable import/no-duplicates */
import express from 'express'
import path from 'path'
import axios from 'axios'
import cors from 'cors'
import bodyParser from 'body-parser'
import sockjs from 'sockjs'
import cookieParser from 'cookie-parser'
import Html from '../client/html'

const { readFile, writeFile, unlink } = require('fs').promises

let connections = []

const port = process.env.PORT || 3000
const server = express()

server.use(cors())

const setHeaders = (req, res, next) => {
  res.set('x-skillcrucial-user', 'b852a34a-a317-4c2d-bc22-e2183c2c25d0')
  res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER') 
  next()
}

server.use(setHeaders)

server.use(express.static(path.resolve(__dirname, '../dist/assets')))
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }))
server.use(bodyParser.json({ limit: '50mb', extended: true }))

server.use(cookieParser())

const readFile = async () => {
  return await readFile(`${__dirname}/test.json`, { encoding: "utf8" })  
  .then(data => { JSON.parse(data) })  
  .catch(async () => {  
  const { data: users } = await axios ('https://jsonplaceholder.typicode.com/users') 
  await saveFile(users)
  return users  
  })  
}

const saveFile = async () => {
  return await writeFile(`${__dirname}/test.json`, JSON.stringify(users), { encoding: "utf8" }) 
}

server.get('/api/v1/users/', async (req, res) => {
  const users = await readFile()
  res.json({ users })
})

server.post('/api/v1/users/', async (req, res) => {
  const newUser = req.body
  res.json({ users })
})

server.delete('/api/v1/users/', async (req, res) => {
  await unlink(`${__dirname}/test.json`) 
  res.json({ users })
})

server.patch('/api/v1/users/:userId', async (req, res) => {
  res.json({ users })
})

server.delete('/api/v1/users/:userId', async (req, res) => {
  res.json({ users })
})

server.use('/api/', (req, res) => {
  res.status(404)
  res.end()
})

const echo = sockjs.createServer()
echo.on('connection', (conn) => {
  connections.push(conn)
  conn.on('data', async () => {})

  conn.on('close', () => {
    connections = connections.filter((c) => c.readyState !== 3)
  })
})

server.get('/', (req, res) => {
  // const body = renderToString(<Root />);
  const title = 'Server side Rendering'
  res.send(
    Html({
      body: '',
      title
    })
  )
})

server.get('/*', (req, res) => {
  const initialState = {
    location: req.url
  }

  return res.send(
    Html({
      body: '',
      initialState
    })
  )
})

const app = server.listen(port)

echo.installHandlers(app, { prefix: '/ws' })

// eslint-disable-next-line no-console
console.log(`Serving at http://localhost:${port}`)
