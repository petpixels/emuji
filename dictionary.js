const MongoClient = require('mongodb').MongoClient
const uri = "mongodb+srv://CatBotAdmin:P1PqVQPO2FmBju0L@cluster0-msq7h.mongodb.net/test?retryWrites=true";

const fs = require('fs')

const conf_dir = "conf" // log directory
const log_dir = "logs" // log directory
const log_file = "bot" // log file name

dictionary_to_json()

var emuji_library
function dictionary_to_json(file = "./conf/emuji.txt") {
	var dictionary_file = file
	var dictionary = []
	var entries = []
	var retString

	if (dictionary_file) {
		dictionary_file = file
	} else {
		dictionary_file = conf_dir + "/" + default_dictionary_file + ".txt"
	}

	var fileEmojis = dictionary_file

	var emujis = fs.readFileSync(fileEmojis).toString().split("\n")
	emuji_library = emujis // save to global

	for (var i in emuji_library) {

		var emuji_entry = emuji_library[i]
		var aEntry = emuji_entry.split("\t")

		if (aEntry) {
			var entry_emoji = aEntry[0]
			var entry_keywords = aEntry[1]
		}

		if (entry_keywords) {
			var aKeywords = entry_keywords.split(",")
			for (var k = 0; k < aKeywords.length; k++) {
				var entry_keyword = aKeywords[k]
				var entry = {}
				entry.name = entry_emoji
				entry.keyword = entry_keyword

				entries.push(entry)

			}
		}
	}

	deleteAll()
	savetoMongo(entries)
	fs.writeFile('dictionary.json', JSON.stringify(entries), (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    console.log('Dictionary saved!');
	});

	console.log(entries)

}


function savetoMongo(emoji_json) {
	if (emoji_json) {
		MongoClient.connect(uri, function(err, db) {
		  if (err) throw err;

			var dbo = db.db("emuji")
		  dbo.collection("dictionary").insertMany(emoji_json, function(err, res) {
		    if (err) throw err;
		    console.log("Emojis inserted")
				console.log(emoji_json)
		    db.close()
		  })
		})
	}
}

function deleteAll() {
	MongoClient.connect(uri, function(err, db) {
	  if (err) throw err
	  var dbo = db.db("emuji")
	  var query = { }
		dbo.collection("dictionary").deleteMany(query, function(err, obj) {
	    if (err) throw err;
	    console.log(obj.result.n + " document(s) deleted");
	    db.close()
	  })
	})
}
