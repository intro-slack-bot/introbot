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
      
      if(err != null){
        console.log("Error happened :(", err);
      }
      
      db.close();  
    })
  });
}

/* 
* Collection 2: 
teamname
username
userId
intro
rating
*/

//Get description of the user and his helpfulness rating from database, given username.
exports.getIntro = (teamName, username) => {
  
}

//Get helpfulness rating only from database, given username.
exports.getRating = (teamName, username) => {
  
}

//insert/update an intro about a user to the database
exports.addIntro = (teamName, username, intro) => {
  
}

//insert/update rating of a user to the database
exports.addRating = (teamName, username, rating) => {
  
}