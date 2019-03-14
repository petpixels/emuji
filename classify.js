const fs = require('fs')
const dclassify = require('dclassify');

var Classifier = dclassify.Classifier;
var DataSet    = dclassify.DataSet;
var Document   = dclassify.Document;


var good_emojis = []
var bad_emojis = []
var emuji_emojis = []

var good_file = fs.readFileSync("./learn/good.txt").toString().split("\n")
var bad_file = fs.readFileSync("./learn/bad.txt").toString().split("\n")
var potential_file = fs.readFileSync("./learn/potential.txt").toString().split("\n")
var emu_file = fs.readFileSync("./learn/training.txt").toString().split("\n")

function readTrainingFile(file_data) {
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

function classify(emoji) {

	// create some 'good' items (name, characteristics)
	if (good_file) { good_emojis = readTrainingFile(good_file) }
	if (emu_file) { emu_emojis = readTrainingFile(emu_file) }

	var items_good = new Document('item1', good_emojis);
	var items_good_emu = new Document('item2', emu_emojis);

	// create some 'bad' test items (name, array of characteristics)
	if (bad_file) { bad_emojis = readTrainingFile(bad_file) }
	if (bad_file) { potential_emojis = readTrainingFile(potential_file) }

	var items_bad = new Document('item3', bad_emojis);
	var items_potential = new Document('item4', potential_emojis);

	// create a DataSet and add test items to appropriate categories
	// this is 'curated' data for training
	var data = new DataSet();
	data.add('good', [items_good,items_good_emu]);
	data.add('bad', [items_bad,items_potential]);

	// an optimisation for working with small vocabularies
	var options = {
	    //applyInverse: true
	};

	// create a classifier
	var classifier = new Classifier(options);

	// train the classifier
	classifier.train(data);
	console.log('Classifier trained.');
	// console.log(JSON.stringify(classifier.probabilities, null, 4));

	// test the classifier on a new test item
	var testDoc = new Document('testDoc', [emoji]);
	var result = classifier.classify(testDoc);

	return result
}

var emoji = '🐈'
var classified = classify(emoji)
console.log("Categorized " + emoji + " as " + classified.category  + " at " + (classified.probability * 100) + "% odds")
