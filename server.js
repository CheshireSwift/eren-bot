require('dotenv').config();

const _ = require('lodash');
const Eris = require('eris');
const Roll = require('roll');

//const Firestore = require('@google-cloud/firestore');

const buildCommands = require('./commands');

// const firestore = new Firestore({
//   projectId: 'sw-chars',
//   keyFilename: './.data/keyfile.json',
// });

// firestore.doc('chars/105732874627457024').get().then(doc => {
//   //console.log(doc.data())
// });

const bot = new Eris.CommandClient(
  process.env.DISCORD_BOT_TOKEN,
  {},
  {
    description: 'Savage Worlds helper bot',
    owner: 'Swift',
    prefix: process.env.DISCORD_BOT_PREFIX
  }
);

const characters = {};

const {
  myCharCommand,
  testCommand,
  charsCommand,
  clearCommand,
  initiativeCommand,
  redrawCommand,
  rollCommand,
  charSheetCommand,
  shuffleCommand,
  removeCommand
} = buildCommands({ bot, characters, roll: new Roll() });

bot.registerCommand('mychar', myCharCommand);
bot.registerCommand('testchars', testCommand);
bot.registerCommand('chars', charsCommand);
bot.registerCommand('clearchars', clearCommand);
bot.registerCommand('initiative', initiativeCommand);
bot.registerCommand('redraw', redrawCommand);
bot.registerCommand('draw', redrawCommand);
bot.registerCommand('shuffle', shuffleCommand);
bot.registerCommand('removechar', removeCommand);
//bot.registerCommand('roll', rollCommand);
//bot.registerCommand('charsheet', charSheetCommand);

bot.on('ready', () => {
  console.log(`Ready! Prefix is ${process.env.DISCORD_BOT_PREFIX}`);
});

bot.connect();
