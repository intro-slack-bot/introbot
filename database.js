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

//Initially, Add user name, id and teamname using rtmStartData
exports.add_name_id = (teamName,userArray) => {
    MongoClient.connect(process.env.MONGO_URL, (err, db) => {
      for(let i = 0; i < userArray.length; i++){
        let userName = userArray[i].name;
        let userId = userArray[i].id;
      db.collection('slack_user_intros_and_points').update({'teamname': teamName, 'username': userName, 'userId': userId }, {upsert: true}, (err, intro) => {
        if (err) {
          console.log("Error happened :(", err);
        }
        
        db.close();
      })
      }
    });
}

//Get description of the user and his helpfulness point from database, given username.
exports.getIntro = (teamName, userName, callback) => {
    MongoClient.connect(process.env.MONGO_URL, (err, db) => {
      db.collection('slack_user_intros_and_points').findOne({'teamname': teamName, 'username': userName}, {"intro" : 1}, (err, intro) => {
        if (err) {
          console.log("Error happened :(", err);
          callback(err,null);
        }
        if (intro) {
          let userintro = intro.intro;
          if(userintro.length>0){
            callback(null,intro);
          }
          else{
            callback("Error!",null);
          }
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
      db.collection('slack_user_intros_and_points').update({'teamname': teamName, 'userId': userId}, {'teamname': teamName, 'username': userName, 'userId': userId, 'intro': intro, 'point': 0}, {upsert: true}, (err, intro) => {
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
           db.collection('slack_user_intros_and_points').insert({'teamname': teamName, 'userId': userId, 'point': 1}); 
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


/*New collection to store token per team. 
 *It is better if the token is the admin who installs the app in the team.
 *so that the token wont expire as long as the admin stays in the group.
 *Collection name: team_tokens
    *teamname: {string} : Team name
    *token: {string} : access token
*/
/*
exports.storeToken = (teamName, access_token) => {
  let data = {
    "teamname": teamName,
    "token": access_token
  }
  
  MongoClient.connect(process.env.MONGO_URL, (err, db) => {
    db.collection('team_tokens').updateOne({
        "teamname": teamName
      }, data, {upsert:true, w: 1}, (err, result)=>{
      
      if(err != null){
        console.log("Error happened :(", err);
      }
      
      db.close();  
    })
  });
}

/* Get the token from database given the team name
 * teamname : {string} : Team name
 * callback : {function (err, string)} : Function to handle the token
 */
/*
exports.getToken = (teamName, callback) => {
  MongoClient.connect(process.env.MONGO_URL, (err, db) => {
    db.collection('team_tokens').findOne({
      "teamname": teamName
    }).then((data)=>{
      if(!data){
        callback(404, null);
        return;
      }
      callback(null, data.token);
    })
  });  
}
*/