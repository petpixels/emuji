var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

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

	fs.writeFile('dictionary.json', JSON.stringify(entries), (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    console.log('Dictionary saved!');
});

	console.log(entries)

}
