const express = require("express"); 
const bodyParser = require('body-parser');
//database related functions
const database = require("./database.js");
//helper functions for working with slack api methods
const helpers = require("./helpers.js");

//initialize bot interaction using RTM client
const RtmClient = require('@slack/client').RtmClient;
// The memory data store is a collection of useful functions we can include in our RtmClient - getting team, userconste, etc 
var MemoryDataStore = require('@slack/client').MemoryDataStore;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS; //to handle messages and other events
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

const bot_token = process.env.SLACK_BOT_TOKEN || '';

var rtm = new RtmClient(bot_token, {
  // Sets the level of logging we require
  logLevel: 'error',
  // Initialise a data store for our client, this will load additional helper functions for the storing and retrieval of data
  dataStore: new MemoryDataStore()
});

const app = express();
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

//for slash commands
app.post('/', (req, res) => {  
  let query = req.body.text;
  let teamname = req.body.team_domain;
  
  if(req.body.token != process.env.TOKEN && !req.body.team_domain){
    res.end('3rd party api requests not allowed... creepy!');
    return;
  }
  
  if(query.startsWith('getintro')){
    let username = query.substr(9);
    database.getIntro(teamname, username, (err, data) => {
            if(err || !data.intro){
              res.end("No Intro available for user - " + username + " Please add one using addintro.");
            }
            if(data.intro){
              res.json({
                text: "About " + username + ":",
                attachments: [
                  {
                    color: "#55FF84",
                    text: data.intro
                  }
                ]
              });
              res.end();
            }
  });
  }
  
  else if(query.startsWith('getpoint')){
    let username = query.substr(9);
    database.getPoint(teamname, username, (err, data) => {
            if(err || !data.point){ 
              res.end("No Points available for user - " + username );
            }
             
      else {
            res.json({
              text: "Helpfulness score of " + username + ":", 
              attachments: [
                {
                  color: "#1D2733",
                  text: data.point 
                }
              ]
            });
      }
          });
  }
});

//For distribution 
app.get('/', (req, res) => {
    // Show a cute slack button
  // need to write a static page similar to https://chingurunner.herokuapp.com/
  if(req.body.token != process.env.TOKEN && !req.body.team_domain){
    res.end('3rd party api requests not allowed... creepy!');
    return;
  }
  
   res.end(`<a href="https://slack.com/oauth/authorize?scope=users:read,commands,bot&client_id=204082547206.207027688375"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>`)
});

//OAuth2 flow or using slack api methods 
app.get('/auth/grant', (req, res) => {
  // Prepare Data for Slack Auth
  // console.log('Code ' + req.query.code);
  let data = {
    client_id: process.env.SLACK_CLIENT_ID, 
    client_secret: process.env.SLACK_CLIENT_SECRET, 
    code: req.query.code 
  };
  console.log(data.code)
  // POST the data to slack access endpoint
  helpers.slack('oauth.access', data)
  .then((body) => {
    // Slack User Token
    let pBody = JSON.parse(body)
    let token = pBody.access_token;
    let user = pBody.user_id;
    let team_id = pBody.team_id;
    let team_name = pBody.team_name; 
    //console.log('Token: ' + token);
    
    //store team token 
    database.storeToken(team_name, token);
    res.redirect(`https://intro-slack-bot.github.io/introbot-landing/`); 
  }).catch(res.end);
});

app.listen(process.env.PORT||"8080"); 
     
let channel; 

// The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  for (const c of rtmStartData.channels) {
    if (c.is_member && c.name ==='general') { channel = c.id }
  }
  //console.log(rtmStartData); 
  let teamName = rtmStartData.team.name;
  console.log(`Logged in as ${rtmStartData.self.name} of team ${teamName}`);
});

// Wait for the client to connect
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
  // Get the user's name
  var user = rtm.dataStore.getUserById(rtm.activeUserId);

  // Get the team's name
  var team = rtm.dataStore.getTeamById(rtm.activeTeamId);

  // Log the slack team name and the bot's name
  console.log('Connected to ' + team.name + ' as ' + user.name);
  
  //post an opening message when the bot is added to a channel
  //rtm.sendMessage("Hello! Thanks for adding intro-bot!", channel);
});

//handling message events

