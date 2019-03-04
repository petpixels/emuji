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
/*
process.on('uncaughtException', function(err) {
  logger.debug(err)

  // set discord client "now playing"
  client.user.setActivity(emuji.play("Dead"))
});
*/
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

  if (receivedMessage.channel.id == chan_emuji) {
    var msg = receivedMessage.content;

    // React to messages outside of the emuji channel
    // This should probably be a different bot.
    var emuEmoji = emuji.react(receivedMessage.content)
    if (emuEmoji) {
      for (var i = 0; i < emuEmoji.length; i++) {
        logger.info("Reacted to: <" + receivedMessage.channel.id + "> " + receivedMessage.content + " with emoji " + emuEmoji[i])
        receivedMessage.react(emuEmoji[i])
      }
    }
  }

  // console.log(receivedMessage.channel.id)
})

client.login(bot_secret_token)
