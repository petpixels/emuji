const bot = require("./lib/bot-secret.js")
const uri = bot.mongo_url

console.log("URL: ")
console.log(uri)

const MongoClient = require('mongodb').MongoClient;

MongoClient.connect(uri, function(err, client) {
   if(err) {
        console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
   }
   console.log('Connected...');
//   const collection = client.db("emuji").collection("user_training_raw")
   const collection = client.db("emuji").collection("user_training_good")


   // perform actions on the collection object
   var emoji = {}
   emoji.name = "🐤"
   emoji.keyword = "emu"

  var result = collection.find({}).toArray(function(err,result) {
  //var result = collection.insertOne(emoji, function(err,result) {
      if (err) throw err
      //console.log("Emoji inserted")
      //console.log(emoji)
      //db.close()
      console.log(result)
			client.close();
    })
   //console.log(result)

});
