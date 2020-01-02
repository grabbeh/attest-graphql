import express from 'express'
import { ApolloServer, gql } from 'apollo-server-express'
import resolvers from './resolvers'
import typeDefs from './schemas/schema'
import { formatError } from 'apollo-errors'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import SECRET from '../../config/jwt-secret.js'
import mongoose from 'mongoose'
import { User } from './connectors'
mongoose.Promise = require('bluebird')

const GRAPHQL_PORT = 8000
const app = express()
const db = require('../../config/db.js')

try {
  mongoose.connect(db)
} catch (error) {
  console.log(error)
}

const checkForUser = async authorisationHeader => {
  // FIREFOX HEADERS ARE 'UNDEFINED' WHEN LOGGED OUT. CHROME IS JUST EMPTY SO DO A CHECK FOR BOTH
  let token = authorisationHeader || null
  if (token === undefined) {
    token = null
  }
  if (token) {
    try {
      // is string when derived from token but not when from DB which causes issues with filter
      const { user } = jwt.verify(token, SECRET)
      let fullUser = await User.findById(user._id)
      return fullUser
    } catch (error) {
      console.log(error)
      return {}
    }
  } else {
    return null
  }
}

app.use('*', bodyParser.json())

const server = new ApolloServer({
  resolvers,
  typeDefs,
  context: async integrationContext => {
    return {
      user: await checkForUser(integrationContext.req.headers['authorization'])
    }
  }
})

server.applyMiddleware({ app, path: '/graphql' })
app.listen(GRAPHQL_PORT)