rtm.on(RTM_EVENTS.MESSAGE, (message) => {//@why we need to write in ES5 style here? - I just copied from slack docs :P
  //console.log("Sender: " + message.user);
  let channel = message.channel;
  let team = rtm.dataStore.getTeamById(rtm.activeTeamId);
  let teamname = team.domain;
  
  let thankRegexp = /thank\w*\s*/i;
  let addIntroRegexp = /addIntro\w*\s*/i;
  let getIntroRegexp = /getIntro\w*\s*/i;
  let getPointRegexp = /getPoint\w*\s*/i;
    
  if (message.subtype === 'message_changed') {// do something when user edited a message
    let editedMessage = message.message;
    console.log('someone edited the message!!!');
    if (editedMessage.text.match(addIntroRegexp)) {
      addIntro(editedMessage);  
    }
  }else if (!message.subtype){// if we don't add this condition, the program will run when we delete the message and it will report an error
    let messageContent = message.text.toLowerCase();
    let messageSenderId = message.user;
    console.log('messageSenderId' + messageSenderId);
    let messageSenderName = rtm.dataStore.getUserById(messageSenderId);
    console.log("Message: " + messageContent);

    // when user say 'thanks @username' we increment this user's point
    if(messageContent.match(thankRegexp)){
      let re = /<@\w*>/i; //to get @username string from the message - this will have the user-id , not user-name. 
      if(messageContent.match(re)){
        let user = messageContent.match(re);// user is the id string - <@id>

        let toBeThankedUserId = user[0].substring(2, user[0].length - 1).toUpperCase();
        console.log('tobethankeduser:' + toBeThankedUserId);
        console.log('Team: ' + teamname);
        if (!toBeThankedUserId === messageSenderId) {
                  //get token from database, team_tokens collection
        
        database.getToken(teamname, (err, tokenobj) => {
          if(err){
            rtm.sendMessage('Not authorized. Please install app <https://goo.gl/PznqTB|here> ', message.channel);
          }
          else{  
            let token = tokenobj.token;
            console.log('Token from database: ' + token);
            //get username using users.info
            let apidata = {
            'token' : token,
            'user' : toBeThankedUserId
            };
            helpers.slack('users.info', apidata)
               .then((userobj) => {
                 //console.log('User Object from Slack api: \n' + userobj);   
                let user_json = (JSON.parse(userobj)).user;
                //console.log(user_json);     
                let toBeThankedUserName = user_json.name;
                // console.log("Thanked username: " + toBeThankedUserName);
                database.incrementpoint(teamname, toBeThankedUserId, toBeThankedUserName);  
               }); 
          }
        }); 
  
        //rtm.sendMessage(repliedMessage, message.channel);
        rtm.sendMessage("Hello, <@"+ message.user + ">! You just thanked <@" + toBeThankedUserId + ">!", message.channel);
        rtm.sendMessage("Some one thanked you <@" + message.user + ">! Your helpfulnes score just increased! ", message.channel);  
        }else {
          rtm.sendMessage("Come on don't thank yourself!", message.channel);
        }

      }
    }
    // when user say 'addIntro introContent', we add the introContent to our database
    // actually we might also need to listen for the edit event and then update our database
    if(messageContent.match(addIntroRegexp)){
      addIntro(message);
    }
    // when user say 'getIntro username', we get the introContent from our database for that username
    //Eg: getIntro pankaja 
    if(messageContent.match(getIntroRegexp)) {
          // getIntro(message, teamname);
    }

    //get points for a username 
    //Eg: getPoints or getPoint pankaja
    if(messageContent.match(getPointRegexp)) { 
          getPoint(message, teamname);
    }     
  }
  });

let addIntro = (message) => {
    let messageContent = message.text.toLowerCase();
    let messageSenderId = message.user;
    let messageSenderName = rtm.dataStore.getUserById(messageSenderId).name;
    console.log(messageSenderName);
    let intro = (message.text).substr(9); //to preserve the cases in the string, otherwise everything will be in lowercase.
    if(intro.length > 5000){
        rtm.sendMessage("Your Intro is too long!");
    }
    else if(intro.length === 0){
        rtm.sendMessage("Intro is empty! Please tell us something about yourself.");
    }else{
        //data of user
        let team = rtm.dataStore.getTeamById(rtm.activeTeamId);
        let teamname = team.name;
        database.addIntro(teamname, messageSenderName, messageSenderId, intro);
        rtm.sendMessage("Intro of " + messageSenderName + " is updated to the database", channel); //need to format this message 
        // let userid = user.id; // id is in uppercase
        // Get the team's name
        let teamid = team.id;
        console.log(rtm.dataStore.getUserById(message.user)); 
      }
}


let getIntro = (message, teamname) => {
  let messageContent = message.text.toLowerCase();
  let username = messageContent.substr(9);  
          database.getIntro(teamname, username, (err, data) => {
            console.log(data);
            if(err || !data.intro){
              rtm.sendMessage("No Intro available for user - " + username + " Please add one using addintro." , message.channel);
            }
            if(data.intro){              
              rtm.sendMessage("Intro of " + username + " is: \n" + data.intro, message.channel);
            }
          });
}


let getPoint = (message, teamname) => {
    let messageContent = message.text.toLowerCase();
    let username = messageContent.substr(9); 
          database.getPoint(teamname, username, (err, data) => {
            if(err || data.point === undefined){
              rtm.sendMessage("No Points available for user - " + username, message.channel);
            }
            if(data){
            console.log(data); 
            rtm.sendMessage("Helpfulness score of " + username + " : \n" + data.point , message.channel);
            //May be we can think of better ways of displaying the points? instead of just numbers.
            //Also, feel free to change any of the sentences
            }
          });
}; 

     
rtm.start(); 

