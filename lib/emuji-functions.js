const fs = require('fs')
const path = require('path')
const dclassify = require('dclassify');
const sortJsonArray = require('sort-json-array');

var Classifier = dclassify.Classifier;
var DataSet    = dclassify.DataSet;
var Document   = dclassify.Document;

var emuji_library = []

var good_emojis = []
var bad_emojis = []
var emuji_emojis = []

const { createLogger, format, transports } = require('winston')
const env = process.env.NODE_ENV || 'development'

require('winston-daily-rotate-file')

const conf_dir = "conf" // log directory
const log_dir = "logs" // log directory
const learn_dir = "learn" // learrning directory

const log_file = "emuji"
const learn_file = "potential"
const train_file = "training"
const user_teach_file = "user_training"

const default_dictionary_file = "emuji" // dictionary file name
const default_learn_file = "emuji" // learning file name

var good_file = fs.readFileSync("./learn/good.txt").toString().split("\n")
var bad_file = fs.readFileSync("./learn/bad.txt").toString().split("\n")
var potential_file = fs.readFileSync("./learn/potential.txt").toString().split("\n")
var emu_file = fs.readFileSync("./learn/training.txt").toString().split("\n")

// Create the log & conf directories if it does not exist
if (!fs.existsSync(log_dir)) { fs.mkdirSync(log_dir) }
if (!fs.existsSync(learn_dir)) { fs.mkdirSync(learn_dir) }
if (!fs.existsSync(conf_dir)) { fs.mkdirSync(conf_dir) }

// const filename = path.join(log_dir, 'emuji.log')
const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: `${log_dir}/${log_file}-%DATE%.log`,
  datePattern: 'YYYY-MM-DD'
})

// generic logger
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

// for logging all potential entries (these really should just be separate categories
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
})

// actual emoji matches ONLY
// there has got to be a better way to do this...
const training_filename = path.join(learn_dir, train_file + ".txt");
const train = createLogger({
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
	new transports.File( { filename: training_filename } )
]
})

// actual emoji matches ONLY
// there has got to be a better way to do this...
const user_teach_filename = path.join(learn_dir, user_teach_file + ".txt");
const user_teach = createLogger({
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
	new transports.File( { filename: user_teach_filename } )
]
})

