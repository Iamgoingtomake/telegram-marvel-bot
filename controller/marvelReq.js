var TelegramBot = require('node-telegram-bot-api')
var LanguageTranslatorV3 = require('watson-developer-cloud/language-translator/v3')
var request = require("request")
var crypto = require("crypto")

var token = process.env.TELEGRAM_TOKEN;
var bot = new TelegramBot(token, {
  polling: true
});

var languageTranslator = new LanguageTranslatorV3({
  url: "https://gateway.watsonplatform.net/language-translator/api",
  iam_apikey: "a36rYJmxdq86Ek-HPj8PXH4t8fVAJy5dBFwmwEBNPQij",
  version: "2018-05-01"
});

//pass instructions with /help command

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const instruction = "Escribe /help para tener instrucciones con todo lo que puedes hacer con marvel-bot";

  bot.sendMessage(chatId, instruction,{parse_mode: "HTML"})

});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const instruction_1 = "<strong>Instrucciones:</strong>" + '\n' + "/aboutCharacters personaje: Puedes obtener la biografía de un personaje, también puedes especificar el universo o nombre colocandolo entre parentesis." + '\n\n' + "Ejemplo: /aboutCharacters Spider-man (Ultimate) o /aboutCharacters Venom (Flash Thompson)";
  const instruction_2 = '/getComicsWhere personaje: Obten una lista de algunos comics en los que haya participado un personaje, puedes especificar el universo o nombre en parentesis' + '\n\n' + 'Ejemplo: /getComicsWhere Captain America';
  const instruction_3 = '/getEventInfo evento: Obten información sobre una historia específica, personajes participantes, creadores y comics en donde se aborte dicha historia.' + '\n\n' + 'Ejemplo: /getEventInfo civil war';

  bot.sendMessage(chatId, instruction_1,{parse_mode: "HTML"})
  bot.sendMessage(chatId, instruction_2,{parse_mode: "HTML"})
  bot.sendMessage(chatId, instruction_3,{parse_mode: "HTML"})

});

//get character information (thumbnail, name and description)

bot.onText(/\/aboutCharacters (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const matchString = match[1];

  bot.sendMessage(chatId, 'Buscando...');

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
      } else {
        var thumbnail = res.body.data.results[0].thumbnail.path;
        var extension = res.body.data.results[0].thumbnail.extension;
        var name = res.body.data.results[0].name

        var name_parsed = "<strong>" + name + "</strong>";
        var description = res.body.data.results[0].description;
        var attribution = '\n\n' + res.body.attributionText;

        if (description == "") {
          description = "Biography not found"
        }

        var paramsTranslator = {
          text: description,
          model_id: 'en-es'
        };

        //translate text to spanish with Watson language translator API

        languageTranslator.translate(paramsTranslator, function(err, res) {
          if (err) {
            console.log(err);
          } else {
            var es_description = res.translations[0].translation;

            bot.sendPhoto(chatId, thumbnail + '.' + extension, {
              caption: name_parsed + ": " + es_description + attribution,
              parse_mode: "HTML"
            });

          }
        });
      }

    } else {
      bot.sendMessage(chatId, "No se puede conectar con la API de Marvel Comics")
    }

  })
});

// get comics where a character appear

bot.onText(/\/getComicsWhere (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const matchString = match[1];

  bot.sendMessage(chatId, 'Buscando...');

  // get the character ID, name and thumbnail

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
      } else {
        var charId = res.body.data.results[0].id;
        var thumbnail = res.body.data.results[0].thumbnail.path;
        var extension = res.body.data.results[0].thumbnail.extension;
        var name = res.body.data.results[0].name;

        //var thumbnail_parsed = "<a href='" + thumbnail + "." + extension + "'>" + thumbnail + "." + extension + "</a>" + '\n';
        var name_parsed = "<strong>" + name + "</strong>";
        var attribution = '\n' + res.body.attributionText;

        //the comics api needs a ID character to work, Do two nested requests can be slow

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
            var results = res.body.data.results;
            var titleList = '';
            results.forEach(function(data) {
              titleList += data.title + '\n';
            })

            if(titleList == ""){
              titleList = "No se encontró información sobre comics"
            }

            bot.sendPhoto(chatId, thumbnail + '.' + extension, {
              caption: "Últimos comics en los que ha participado " + name_parsed + ": ",
              parse_mode: "HTML"
            })
              .then(function(){
                bot.sendMessage(chatId, titleList + attribution, {parse_mode: "HTML"})
              })


          } else {
            bot.sendMessage(chatId, "No se puede conectar con la API de Marvel Comics")
          }
        })
      }

    } else {
      bot.sendMessage(chatId, "No se puede conectar con la API de Marvel Comics")
    }

  })

});

// get events thumbnail, description, creators, characters and comics based in event name

bot.onText(/\/getEventInfo (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const matchString = match[1];

  bot.sendMessage(chatId, 'Buscando...');

  request({
    "uri": "https://gateway.marvel.com:443/v1/public/events",
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
      } else {

        var results = res.body.data.results;

        var event_title = '<strong>' + results[0].title + '</strong>';

        var thumbnail = results[0].thumbnail.path;
        var extension = results[0].thumbnail.extension;
        var thumbnail_parsed = "<a href='" + thumbnail + "." + extension + "'>" + thumbnail + "." + extension + "</a>" + '\n';
        var attribution = '\n' + res.body.attributionText;

        var creators = '';
        results[0].creators.items.forEach(function(data) {
          creators += data.name + ', ';
        })

        var characters = '';
        results[0].characters.items.forEach(function(data) {
          characters += data.name + ', ';
        })

        var titleList = ''
        results[0].comics.items.forEach(function(data) {
          titleList += data.name + '\n';
        })

        var description = results[0].description

        if(creators == "") {
          creators = "No se encontró información de los creadores."
        }

        if(characters == ""){
          characters = "No se encontró información de los personajes"
        }

        if(titleList == ""){
          titleList = "No se encontró información sobre comics"
        }

        if (description == "") {
          description = "Description not found"
        }

        var paramsTranslator = {
          text: description,
          model_id: 'en-es'
        };

        //description translation

        languageTranslator.translate(paramsTranslator, function(err, res) {
          if (err) {
            console.log(err);
          } else {
            var es_description = res.translations[0].translation;

            bot.sendPhoto(chatId, thumbnail + '.' + extension, {
              caption: event_title + ": " + es_description,
              parse_mode: "HTML"
            })
              .then(function(){
                bot.sendMessage(chatId,'<strong>Creadores:</strong> ' + creators + '\n\n' + '<strong>Personajes:</strong> ' + characters + '\n\n' + '<strong>Comics Pertenecientes a este evento:</strong>' + '\n' + titleList + '\n' + attribution, {parse_mode: "HTML"})
              })

          }
        });

      }
    } else {
      bot.sendMessage(chatId, "No se puede conectar con la API de Marvel Comics")
    }
  })

});
