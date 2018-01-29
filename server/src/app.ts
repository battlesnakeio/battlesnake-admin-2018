import express = require('express')
import passportGithub = require('passport-github')
import passport = require('passport')
import session = require('express-session')
import RedisStore = require('connect-redis')
import { ensureAuthenticated } from './passport-auth'

const Store = RedisStore(session);
const redisHost = process.env.REDIS_HOST || 'localhost'

// Need to setup sessions
const app = express()
app.use(session({
  secret: 'fi5e',
  store: new Store({
    host: redisHost,
    port: '6379'
  }),
  resave: true,
  saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/auth/github', passport.authenticate('github'))

app.get('/', (req, res) => {
  res.send('Hello World!')

  var redis = require('redis');
  console.log("connecting to redis")
  var client = redis.createClient({
    host: redisHost,
    port: '6379'
  })
  console.log("redis set")
  client.set("string key", "string val", redis.print)
  console.log("redis get")
  client.get("string key", redis.print)
  console.log("redis test complete")
})

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
  console.log('authenticated')
  res.redirect('/protected')
})

app.get('/protected', ensureAuthenticated, (req, res) => {
  res.send('Congrats, sessions work')
})

export default app