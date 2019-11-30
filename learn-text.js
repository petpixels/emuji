var MongoClient = require('mongodb').MongoClient

const bot_secret = require('./lib/bot-secret')

url = bot_secret.mongo_url

var emubot = require('./lib/bot')
var emuji = require('./lib/emuji-functions')

const cron = require('node-cron');
const fs = require('fs')

const discord = require('discord.js')
const client = new discord.Client()

const conf_dir = "conf" // learrning directory
const learn_dir = "learn" // learrning directory
const learn_file = "potential"
const train_file = "training"
const user_teach_file = "user_training"

const default_dictionary_file = "emuji" // log file name

// open user training log file into an array

var dictionary = []

var dictionary_file = conf_dir + "/" + default_dictionary_file + ".txt"
var training_file = learn_dir + "/" + user_teach_file + ".txt"

//var emuji_library = fs.readFileSync(dictionary_file).toString().split("\n")
var emuji_training = fs.readFileSync(training_file).toString().split("\n")

console.log("@emuji: dictionary file loaded (" + dictionary_file + ")")
console.log("@emuji: training file loaded (" + training_file + ")")

function load_dictionary() {
	var col = "dictionary"
	var dictionary

	MongoClient.connect(url, function(err, db) {
		if (err) throw err

		var dictionary_db = db.db("emuji")
		dictionary_db.collection("dictionary").find({}).toArray(function(err, result) {
			if (err) throw err
			dictionary = result
			emuji_library = result
			//mongo_library = result

			//console.log(mongo_library)
			console.log("@emuji: dictionary loaded from db")

			return dictionary
		})
	})
}

function uniqueMatches(a) {
  return a.sort().filter(function(item, pos, ary) {
    return !pos || item != ary[pos - 1]
  })
}

function emojiSearch(input_emoji, emoji_library) {
	var keywords
  var matched = true

	for (var entry in emuji_library) {
		var entry = emoji_library[entry]
		var aEntry = entry.split("\t")

		if (aEntry[0] === input_emoji) {
			matched = true
			keywords = aEntry[1]
		}
	}

	if (!(matched)) {
		console.log("Not matched: " + input_emoji)
	}

	return keywords
}

function filterCommonWords(input) {
	var retVal = false
	var filter = [
		"a",
		"an",
		"am",
		"and",
		"are",
		"for",
		"i",
		"i'll",
		"in",
		"is",
		"it",
		"of",
		"on",
		"so",
		"the",
		"to",
		"was",
		"were"
	]

	for (word in filter) {
		if (filter[word]) {
			if (input != filter[word]) {
				retVal = true
			}
		}
	}

	return retVal
}

function deleteAll() {
	MongoClient.connect(uri, function(err, db) {
	  if (err) throw err
	  var dbo = db.db("emuji")
	  var query = { }
		dbo.collection("user_training_good").deleteMany(query, function(err, obj) {
	    if (err) throw err;
	    console.log(obj.result.n + " document(s) deleted");
	    //db.close()
	  })
		dbo.collection("user_training_bad").deleteMany(query, function(err, obj) {
	    if (err) throw err;
	    console.log(obj.result.n + " document(s) deleted");
	    //db.close()
	  })
	})
}




// load dictionary from database
load_dictionary()

var learned_emoji = []
var bad_match = []

// first pass through training data:
// take all single word emoji/keyword matches
var lineCount = 0
var tmpEmoji = []

