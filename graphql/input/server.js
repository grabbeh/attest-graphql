import express from 'express'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import { formatError } from 'apollo-errors'
import bodyParser from 'body-parser'
import schema from './schemas/schema'
import jwt from 'jsonwebtoken'
import SECRET from '../../config/jwt-secret.js'
import mongoose from 'mongoose'
mongoose.Promise = require('bluebird')

const GRAPHQL_PORT = 8000
const server = express()
const db = require('../../config/db.js')

try {
  mongoose.connect(db, { useMongoClient: true })
} catch (error) {
  console.log(error)
}

const addUser = async (req, res) => {
  let token = req.headers['authorization'] || null
  if (token === undefined) {
    token = null
  }
  // FIREFOX HEADERS ARE 'UNDEFINED' WHEN LOGGED OUT. CHROME IS JUST EMPTY
  req.user = null
  try {
    const { user } = await jwt.verify(token, SECRET)
    req.user = user
    // ADD FULL USER INFORMATION TO SESSION THROUGH DB CALL?
  } catch (error) {}

  req.next()
}

server.use(addUser)
server.use(
  '/graphql',
  bodyParser.json(),
  graphqlExpress(req => ({
    formatError,
    schema,
    context: {
      SECRET,
      user: req.user
    }
  }))
)
server.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))
server.listen(GRAPHQL_PORT)
