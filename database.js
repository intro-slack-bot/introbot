var MongoClient = require('mongodb').MongoClient;

/* 
* Collection: slack_user_intros_and_points 
* teamname
* username
* userId
* intro
* point
*/
// why how to get the user id field? or do we really need the user id field

//Get description of the user and his helpfulness point from database, given username.
exports.getIntro = (teamName, userName, callback) => {
    MongoClient.connect(process.env.MONGO_URL, (err, db) => {
      db.collection('slack_user_intros_and_points').findOne({'teamname': teamName, 'username': userName}, {"intro" : 1}, (err, intro) => {
        if (err) {
          console.log("Error happened :(", err);
        }
        if (intro) {
          callback(intro);
        }
        db.close();
      })
    });
}

//Get helpfulness point only from database, given username.
exports.getpoint = (teamName, userName) => {
    MongoClient.connect(process.env.MONGO_URL, (err, db) => {
      db.collection('slack_user_intros_and_points').findOne({'teamname': teamName, 'username': userName}, {'point': 1}, (err, point) => {
        if (err) {
          console.log("Error happened :(", err);
        }
        if (point) {
          return point;
        }
        db.close();
      });
    });  
}

//insert/update an intro about a user to the database
exports.addIntro = (teamName, userName, userId, intro) => {
    MongoClient.connect(process.env.MONGO_URL, (err, db) => {
      db.collection('slack_user_intros_and_points').update({'teamname': teamName, 'username': userName}, {'teamname': teamName, 'username': userName, 'userid': userId, 'intro': intro, 'point': 0}, {upsert: true}, (err, intro) => {
        if (err) {
          console.log("Error happened :(", err);
        }

        db.close();
      });
    });       
}

//insert/update helpfulness point of a user to the database
exports.incrementpoint = (teamName, userName) => {
    MongoClient.connect(process.env.MONGO_URL, (err, db) => {
      // create new document if the user is not exist
      db.collection('slack_user_intros_and_points').findOne({'teamname': teamName, 'username': userName}, {'point': 1}, (err, point) => {
         if (!point) {
           db.collection('slack_user_intros_and_points').insert({'teamname': teamName, 'username': userName, 'intro': '', 'point': 0}); 
         }                                                   
      });
      db.collection('slack_user_intros_and_points').update(
        {'teamname': teamName, 'username': userName}, 
        {$set: {'teamname': teamName, 'username': userName},
         $inc: {'point': 1}
        }, (err, intro) => {
        if (err) {
          console.log("Error happened :(", err);
        }

        db.close();
      });
    });  
}