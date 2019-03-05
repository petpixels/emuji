const bot_secret = require('./lib/bot-secret')
var emubot = require('./lib/bot');

var emuji = require('./lib/emuji-functions');

const discord = require('discord.js')
const client = new discord.Client()

// const emuji = require("./emuji-functions")
const emujiUserID = "Emuji#8780"

// channels (probably shouldn't be hardcoded)
// maybe create a clever algorithm that searches for a channel named emu
const chan_emu = "552238617926303750"

var emu = new emubot()

process.on('uncaughtException', function(err) {
  emu.log(err)
  console.log(err)
  // set discord client "now playing"
  // client.user.setActivity(emuji.play("Dead"))
});

client.on('ready', () => {
  var emuChannel = client.channels.get(chan_emu)
  emu.log("Connected as " + client.user.tag)

  emu.name("Emu")
  emu.keywords("emu")
  emu.default_reply("...")
  emu.rating("G")

  // set discord client "now playing"
  client.user.setActivity(emu.play())

  // send greeting to channel
  emu.reply(emuChannel, msg="")

})

// Reply to messages
client.on('message', (receivedMessage) => {
  var replyRequired = false
  var silent = false;

  // Prevent bot from responding to its own messages
  if (receivedMessage.author == client.user) { return } // catch and release

  var msg = receivedMessage.content;
  emu.log(receivedMessage.channel + msg)

  // React to all messages and log each reaction
  var emuEmoji = emuji.react(receivedMessage.content)
  if (emuEmoji) {
    for (var i = 0; i < emuEmoji.length; i++) {
      receivedMessage.react(emuEmoji[i])
    }
  }

  // Check if the bot's user was tagged in the message
  // Always reply to messages from any channel
  if (receivedMessage.isMentioned(client.user)) {
    // Get acknowledgement message from catbot
    var direct_input = receivedMessage.content.toLowerCase()
    var direct_output = "..."

    // Log acknowledgement message
    var msg = receivedMessage.content;

    // Really need to modularize this function... (Done!)
    if (msg.toLowerCase().includes("!gif")) {
      silent = true
      emu.gif(receivedMessage.channel, msg);
    }

    if (msg.toLowerCase().includes("!sticker")) {
      silent = true
      emu.sticker(receivedMessage.channel, msg);
    }

    if (!(silent)) {
      emu.reply(receivedMessage.channel, receivedMessage.content)
    }
  }
})

client.login(bot_secret.bot_secret_token)
