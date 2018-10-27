require('dotenv').load();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var index = require('./routes/index');

var TelegramBot = require('node-telegram-bot-api')
var LanguageTranslatorV3 = require('watson-developer-cloud/language-translator/v3');
var request = require("request")
var crypto = require("crypto")

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500)
    .json({
      status: 'error',
      message: err
    })
});

var token = process.env.TELEGRAM_TOKEN;
var bot = new TelegramBot(token, {
  polling: true
});

bot.onText(/\/aboutCharacters (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const matchString = match[1];

  request({
    "uri": "http://gateway.marvel.com/v1/public/characters",
    "qs": {
      "apikey": process.env.MARVEL_PUBLIC_KEY,
      "hash": crypto.createHash('md5').update(parseInt(Date.now() / 1000, 10) + process.env.MARVEL_PRIVATE_KEY + process.env.MARVEL_PUBLIC_KEY).digest('hex'),
      "ts": parseInt(Date.now() / 1000, 10),
      "nameStartsWith": matchString
    },
    "method": "GET",
    "json": true
  }, (err, res, body) => {
    if (!err) {

      if (res.body.data.results == '') {
        bot.sendMessage(chatId, "No se ha encontrado");
      }

      else {
        var thumbnail = res.body.data.results[0].thumbnail.path;
        var extension = res.body.data.results[0].thumbnail.extension;
        var thumbnail_parsed = "<a href='" + thumbnail + "." + extension + "'>" + thumbnail + "." + extension + "</a>" + '\n';

        var name = "<strong>" + res.body.data.results[0].name + "</strong>";
        var description = res.body.data.results[0].description;

        var attribution = '\n\n' + res.body.attributionText;

        if (description == "") {
          description = "Biography not found"
        }

        var languageTranslator = new LanguageTranslatorV3({
          url: "https://gateway.watsonplatform.net/language-translator/api",
          iam_apikey: "a36rYJmxdq86Ek-HPj8PXH4t8fVAJy5dBFwmwEBNPQij",
          version: "2018-05-01"
        });

        var paramsTranslator = {
          text: description,
          model_id: 'en-es'
        };

        languageTranslator.translate(paramsTranslator, function(err, res) {
          if (err) {
            console.log(err);
          } else {
            var es_description = res.translations[0].translation;

            bot.sendMessage(chatId, thumbnail_parsed + name + ": " + es_description + attribution, {
              parse_mode: "HTML"
            });

          }
        });
      }

    } else {
      self.callback(err, null);
      return;
    }

  })
});

bot.onText(/\/getComicsWhere (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const matchString = match[1];

  request({
    "uri": "http://gateway.marvel.com/v1/public/characters",
    "qs": {
      "apikey": process.env.MARVEL_PUBLIC_KEY,
      "hash": crypto.createHash('md5').update(parseInt(Date.now() / 1000, 10) + process.env.MARVEL_PRIVATE_KEY + process.env.MARVEL_PUBLIC_KEY).digest('hex'),
      "ts": parseInt(Date.now() / 1000, 10),
      "nameStartsWith": matchString
    },
    "method": "GET",
    "json": true
  }, (err, res, body) => {
    if (!err) {

      if (res.body.data.results == '') {
        bot.sendMessage(chatId, "No se ha encontrado");
      }

      else {
        var charId = res.body.data.results[0].id;
        var name = "<strong>" + res.body.data.results[0].name + "</strong>";
        var attribution = '\n' + res.body.attributionText;

        request({
          "uri": "https://gateway.marvel.com/v1/public/comics",
          "qs": {
            "apikey": process.env.MARVEL_PUBLIC_KEY,
            "hash": crypto.createHash('md5').update(parseInt(Date.now() / 1000, 10) + process.env.MARVEL_PRIVATE_KEY + process.env.MARVEL_PUBLIC_KEY).digest('hex'),
            "ts": parseInt(Date.now() / 1000, 10),
            "characters": charId,
            "format": "comic"
          },
          "method": "GET",
          "json": true
        }, (err, res, body) => {
          if (!err) {
            var results = res.body.data.results
            var titleList = '';
            results.forEach(function(data) {
              titleList += "<a href='" + data.urls[0].url + "'>" + data.title + "</a>" + '\n';
            })
            bot.sendMessage(chatId, "Algunos comics en los que ha participado: " + name + '\n\n' + titleList + attribution, {
              parse_mode: "HTML"
            });

          } else {
            self.callback(err, null);
            return;
          }
        })  
      }

    } else {
      self.callback(err, null);
      return;
    }

  })

});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Buscando...');
});


module.exports = app;
