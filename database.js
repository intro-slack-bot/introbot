var MongoClient = require('mongodb').MongoClient;

/* Add the access token to database
 * teamName : {string} : Name of team
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
