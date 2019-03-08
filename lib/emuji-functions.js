const fs = require('fs')
var emuji_library = []

const { createLogger, format, transports } = require('winston')
const env = process.env.NODE_ENV || 'development'

require('winston-daily-rotate-file')

const conf_dir = "conf" // log directory
const log_dir = "logs" // log directory
const log_file = "emuji"
const default_dictionary_file = "emuji" // log file name

// Create the log & conf directories if it does not exist
if (!fs.existsSync(log_dir)) { fs.mkdirSync(log_dir) }
if (!fs.existsSync(conf_dir)) { fs.mkdirSync(conf_dir) }

// const filename = path.join(log_dir, 'emuji.log')
const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: `${log_dir}/${log_file}-%DATE%.log`,
  datePattern: 'YYYY-MM-DD'
})

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
})

module.exports = {
	load_dictionary: function(file) {
		var dictionary_file = file
		var dictionary = []
		var retString

		if (dictionary_file) {
			dictionary_file = file
		} else {
			dictionary_file = conf_dir + "/" + default_dictionary_file + ".txt"
		}

		var fileEmojis = dictionary_file

	  var emujis = fs.readFileSync(fileEmojis).toString().split("\n")
		emuji_library = emujis // save to global

		logger.info("@emuji: dictionary file loaded (" + dictionary_file + ")")
	},
	react: function(input) {
		var msg = input.toLowerCase()
		var fuzz = Math.random()
    var emoji = []
		var output_array = []

    if (msg && (!(msg === undefined)) && (msg != "cat")) {
      msg = msg.toLowerCase()

			for (i in emuji_library) {
				var emuji_split = emuji_library[i].split("\t")
				//console.log([emujis[i]])
				//console.log(emuji_split[0])
				// make sure it exists
				if (emuji_split[1]) {
					var emuji_keywords = emuji_split[1].split(",")

					// hard match
					for (var x = 0; x < emuji_keywords.length; x++) {
						// console.log(emuji_keywords[x])
						var q = " " + emuji_keywords + " "
						if (q) {
							if (msg.includes(q)) {
								logger.info("Potential reaction " + emuji_split[0])
								emoji.push(emuji_split[0])
							}
						}

					}

					// soft match
					for (var x = 0; x < emuji_keywords.length; x++) {
						// console.log(emuji_keywords[x])
						var q = emuji_keywords[x].replace('"',' ')
						if (q) {
							if (msg.includes(q)) {
								logger.info("Potential reaction " + emuji_split[0])
								emoji.push(emuji_split[0])
							}
						}
					}
				}
		  }

			// overrides
			if (msg.includes("kitt")) { emoji.push(this.randomCatEmoji()) }
			if (msg.includes("fish")) { emoji.push(this.randomFishEmoji()) }
			if (msg.includes("treat")) { emoji.push(this.randomTreatEmoji()) }
			if (msg.includes("snack")) { emoji.push(this.randomTreatEmoji()) }
			if (msg.includes("feed")) { emoji.push(this.randomTreatEmoji()) }
			if (msg.includes("hungry")) { emoji.push(this.randomTreatEmoji()) }
			if (msg.includes("lasagna")) { emoji.push(this.randomTreatEmoji()) }
			if (msg.includes("chat")) { emoji.push(this.randomCatEmoji()) }
			// if (msg.includes("mew")) { emoji.push(this.randomCatEmoji()) }
			// if ((msg.includes("meow")) && (!(msg.includes("552233016764792880")))) { emoji.push(this.randomCatEmoji()) }
			// if ((msg.includes("cat")) && (!(msg.includes("552233016764792880"))) && (!(msg.includes("catbot")))) { emoji.push(this.randomCatEmoji()) }
			if (msg.includes("meow")) { emoji.push(this.randomCatEmoji(msg)) }

    }

		// array is built, now pare down reactions by probablistic determination
		for (var y = 0; y < (emoji.length); y++) {
			var snap = Math.random()
			var snapPercent = Math.random() // set this to a decimal value .5 == 50%

			if (y == 0) {
				// always output one emoji if there is one
				output_array.push(emoji[y])
			}
			if ((y > 0) && (snap > snapPercent)) {
				output_array.push(emoji[y])
			}
		}
		return output_array
	},
  randomFishEmoji: function() {

    var fishReaction = []
    fishReaction[0] = "🐟"
    fishReaction[1] = "🐟"
    fishReaction[2] = "🐟"
    fishReaction[3] = "🐟"
    fishReaction[4] = "🐟"
    fishReaction[5] = "🐠"
    fishReaction[6] = "🐡"
    fishReaction[7] = "🎣"
    fishReaction[8] = "🎣"
    fishReaction[9] = "🎣"

    var randomReaction = Math.floor(Math.random() * fishReaction.length)
    return fishReaction[randomReaction]
  },

  randomCatEmoji: function(msg) {

    var catReaction = []
    catReaction[0] = "😺"
    catReaction[1] = "😸"
    catReaction[2] = "😹"
    catReaction[3] = "😻"
    catReaction[4] = "😼"
    catReaction[5] = "😽"
    catReaction[6] = "🙀"
    catReaction[7] = "😿"
    catReaction[8] = "😾"
    catReaction[9] = "🐱"
    catReaction[10] = "🐈"
    catReaction[11] = "🦁"
    catReaction[12] = "🐯"
    catReaction[13] = "🐅"
    catReaction[14] = "🐆"

    var randomReaction = Math.floor(Math.random() * catReaction.length)
    return catReaction[randomReaction]
  },

  randomTreatEmoji: function() {

    var treatReaction = []
    treatReaction[0] = "🐟"
    treatReaction[1] = "🍦"
    treatReaction[2] = "🍧"
    treatReaction[3] = "🍨"
    treatReaction[4] = "🍩"
    treatReaction[5] = "🍪"
    treatReaction[6] = "🍰"
    treatReaction[7] = "🍫"
    treatReaction[8] = "🍬"
    treatReaction[9] = "🍭"
    treatReaction[10] = "🍮"
    treatReaction[11] = "🍍"
    treatReaction[12] = "🐁"
    treatReaction[13] = "🍡"

    var randomReaction = Math.floor(Math.random() * treatReaction.length)
    return treatReaction[randomReaction]
  }

}
