const express = require("express");
const bodyParser = require('body-parser');
//database related functions
const database = require("./database.js");
//helper functions
const helpers = require("./helpers.js");

//initialize bot interaction using RTM client
const RtmClient = require('@slack/client').RtmClient;
// The memory data store is a collection of useful functions we can include in our RtmClient - getting team, username, etc 
var MemoryDataStore = require('@slack/client').MemoryDataStore;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS; //to handle messages and other events
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

const bot_token = process.env.SLACK_BOT_TOKEN || '';

const rtm = new RtmClient(bot_token);

let channel;

const app = express();
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  // Show a cute slack button
  res.end(`<a href="https://slack.com/oauth/authorize?scope=commands,bot&client_id=204082547206.207027688375"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>`)
});

app.listen(process.env.PORT||"8080");
         

// The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  for (const c of rtmStartData.channels) {
    if (c.is_member && c.name ==='general') { channel = c.id }
  }
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}`);
  //console.log(rtmStartData.channels);
});

/*
//post an opening message when the bot is added to a channel
// you need to wait for the client to fully connect before you can send messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
  rtm.sendMessage("Hello! Thanks for adding intro-bot!", channel);
});
*/

//handling message events

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {//@why we need to write in ES5 style here? - I just copied from slack docs :P
  let msg = message.text.toLowerCase();
  console.log(msg);
  let thankRegexp = /thank\w*\s*/i;
  let addIntroRegexp = /addIntro\w*\s*/i;
  let getIntroRegexp = /getIntro\w*\s*/i;
  let getPointRegexp = /getPoint\w*\s*/i;
  // when user say 'thanks @username' we increment this user's point
  if(msg.match(thankRegexp)){
    let re = /<@\w*>/i;
    if(msg.match(re)){
      let user = msg.match(re);
      let helped_userid = user.substring(2, user[0].length - 1);
      
      /*
      //get auth-key from db using getToken. 
       database.getToken(req.body.team_domain, channelname, (err, group) => {
       });
      
      helpers.slack('users.info',
                   {
                      token:,
                      user: helped_user
                    })
                    */
    rtm.sendMessage("Hello, <@"+ message.user + ">! You just thanked <@" + helped_userid + ">!", message.channel);
        //rtm.sendMessage("Some one thanked you <@" + message.user + ">! Your helpfulnes score just increased! ", message.channel);
    }
  }
  // when user say 'add intro introContent', we add the introContent to our database
  // actually we might also need to listen for the edit event and then update our database
  if(msg.match(addIntroRegexp)){
    let intro = msg.substr(9);
    if(intro.length > 50){
      rtm.sendMessage("Your Intro is too long!");
    }
    else if(intro.length == 0){
      rtm.sendMessage("Intro is empty! Please tell us something about yourself.");
    }
    else{
      rtm.sendMessage("Intro of <@" + message.user + "> is : " + intro, message.channel);
      database.addIntro(message.user,intro);
    }
  }
  // when user say 'get intro @username', we get the introContent from our database
  if(msg.match(getIntroRegexp)){
    let re = /<@\w*>/i;
    if(msg.match(re)){
      let user = msg.match(re);
      let addIntro_userid = user.substring(2, user[0].length - 1);

    }
  }   
  
});

rtm.start();

