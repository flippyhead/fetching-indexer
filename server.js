// Generated by CoffeeScript 1.6.3
var app, crypto, es, express, indexedResponse, monk, users;

crypto = require('crypto');

express = require('express');

monk = require('monk');

app = express();

app.use(express.logger());

app.use(express.urlencoded());

app.use(express.json());

indexedResponse = function(req, res) {
  return function(e, r) {
    var status;
    status = r._version === 1 ? 201 : 200;
    if (e) {
      return res.send(500, e);
    } else {
      return res.send(status, 'Document saved.');
    }
  };
};

es = new require('elasticsearch').Client({
  host: 'localhost:9200'
});

users = monk('localhost:3003/meteor').get('users');

app.post('sessions', function(req, res) {
  var email;
  email = req.body.email;
  return users.findOne({
    'emails.address': email
  }).on('success', function(user) {});
});

app.post('/documents', function(req, res) {
  var body, id, title, updatedAt, url, userId, _ref;
  _ref = req.body, url = _ref.url, title = _ref.title, body = _ref.body, userId = _ref.userId;
  updatedAt = new Date();
  console.log(userId);
  console.log(url);
  id = crypto.createHash('md5').update(url).digest('hex');
  return es.exists({
    index: 'documents',
    type: 'document',
    id: id
  }, function(error, exists) {
    console.log("Indexing " + url);
    if (exists === true) {
      return es.update({
        index: 'documents',
        type: 'document',
        id: id,
        body: {
          doc: {
            body: body,
            title: title,
            userId: userId,
            updatedAt: updatedAt
          }
        }
      }, indexedResponse(req, res));
    } else {
      return es.create({
        index: 'documents',
        type: 'document',
        id: id,
        body: {
          body: body,
          title: title,
          url: url,
          userId: userId,
          updatedAt: updatedAt,
          createdAt: updatedAt
        }
      }, indexedResponse(req, res));
    }
  });
});

app.listen(3000);
