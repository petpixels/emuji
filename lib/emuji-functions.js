const fs = require('fs')
const path = require('path')

var emuji_library = []

const { createLogger, format, transports } = require('winston')
const env = process.env.NODE_ENV || 'development'

require('winston-daily-rotate-file')

const conf_dir = "conf" // log directory
const log_dir = "logs" // log directory
const log_file = "emuji"
const learn_dir = "learn" // learrning directory
const learn_file = "learning"
const default_dictionary_file = "emuji" // log file name
const default_learn_file = "emuji" // log file name

// Create the log & conf directories if it does not exist
if (!fs.existsSync(log_dir)) { fs.mkdirSync(log_dir) }
if (!fs.existsSync(learn_dir)) { fs.mkdirSync(learn_dir) }
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

const learning_filename = path.join(learn_dir, learn_file + ".txt");
const learn = createLogger({
  // change level if in dev environment versus production
  level: env === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.message}`)
  ),
	transports: [
	new transports.Console({
		level: 'info',
		format: format.combine(
			format.colorize(),
			format.printf(
				info => `${info.message}`
			)
		)
	}),
	new transports.File( { filename: learning_filename } )
]
});

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
    var emoji_hard_match = []
		var emoji_soft_match = []
		var keywords = []
		var keywords_hard_match = []
		var keywords_soft_match = []
		var output_array = []
		var output_keywords = []

    if (msg && (!(msg === undefined))) {
      msg = msg.toLowerCase()

			// split message by spaces
			var aMsg = msg.split(" ")

			// loop through emoji library
			for (var i in emuji_library) {

				// split by tab to separate emoji from word list
				var emoji_split = emuji_library[i].split("\t")

				var emoji_match = emoji_split[0] // emoji
				var keyword_list = emoji_split[1] // keyword_list

				// make sure keyword list exists
				if (keyword_list) {
					// break csv into array
					var emuji_keywords = keyword_list.split(",")
					// var keyword = aMsg[word] // this doesn't make sense here, commenting

					// loop through keywords from emoji dictionary
					for (var x = 0; x < emuji_keywords.length; x++) {
						var q = emuji_keywords[x].replace('"','') // remove quotes

						// search each keyword against the received message
						for (word in aMsg) {
							var wordsearch = aMsg[word]
							// make sure it exists
							if (wordsearch) {
								// hard match
								if (wordsearch == q) {
										logger.info("Potential reaction " + emoji_match + " : hard match : " + wordsearch)
										emoji_hard_match.push(emoji_match)
										keywords_hard_match.push('"' + wordsearch + '"')
								}

								// soft match
								if (wordsearch.includes(q)) {
								//if (wordsearch.includes(q)) { // soft match
									logger.info("Potential reaction " + emoji_match + " : soft match : " + wordsearch)
										emoji_soft_match.push(emoji_match)
										keywords_soft_match.push('"' + wordsearch + '"')
								//	}
								}
							}
						}
					}
				}
			}

			// Manual overrides

			// add random cat emoji to all meows, for personality
			if (msg.includes("meow")) {
				emoji_hard_match.push(this.randomCatEmoji(msg))
				keywords_hard_match.push("meow")
			}

			// also match kittens
			if (msg.includes("kitt")) {
				emoji_hard_match.push(this.randomCatEmoji(msg))
				keywords_hard_match.push("kitt")
			}

			// emu also matches "chat" for "cat" because it's not very bright
			if (msg.includes("chat")) {
				emoji_hard_match.push(this.randomCatEmoji(msg))
				keywords_hard_match.push("chat")
			}

			// everyone likes treats
			if (msg.includes("treat")) {
				emoji.push(this.randomTreatEmoji())
				keywords_hard_match.push("treat")
			}

			// deprecated
			// if (msg.includes("feed")) { emoji.push(this.randomTreatEmoji()) }
			// if (msg.includes("snack")) { emoji.push(this.randomTreatEmoji()) }
			// if (msg.includes("hungry")) { emoji.push(this.randomTreatEmoji()) }
			// if (msg.includes("lasagna")) { emoji.push(this.randomTreatEmoji()) }
			// if (msg.includes("fish")) { emoji.push(this.randomFishEmoji()) }
			// if (msg.includes("mew")) { emoji.push(this.randomCatEmoji()) }
			// if ((msg.includes("meow")) && (!(msg.includes("552233016764792880")))) { emoji.push(this.randomCatEmoji()) }
			// if ((msg.includes("cat")) && (!(msg.includes("552233016764792880"))) && (!(msg.includes("catbot")))) { emoji.push(this.randomCatEmoji()) }
    }

		// merge arrays in order

		// emoji hard matches
		for (var i = 0; i < emoji_hard_match.length; i++) {
			emoji.push(emoji_hard_match[i])
			keywords.push(keywords_hard_match[i])
		}

		// emoji soft matches
		for (var i = 0; i < emoji_soft_match.length; i++) {
			// only add if there is not a corresponding hard match
			// to avoid conflicts and reduce the overall emoji count
			var do_not_add = false
			for (var j = 0; j < keywords_hard_match.length; j++) {
				if (keywords_hard_match[j] == keywords_soft_match[i]) {
					do_not_add = true
				}
			}

			if (!(do_not_add)) { // do if not don't
				emoji.push(emoji_soft_match[i])
				keywords.push(keywords_soft_match[i])
			}
		}

		// keywords matches
		// in theory these are the same length, but let's not assume

		// array is built, now pare down reactions by probablistic determination
		for (var y = 0; y < (emoji.length); y++) {
			var snap = Math.random()
			var snapPercent = Math.random() // set this to a decimal value .5 == 50%

			if (y == 0) {
				// always output one emoji if there is one
				output_array.push(emoji[y])
				output_keywords.push(keywords[y])
			}
			if ((y > 0) && (snap < snapPercent)) {
				// snap is biased towards hard matches
				output_array.push(emoji[y])
				output_keywords.push(keywords[y])
			}
		}

		// add array to output file
		if (output_array) {
			for (var z = 0; z < output_array.length; z++) {
				// console.log(output_array)
				// strip quotes, spaces and common puntuation
				var output_emoji = output_array[z]
				var output_word = output_keywords[z].replace(/"/g, "") // strip quotes
				output_word = output_word.replace(/[.,\/#!\\?$%\^&\*;:{}=\-_`~()]/g,"") // I got this from the internet

				learn.info(output_emoji + '\t' + output_word)
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
