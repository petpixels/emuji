// When it says secret, it really kind of means secret...
// so let's put it right at the top of this file here
const emuji_secret = require("./emuji-secret")
const bot_secret_token = emuji_secret.bot_secret_token

const Discord = require('discord.js')
const client = new Discord.Client()

const emuji = require("./emuji-functions")
const emujiUserID = "Emuji#8780"

// channels (probably shouldn't be hardcoded)
// maybe create a clever algorithm that searches for a channel named emuji
const chan_emuji = "552238617926303750"

const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const fs = require('fs');
const path = require('path');
const request = require('request');

const env = process.env.NODE_ENV || 'development';
const logDir = 'logs';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) { fs.mkdirSync(logDir); }

// const filename = path.join(logDir, 'emuji.log');
const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: `${logDir}/emuji-%DATE%.log`,
  datePattern: 'YYYY-MM-DD'
});

const logger = createLogger({
  // change level if in dev environment versus production
  level: env === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console({
      level: 'info',
      format: format.combine(
        format.colorize(),
        format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
    dailyRotateFileTransport
    //new transports.File({ filename })
  ]
});

process.on('uncaughtException', function(err) {
  logger.debug(err)

  // set discord client "now playing"
  // client.user.setActivity(emuji.play("Dead"))
});

client.on('ready', () => {
  var emujiChannel = client.channels.get(chan_emuji)
  var sayHello = "SQUAWK"
  logger.info("Connected as " + client.user.tag)

  // set discord client "now playing"
  var startPlaying = sayHello;
  client.user.setActivity(sayHello)
  logger.info("Now playing " + sayHello)

  console.log("Servers:")
  client.guilds.forEach((guild) => {
      console.log(" - " + guild.name)

      // List all channels
      guild.channels.forEach((channel) => {
          console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
      })
  })
})

// Reply to messages
client.on('message', (receivedMessage) => {
  var replyRequired = false
  var suppressOutput = false;

  // Prevent bot from responding to its own messages
  if (receivedMessage.author == client.user) { return } // catch and release

  var msg = receivedMessage.content;

  // React to all messages and log each reaction
  var emuEmoji = emuji.react(receivedMessage.content)
  if (emuEmoji) {
    for (var i = 0; i < emuEmoji.length; i++) {
      logger.info("Reacted to: <" + receivedMessage.channel.id + "> " + receivedMessage.content + " with emoji " + emuEmoji[i])
      receivedMessage.react(emuEmoji[i])
    }
  }

  // Check if the bot's user was tagged in the message
  // Always reply to messages from any channel
  if (receivedMessage.isMentioned(client.user)) {
    var silent = false

    // Get acknowledgement message from catbot
    var direct_input = receivedMessage.content.toLowerCase()
    var direct_output = "..."

    // Log acknowledgement message
    logger.info("Tagged message received from " + receivedMessage.author.toString() + ": " + receivedMessage.content)

    var msg = receivedMessage.content;

    // Really need to modularize this function...
    if (msg.toLowerCase().includes("!gif")) {
      silent = true

      // build URL query
      // double iteration has got to be a bad idea
      // but if it's stupid and it works it's not stupid
      var gifRating = "R"
      var aGif = msg.split(" ") // because it's not lowercase
      var gifTag = "emu" // cat or kitten
      var gifLoc = 0
      for (var i = 0; i < aGif.length; i++) {
        if (aGif[i] == "!gif") {
          gifLoc = i+1
        }
      }

      for (var i = gifLoc; i < aGif.length; i++) {
        gifTag = gifTag + "%20" + aGif[i]
      }

      var url = "https://api.giphy.com/v1/gifs/random?api_key=9nbVwPCSeiP6Hh17oPJkMCRnYpA99FUO&tag=" + gifTag + "&rating=" + gifRating;
      logger.info("Giphy request URL: " + url)

      request.get({
        url: url,
        json: true,
        headers: {'User-Agent': 'request'}
      }, (err, res, data) => {
        if (err) {
          logger.info("Giphy request failed")
        } else if (res.statusCode !== 200) {
          logger.info("Giphy request succeeded")
        } else {
          // data is already parsed as JSON:
          var received = data
          // loop through each data object because there can be more than one
          for (var data in received) {
            var giphy = received[data];
            receivedMessage.channel.send(giphy.embed_url)
            logger.info("<" + receivedMessage.channel.id + "> @catbot: " + giphy.embed_url)

            // suppress output because the gif is the output
            suppressOutput = true
            // console.log(data+": "+received[data]);
          }

        }
      });
    }

    var retString = "...";
    var retSquawk = "SQUAWK!"

    // 5% chance to randomly squawk
    var randSquawk = Math.random()
    if (randSquawk < .05) {
      retString = retSquawk
    }

    if (!(suppressOutput)) {
      receivedMessage.channel.send(retString)
    } else {
      // squawk even if output is suppressed
      // this can only happen when you request a gif
      if (retString == retSquawk) {
        receivedMessage.channel.send(retString)
      }
    }

    logger.info("<" + receivedMessage.channel.id + "> @emuji: " + retString)

  }
})

client.login(bot_secret_token)