function uniqueMatches(a) {
  return a.sort().filter(function(item, pos, ary) {
    return !pos || item != ary[pos - 1]
  })
}

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
	train: function(emoji,msg) {
		// build training data
		train.info(emoji + "\t" + msg + "\t user")
	},
	teach: function(emoji,msg) {
		// learn from user input
		// these are separate files because I expect
		// cutter from the user data
		user_teach.info(emoji + "\t" + msg)
	},
  classify: function(emoji) {

		// create some 'good' items (name, characteristics)
		if (good_file) { good_emojis = this.readTrainingFile(good_file) }
		if (emu_file) { emu_emojis = this.readTrainingFile(emu_file) }
		if (potential_file) { potential_emojis = this.readTrainingFile(potential_file) }

		var items_good = new Document('item1', good_emojis);
		var items_good_emu = new Document('item2', emu_emojis);

		// create some 'bad' test items (name, array of characteristics)
		if (bad_file) { bad_emojis = this.readTrainingFile(bad_file) }

		var items_bad = new Document('item3', bad_emojis);
		var items_potential = new Document('item4', potential_emojis);

		// create a DataSet and add test items to appropriate categories
		// this is 'curated' data for training
		var data = new DataSet();
		data.add('good', [items_good,items_good_emu,items_potential]);
		data.add('bad', [items_bad,items_potential]);

		// an optimisation for working with small vocabularies
		var options = {
		   //applyInverse: true
		};

		// create a classifier
		var classifier = new Classifier(options);

		// train the classifier
		classifier.train(data);
		//console.log(JSON.stringify(classifier.probabilities, null, 4));

		// test the classifier on a new test item
		var testDoc = new Document('testDoc', [emoji]);
		var result = classifier.classify(testDoc);

		return result
	},
	react: function(input) {
		var msg = input.toLowerCase()
		var fuzz = Math.random()
		var emoji = []
		var jsonEmoji = []
    var emoji_direct_match = []
		var emoji_indirect_match = []
		var keywords_direct_match = []
		var keywords_indirect_match = []
		var output_array = []

    if (msg && (!(msg === undefined))) {
      msg = msg.toLowerCase().replace(/[.,\/#!\\?$%\^&\*;:{}=\-_`~()]/g,"").replace(/\n/g," ")

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
						var q = emuji_keywords[x].replace(/\"/,'') // remove quotes
						var q = emuji_keywords[x].replace(/\n/g," ") // replace new line with space (it happens)

						// search each keyword against the received message
						for (word in aMsg) {
							var wordsearch = aMsg[word]
							// make sure it exists
							if (wordsearch) {
								// direct match
								if (wordsearch == q) {
									train.info(emoji_match + "\t" + wordsearch.replace(/"/g,"") + "\t strong")
									emoji_direct_match.push(emoji_match)
									keywords_direct_match.push(wordsearch)
								}

								// indirect match
								if (wordsearch.includes(q)) {
									if (!(wordsearch == q)) {
										train.info(emoji_match + "\t" + wordsearch.replace(/"/g,"") + "\t weak")
										emoji_indirect_match.push(emoji_match)
										keywords_indirect_match.push(wordsearch)
									}
								}
							}
						}
					}
				}
			}
		}
		// merge arrays in order

		// emoji direct matches
		for (var i = 0; i < emoji_direct_match.length; i++) {
			var thisJsonEmoji = {}
			var classified = this.classify(emoji_direct_match[i])
			thisJsonEmoji.emoji = emoji_direct_match[i]
			thisJsonEmoji.keyword = keywords_direct_match[i]
			thisJsonEmoji.category = classified.category
			thisJsonEmoji.probability = classified.probability
			thisJsonEmoji.match = "direct"
			jsonEmoji.push(thisJsonEmoji)
		}

		// emoji indirect matches
		for (var i = 0; i < emoji_indirect_match.length; i++) {
			// only add if there is not a corresponding direct match
			// to avoid conflicts and reduce the overall emoji count
			var do_not_add = false
			for (var j = 0; j < keywords_direct_match.length; j++) {
				if (emoji_direct_match[j] == emoji_indirect_match[i]) {
					do_not_add = true
				}
			}

			if (!(do_not_add)) { // do if not don't
				var thisJsonEmoji = {}
				var classified = this.classify(emoji_indirect_match[i])
				thisJsonEmoji.emoji = emoji_indirect_match[i]
				thisJsonEmoji.keyword = keywords_indirect_match[i]
				thisJsonEmoji.category = classified.category
				thisJsonEmoji.probability = classified.probability
				thisJsonEmoji.match = "indirect"
				jsonEmoji.push(thisJsonEmoji)
			}
		}

		// remove duplicate emojis
		// sort by emoji
		var jsonSorted = sortJsonArray(jsonEmoji,"emoji")
		var new_array = []
		var dupe_array = []
		var lastItem = {}

		for (var item in jsonSorted) {
			var thisItem = jsonSorted[item]

			if (lastItem === jsonSorted[i]) {
				console.log(lastItem.hasOwnProperty('emoji'))
				if ((thisItem.emoji != lastItem.emoji) || (thisItem.keyword != lastItem.keyword)) {
					new_array.push(thisItem)
				} else {
					dupe_array.push(thisItem)
					console.log(thisItem.probability)
				}
			} else {
				// always push first item
				new_array.push(thisItem)
			}
			lastItem = thisItem
		}

		dupe_array = sortJsonArray(dupe_array,"probability","des")
		var throw_array = []
		if (dupe_array) {
			// build array with only one of the duplicates
			for (var i = 0; i < new_array.length; i++) {
				var thisArray = dupe_array[i]
				var thatArray = throw_array[i]

				if (thisArray.emoji !== thatArray.emoji) {
					throw_array.push(new_array[i])
				}
			}

			jsonSorted = throw_array
		}

		// sort array by probability
		jsonSorted = sortJsonArray(jsonSorted,"probability","des")
		console.log(jsonSorted)

		var bias = 0
		var count = 0
		var final_array = []
		for (react in jsonSorted) {
			var snap = Math.random()
			var snapPercent = Math.random() // set this to a decimal value .5 == 50%
			var reaction = jsonSorted[react]

			// always output one emoji if there is one
			if (count == 0) { final_array.push(reaction) }

			// show a random number of emjois afterwards
			// snap is biased towards "goodness" of the emoji
			// whatever that even really means at this point
			if ((count > 0) && ((snap + bias) < snapPercent)) {
				if (reaction.category == "good") {
					final_array.push(reaction)
				}
			}
			count++
		}

		// add array to output file
		if (final_array) {
			for (var i = 0; i < final_array.length; i++) {
				// strip quotes, spaces and common puntuation
				var reaction = final_array[i]
				var output_emoji = reaction.emoji
				var output_word = reaction.keyword.replace(/"/g, "") // strip quotes
				output_word = output_word.replace(/[.,\/#!\\?$%\^&\*;:{}=\-_`~()]/g,"") // I got this from the internet

				learn.info(output_emoji + '\t' + output_word)
				logger.info("@emu reacted to '" + output_word + "' with " + output_emoji)

				output_array.push(output_emoji)
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
  },
	readTrainingFile: function(file_data) {
		var output = []

		if (file_data) {
			// read through file line by line
			for (line in file_data) {
				var lineData = file_data[line]
				var aLine = lineData.split("\t")

				if (aLine[0]) {
					output.push(aLine[0])
				}
			}
		}
		output = output.sort()
		return output
	}

}
