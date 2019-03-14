var emubot = require('./bot');
const emuji = require("./emuji-functions")

var emubot = new emubot();

emubot.name("Emu")
emubot.keywords("emu")
emubot.default_reply("...")
emubot.log("Log test: emu");
emubot.rating("PG-13")
emubot.gif()
emubot.sticker()
emubot.log(emuji.react("shop"))
emubot.play()

//goatbot.odds(".25")
emubot.reply()