for (var train in emuji_training) {
	var emoji = {}

	var curEntry = emuji_training[train]
	var aEntry = curEntry.split("\t")

	// emoji is the first item
	if (aEntry[0]) { emoji.emoji = aEntry[0] }
	if (aEntry[1]) { emoji.keywords = aEntry[1].toLowerCase().replace(/[.,\/#\"!\\?$%\^&\*;:{}=\-_`~()]/g,"").replace(/\n/g) }

	if (emoji.keywords) {
		var tmpKeywords = emoji.keywords
		tmpKeywords = tmpKeywords.replace(/,/g," ")
		var aKeywords = emoji.keywords.split(" ")

		if (aKeywords.length <= 1) {
			// add singleton emoji
			if ((emoji.emoji) && (emoji.keywords)) {
				emoji.match_type = "strong"
				// only add if both values are filled to avoid creating bad training data
				learned_emoji.push(emoji)
			}
		} else {
			// more than one keyword (skip the first one)
			for (var i = 0; i < aKeywords.length; i++) {
				var keyword = aKeywords[i]
				if (keyword) {
					if (!(filterCommonWords(keyword))) {

						// if it's in the dictionary already and if it's already assigned to that emoji
						// KEEP IT
						var matched = false
						var dict_keywords = emojiSearch(emoji.emoji,emuji_library)
						if (dict_keywords) {
							if (dict_keywords.includes(keyword)) {
								keywordSplit = dict_keywords.split(",")
								for (var j = 0; j < keywordSplit.length; j++) {
									// direct match
									if (keywordSplit[j] == keyword) {
										emoji.keywords = keywordSplit[j]

										if (emoji.emoji && emoji.keywords) {
											emoji.match_type = "strong"
											learned_emoji.push(emoji)
											matched = true
											//console.log('direct')
										}
									}

									// indirect match
									if (keywordSplit[j].includes(keyword)) {
										if (!(keywordSplit[j] == keyword)) {
											emoji.keywords = keywordSplit[j]

											if (emoji.emoji && emoji.keywords) {
												emoji.match_type = "weak"
												learned_emoji.push(emoji)
												matched = true
												//console.log('indirect')
											}
										}
									}
								}
							} else {
								if (!(matched)) {
									// bad matches
									//console.log('Emoji ' + emoji.emoji + ' is not in dictionary')
									// add it to the dictionary?
									// no match
									var retEmoji = {}
									retEmoji.emoji = emoji.emoji
									retEmoji.keywords = keyword
									retEmoji.match_type = "bad"

										bad_match.push(retEmoji)
									//console.log('bad')
								}
							}
						}
					}
				}
			}
		}
	}
	lineCount++
}

if (learned_emoji) {
	MongoClient.connect(url, function(err, client) {
		if (err) throw err

		console.log("GOOD: ")
		learned_emoji.forEach(function(v) {
			//console.log(mongo_library)

			var aKeywords = v.keywords
			aKeywords = aKeywords.split(",")

			const collection = client.db("emuji").collection("user_training_good")

			if (aKeywords) {
				for (var i in aKeywords) {
					var tmp = {}
					tmp.name = v.emoji
					tmp.keyword = aKeywords[i]
					tmp.match = v.match_type
					console.log(tmp)
					// db.collection("user_training_good").insertOne({tmp})

					var result = collection.insertOne(tmp, function(err,result) {
						if (err) throw err

						//console.log(mongo_library)
						console.log("Emuji learned " + tmp.name + " : " + tmp.keyword)
						return
					})


				}
			}	else {
				var tmp = {}
				tmp.name = v.emoji
				tmp.keyword = aKeywords[i]
				tmp.match = v.match_type
				console.log(tmp)
				// db.collection("user_training_good").insertOne({tmp})

				var result = collection.insertOne(tmp, function(err,result) {
					if (err) throw err

					//console.log(mongo_library)
					console.log("Emuji learned " + tmp.name + " : " + tmp.keyword)
					return
				})
			}
			//console.log(v)
			//db.emoji.insertOne(name: v.emoji, keyword: v.keywords)
		})

		console.log("BAD: ")
		//bad_matches.forEach(function(v) {
			//console.log(v)
	//		bad_file.write(v.emoji + "\t" + v.keywords + "\t" + v.match_type + "\n")
		//})


		//db.close()
	})
}

console.log("Read: " + lineCount + " lines.")

/*
var good_file = fs.createWriteStream(learn_dir + "/good.txt")
good_file.on('error', function(err) { /* error handling })
learned_emoji.forEach(function(v) {
	good_file.write(v.emoji + "\t" + v.keywords + "\t" + v.match_type + "\n")
})
good_file.end()
*/
/*
var bad_file = fs.createWriteStream(learn_dir + "/bad.txt")
var bad_matches = []
bad_matches = uniqueMatches(bad_match)
bad_file.on('error', function(err) { /* error handling  })
bad_matches.forEach(function(v) {
	bad_file.write(v.emoji + "\t" + v.keywords + "\t" + v.match_type + "\n")
})
bad_file.end()
*/
