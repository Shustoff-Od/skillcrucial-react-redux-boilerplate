/* eslint-disable import/no-duplicates */
import express from 'express'
import path from 'path'
import axios from 'axios'
import cors from 'cors'
import bodyParser from 'body-parser'
import sockjs from 'sockjs'
// const { readFile, writeFile, stat, unlink } = require("fs").promises;
import cookieParser from 'cookie-parser'
import Html from '../client/html'

let connections = []

const port = process.env.PORT || 3000
const server = express()

server.use(cors())

const setHeaders = (req, res, next) => {
  res.set('x-skillcrucial-user', 'b852a34a-a317-4c2d-bc22-e2183c2c25d0')
  res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER') 
  return next()
}

server.use(setHeaders)

server.use(express.static(path.resolve(__dirname, '../dist/assets')))
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }))
server.use(bodyParser.json({ limit: '50mb', extended: true }))

server.use(cookieParser())

server.get('/api/v1/users/take/:number', async (req, res) => {
  const { number } = req.params

  const { data: users } = await axios('https://jsonplaceholder.typicode.com/users')
  const result = users.slice(0, +number)
  res.json({ result })
})

server.get('/api/v1/users/:name', (req, res) => {
  const { name } = req.params
  res.json({ name })
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
