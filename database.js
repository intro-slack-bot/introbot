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
exports.getPoint = (teamName, userName, callback) => {
    MongoClient.connect(process.env.MONGO_URL, (err, db) => {
      db.collection('slack_user_intros_and_points').findOne({'teamname': teamName, 'username': userName}, {'point': 1}, (err, point) => {
        if (err) { 
          console.log("Error happened :(", err);
        }
        if (point) {
          callback(point);
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
exports.incrementpoint = (teamName, userId) => {
    MongoClient.connect(process.env.MONGO_URL, (err, db) => {
      // create new document if the user is not exist
      db.collection('slack_user_intros_and_points').findOne({'teamname': teamName, 'userId': userId}, {'point': 1}, (err, point) => {
         if (!point) {
           db.collection('slack_user_intros_and_points').insert({'teamname': teamName, 'userId': userId, 'intro': '', 'point': 1}); 
         }else {
                       // increment the user point in the database
            db.collection('slack_user_intros_and_points').update(
              {'teamname': teamName, 'userId': userId}, 
              {$set: {'teamname': teamName, 'userId': userId},
               $inc: {'point': 1}
              }, (err, intro) => {
              if (err) {
                console.log("Error happened :(", err);
              }

              
            });
         }
        db.close();
      });

    });  
}

/*New collection to store 1 token per team. 
 *The token should be of the admin who installs the app in the team.
 *so that the token wont expire as long as the admin stays in the group.
 *Collection: team_tokens
    *teamname
    *token
*/
exports.storeToken = (teamName, access_token) => {
  let data = {
    "teamname": teamName,

    "token": access_token
  }
  
  MongoClient.connect(process.env.MONGO_URL, (err, db) => {
    db.collection('slack_user_tokens').updateOne({
        "slack-team": teamName
      }, data, {upsert:true, w: 1}, (err, result)=>{
      
      if(err != null){
        console.log("Error happened :(", err);
      }
      
      db.close();  
    })
  });
}

/* Get the token from database given the team domain
 * team_id : {string} : Team domain name
 * user_id : {string} : User Id to find
 * callback : {function (err, string)} : Function to handle the token
 */
exports.getToken = (team_id, user_id, callback) => {
  MongoClient.connect(process.env.MONGO_URL, (err, db) => {
    db.collection('slack_user_tokens').findOne({
      "team-id": team_id,
      "user-id": user_id
    }).then((data)=>{
      if(!data){
        callback(404, null);
        return;
      }
      callback(null, data.token);
    })
  });  
}