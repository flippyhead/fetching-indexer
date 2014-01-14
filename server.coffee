crypto = require 'crypto'
express = require 'express'
monk = require 'monk'

app = express()
app.use express.logger()
app.use express.urlencoded()
app.use express.json()

indexedResponse = (req, res) ->
  (e, r) ->
    if e
      console.error e
      res.send 500, e
    else
      res.send (if r._version is 1 then 201 else 200), 'Document saved.'

es = new require('elasticsearch').Client
  host: 'localhost:9200', log: 'trace'

users = monk('localhost:3003/meteor').get('users')

app.post '/documents', (req, res) ->
  {url, title, body, token} = req.body
  updatedAt = new Date()

  users.findOne('services.resume.loginTokens.token': token)
    .on 'success', (user) ->
      userId = user._id

      es.search
        index: userId
        type: 'document'
        body:
          query:
            term:
              "url.lookup": url
      , (error, response) ->

        console.log "Indexing " + url

        if response.hits?.total > 0
          first = response.hits.hits[0]

          es.update
            index: userId
            type: 'document'
            id: first._id
            body:
              doc:
                {body, title, updatedAt}
          , indexedResponse(req, res)

        else
          es.create
            index: userId
            type: 'document'
            body:
              {body, title, url, userId, updatedAt, createdAt: updatedAt}
          , indexedResponse(req, res)

app.listen 3000