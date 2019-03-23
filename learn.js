var MongoClient = require('mongodb').MongoClient

const bot_secret = require('./lib/bot-secret')

url = bot_secret.mongo_url

var emubot = require('./lib/bot')
var emuji = require('./lib/emuji-functions')

var dictionary = []
var user_training = []

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

			console.log("@emuji: dictionary loaded from db")
			return dictionary
		})
	})
}

function load_training() {

	MongoClient.connect(url, function(err, db) {
		if (err) throw err

		var emuji_db = db.db("emuji")
		var user_raw = emuji_db.collection("user_training_raw")

		var stream = user_raw.find({}).stream();
		stream.on("data", function(item) {
			//console.log(item)
			user_training.push(item)
		})
		stream.on("end", function() {
			learn(user_training)

			return
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
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err
	  var dbo = db.db("emuji")
	  var query = { }
		dbo.collection("user_training_good").deleteMany(query, function(err, obj) {
	    if (err) throw err;
	    console.log(obj.result.n + " document(s) deleted");
	  })
		dbo.collection("user_training_bad").deleteMany(query, function(err, obj) {
	    if (err) throw err;
	    console.log(obj.result.n + " document(s) deleted");
	  })
	})
}


// load dictionary from database
load_dictionary()
load_training()


if (dictionary && user_training) {
	//deleteAll()
}

var learned_emoji = []
var bad_match = []

// first pass through training data:
// take all single word emoji/keyword matches
var lineCount = 0
var tmpEmoji = []

function learn(user_training) {
	console.log(user_training)
	for (var train in user_training) {
		var emoji = {}

		var curEntry = user_training[train]

		// build emoji from current entry
		emoji.emoji = curEntry.name
		emoji.keywords = curEntry.keyword.toLowerCase().replace(/[.,\/#\"!\\?$%\^&\*;:{}=\-_`~()]/g,"").replace(/\n/g)

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
						console.log("Emuji learned good " + tmp.name + " : " + tmp.keyword)
						return
					})
				}
				//console.log(v)
				//db.emoji.insertOne(name: v.emoji, keyword: v.keywords)
			})

			console.log("BAD: ")

			bad_matches = uniqueMatches(bad_match)
			bad_matches.forEach(function(v) {
				//console.log(mongo_library)

				var aKeywords = v.keywords
				aKeywords = aKeywords.split(",")

				const collection = client.db("emuji").collection("user_training_bad")

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
							console.log("Emuji learned bad " + tmp.name + " : " + tmp.keyword)
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


			//db.close()
		})
	}

	console.log("Read: " + lineCount + " lines.")
}
