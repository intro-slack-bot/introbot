const express = require("express");
const bodyParser = require('body-parser');
//database related functions
const database = require("./database.js");
//helper functions
const helpers = require("./helpers.js");

//initialize bot interaction using RTM client
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS; //to handle messages
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

var bot_token = process.env.SLACK_BOT_TOKEN || '';

var rtm = new RtmClient(bot_token);

let channel;

const app = express();
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  // Show a cute slack button
  res.end(`<a href="#">
            <img alt="Add to Slack" height="40" width="139" 
            src="https://platform.slack-edge.com/img/add_to_slack.png" 
            srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x,
            https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" />
          </a>`)
});

app.get('/auth', (req, res) => {
  // Prepare Data for Slack Auth
  let data = {
    client_id: process.env.SLACK_CLIENT_ID, 
    client_secret: process.env.SLACK_CLIENT_SECRET, 
    code: req.query.code 
  };
  
  // POST the data to slack access endpoint
  helpers.slack('oauth.access', data)
  .then((body) => {
    // Slack User Token
    let pBody = JSON.parse(body)
    let token = pBody.access_token;
    let user = pBody.user_id;
    let team_id = pBody.team_id;
    let team_name = pBody.team_name; 
    
    
    // store the {team -> token}
    database.storeToken(team_name, team_id, user, token);
    res.redirect(`https://pankaja-shree.github.io/sns-splash/redirect.html`);
  }).catch(res.end);

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
rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {//@why we need to write in ES5 style here?
  let msg = message.text.toLowerCase();
  console.log(msg);
  let thankRegexp = /thank\w*\s*/i;
  let addIntroRegexp =
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
  
  
});

rtm.start();

