/* eslint-disable import/no-duplicates */
import express from 'express'
import path from 'path'
import axios from 'axios'
import cors from 'cors'
import bodyParser from 'body-parser'
import sockjs from 'sockjs'
import cookieParser from 'cookie-parser'
import Html from '../client/html'

const { readFile, writeFile, unlink} = require('fs').promises

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

const saveF = async (users) => {
  const result = await writeFile(`${__dirname}/test.json`, JSON.stringify(users), { encoding: "utf8" }) 
  return result
}

const readF = async () => {
  const result = await readFile(`${__dirname}/test.json`, { encoding: "utf8" })
  .then(data => JSON.parse(data))
  .catch(async () => {  
  const { data: users } = await axios ('https://jsonplaceholder.typicode.com/users') 
  await saveF(users)
  return users  
  })
  return result  
}

server.get('/api/v1/users', async (req, res) => {
  const users = await readF()
  res.json({ users })
})

server.get('/api/v1/users/length', async (req, res) => {
  const users = await readF()
  // const usersLength = users.length
  const newObj = {
    'id' : users[users.length - 1].id + 1
  }
  const newArr = [...users, newObj]
  // await saveF(users)
  res.json({ 'length' : newArr[newArr.length - 1].id })
})

server.delete('/api/v1/users', async (req, res) => {
  await unlink(`${__dirname}/test.json`) 
  res.json({})
})

server.post('/api/v1/users', async (req, res) => {
  const users = await readF()
  const newUser = req.body
  newUser.id = users[users.length - 1].id + 1
  const newArr = [...users, newUser]
  await saveF(newArr)
  res.json({ status: 'success', id: newUser.id })
})

server.patch('/api/v1/users/:userId', async (req, res) => {
  const userId = req.params
  const users = await readF()
  const checkElement = users.map(it => it.id === +userId.userId)
  if(checkElement){
    checkElement.id = +userId.userId
    await saveF(users)
  }
  res.json({ status: 'success', id: +userId.userId })
})

server.delete('/api/v1/users/:userId', async (req, res) => {
  const userId = req.params
  const users = await readF()
  const checkElement = users.filter(it => it.id !== +userId.userId)
  await saveF(checkElement)
  res.json({ status: 'success', id: +userId.userId })
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
