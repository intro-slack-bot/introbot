var MongoClient = require('mongodb').MongoClient;

/* Add the access token to database collection slack_user_tokens. Token is needed to get username using users.info method of Slack API
 * teamName : {string} : Name of the team
 * teamid: {string}: ID of the team
 * userid: {string}: ID of the user
 * access_token : {string} : Code to get access for team
 */
exports.storeToken = (teamName, teamid, userid, access_token) => {
  let data = {
    "slack-team": teamName,
    "team-id": teamid,
    "user-id": userid,
    "token": access_token
  }
  
  MongoClient.connect(process.env.MONGO_URL, (err, db) => {
    db.collection('slack_user_tokens').updateOne({
        "slack-team": teamName
      }, data, {upsert:true, w: 1}, (err, result)=>{
      
      if(err){
        console.log("Error happened :(", err);
      }
      
      db.close();  
    })
  });
}

/* 
* Collection 2: 
* teamname
* username
* userId
* intro
* point
*/
// why how to get the user id field? or do we really need the user id field

//Get description of the user and his helpfulness point from database, given username.
exports.getIntro = (teamName, userName) => {
    MongoClient.connect(process.env.MONGO_URL, (err, db) => {
      db.collection('slack_user_intros_and_points').findOne({'teamname': teamName, 'username': userName}, {"intro" : 1}, (err, intro) => {
        if (err) {
          console.log("Error happened :(", err);
        }
        if (intro) {
          return intro;
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