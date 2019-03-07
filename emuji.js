const bot_secret = require('./lib/bot-secret')
var emubot = require('./lib/bot');

var emuji = require('./lib/emuji-functions');
const fs = require('fs')

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
	emu.default_reply("...")
  emu.keywords("emu")
  emu.rating("G")

	emuji.load_dictionary()

  // set discord client "now playing"
  client.user.setActivity(emu.play())

  // send greeting to channel
  //emu.reply(emuChannel, msg="")

})

// Reply to messages
client.on('message', (receivedMessage) => {
  var replyRequired = false
  var silent = false;

  // Prevent bot from responding to its own messages
  if (receivedMessage.author == client.user) { return } // catch and release

  var msg = receivedMessage.content;
  emu.log(receivedMessage.channel + msg)

	if (receivedMessage.content.includes("emu")) {
		receivedMessage.react("🐤")
	}

	// React to all messages and log each reaction
	var emuEmoji = emuji.react(receivedMessage.content)
	console.log(emuEmoji)

	if (emuEmoji) {
		for (var i = 0; i < emuEmoji.length; i++) {
			console.log(i)
			emu.log(receivedMessage.channel + msg)
			emu.log("@emuji reacted with " + emuEmoji[i])
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
    var msg = receivedMessage.content.toLowerCase();

    // Really need to modularize this function... (Done!)
    if (msg.includes("!gif")) {
      silent = true
      emu.gif(receivedMessage.channel, msg);
    }

    if (msg.includes("!sticker")) {
      silent = true
      emu.sticker(receivedMessage.channel, msg);
    }

		if (msg.includes("!learn")) {
			var aCommand = msg.split(" ") // because it's not lowercase
      var tmpCommand = ""
      var commandLoc = 0

			//var emujis = fs.readFileSync(fileEmojis).toString().split("\n")
			// double iteration has got to be a bad idea
			// but if it's stupid and it works it's not stupid
			for (var i = 0; i < aCommand.length; i++) {
				if (aCommand[i] == "!learn") {
					commandLoc = i + 1
				}
			}

			// get command
			for (var i = commandLoc; i < aCommand.length; i++) {
				tmpCommand = tmpCommand + "," + aCommand[i]
			}

			// replace any remaining spaces with commas and split on comma
			var cmdSplit = tmpCommand.replace(" ",",").split(",")
			console.log(tmpCommand.replace(" ",","))
			var learnEmoji = cmdSplit[1] // first item should be an emoji
			var learnDefine = ""

			console.log("learnEmoji: " + learnEmoji)

			// build string, skipping first item
			for (var i = 2; i < cmdSplit.length; i++) {
				// equals sign is optional in the command so ignore it
				if (cmdSplit[i] != "=") {
					// build comma separated definition string
					learnDefine = learnDefine + "," + cmdSplit[i]
				}
			}

			learnDefine = learnDefine.substring(1) // remove first comma
			var learnFile = "./logs/emoji-learn.txt"
			//if (!fs.existsSync(learnFile)) { fs.mkdirSync(learnFile) }

			fs.appendFileSync(learnFile, learnEmoji + "\t" + learnDefine + "\n");
			emu.log("learned that " + learnEmoji + " = " + learnDefine)

			receivedMessage.channel.send("Emubot learned that " + learnEmoji + " = " + learnDefine)
		}

		if ((msg.includes("!refresh")) || (msg.toLowerCase().includes("!reload"))) {
      silent = true
      emuji.load_dictionary();
    }

    if (!(silent)) {
      emu.reply(receivedMessage.channel, receivedMessage.content)
    }
  } else {


	}
})

client.login(bot_secret.bot_secret_token)
