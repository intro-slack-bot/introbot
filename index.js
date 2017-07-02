//initialize bot interaction using RTM client
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS; //to handle messages
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

var bot_token = process.env.SLACK_BOT_TOKEN || '';

var rtm = new RtmClient(bot_token);

let channel;

// The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  for (const c of rtmStartData.channels) {
    if (c.is_member && c.name ==='general') { channel = c.id }
  }
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
  console.log(rtmStartData.channels);
});

//post an opening message when the bot is added to a channel
// you need to wait for the client to fully connect before you can send messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
  rtm.sendMessage("Hello! Thanks for adding intro-bot!", channel);
});

//handling message events
rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  let mesg = message.text.toLowerCase();
  if(message.text.includes('thanks')){
        rtm.sendMessage("Hello <@" + message.user + ">!", message.channel);
  }
});

rtm.start();

