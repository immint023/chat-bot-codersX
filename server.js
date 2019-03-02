require('dotenv').config();
const fs = require("fs");
const login = require("facebook-chat-api");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

login({ email: process.env.EMAIL, password: process.env.PASSWORD }, async (err, api) => {
  if (err) {
    switch (err.error) {
      case 'login-approval':
        console.log('Enter code > ');
        rl.on('line', (line) => {
          err.continue(line);
          rl.close();
        });
        break;
      default:
        console.error(err);
    };
  };
  const receiver = process.env.RECEIVER;
  fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));

  api.setOptions({ forceLogin: true, selfListen: false, logLevel: "silent", listenEvents: true });
  api.listen(function callback(err, message) {
    if (message.body) {
      const messageTrimed = message.body.trim();
      const isNotice = messageTrimed.indexOf('!!') === 0;
      const messageSplit = messageTrimed.split('!!');
      if (isNotice) {

        api.getThreadInfo(message.threadID, function (err, thread) {

          if (err) return console.error(err);

          api.getUserInfo(thread.snippetSender, (err, ret) => {
            if (err) return console.error(err);
            const sender = ret[thread.snippetSender].name;
            const _message = `${sender}: ${messageSplit[1]}`;
            api.sendMessage(_message, receiver);
          });

        });
      };
    };
  });
});