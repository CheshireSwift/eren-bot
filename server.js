const _ = require('lodash');
const Eris = require('eris');
require('lodash.product');

const JOKER = [Infinity, Infinity];
const ranks = _.range(2, 15);
const suits = _.range(1, 5);
const deck = _.concat(_.product(ranks, suits), [JOKER]);

let characters = {};
let drawnCards = _([]);

const bot = new Eris.CommandClient(process.env.DISCORD_BOT_TOKEN, {}, {
  description: 'Savage Worlds helper bot',
  owner: 'Swift',
  prefix: process.env.DISCORD_BOT_PREFIX,
});
 
bot.on('ready', () => {
  console.log(`Ready! Prefix is ${process.env.DISCORD_BOT_PREFIX}`);
});

bot.registerCommand('mychar', (msg, args) => {
  const char = {
    name: args[0] || msg.author.username,
    player: msg.author.username,
    icon_url: msg.author.avatarURL,
  };
  
  characters[msg.author.username] = char;
  
  return {
    content: 'Registered Character',
    embed: {
      title: `Character ${char.name} registered for player ${msg.author.username}`,
      author: char,
    },
  }
});

bot.registerCommand('testchars', (msg, args) => {
  _.forEach(msg.channel.guild.members.filter(m => m.bot), bot => {
    characters[bot.username] = {
      name: bot.username,
      player: bot.username,
      icon_url: bot.avatarURL,
    };
  });
});

bot.registerCommand('chars', (msg, args) => {
  _.forEach(characters, char => {
    bot.createMessage(msg.channel.id, { embed: { author: char } });
  });
});

bot.registerCommand('clearchars', (msg, args) => {
  characters = {};
  return 'Unregistered all characters.';
});

function prettyCard(card) {
  if (card === JOKER) {
    return ':black_joker:';
  }

  const [rank, suit] = card;
  const prettyRank = {
    11: 'J',
    12: 'Q',
    13: 'K',
    14: 'A',
  };

  const prettySuit = {
    1: ':spades:',
    2: ':hearts:',
    3: ':diamonds:',
    4: ':clubs:',
  };

  return prettySuit[suit] + (prettyRank[rank] || rank);
};

bot.registerCommand('initiative', (msg, args) => {
  const tempActors = _.map(args, name => ({ name }));
  const actors = _.concat(_.values(characters), tempActors);
  
  if (actors.length === 0) {
    return 'Need to know who to draw initiative for.';
  } else if (actors.length > deck.length) {
    return 'DOES NOT COMPUTE';
  }
  
  function prettyNth(numberN) {
    const n = '' + (numberN + 1);
    const suffix = {
      1: 'st',
      2: 'nd',
      3: 'rd',
    }[_.last(n)] || 'th';
    
    return n + suffix;
  }
  
  function icon(player, i, total) {
    const playerEmoji = [
      ':grin:',
      ':grinning:',
      ':slight_smile:', ':slight_smile:', ':slight_smile:',
      ':confused:', ':confused:',
      ':scream:',
    ];
    const npcEmoji = [
      ':japanese_ogre:',
      ':smiling_imp:', ':smiling_imp:',
      ':imp:',
    ];
    
    const emojiSet = player ? playerEmoji : npcEmoji;
    const index = _.min([i, emojiSet.length - 1]);
    return emojiSet[index];
  }
  
  drawnCards = _(deck)
    .shuffle()
    .take(actors.length);
  
  const rows = drawnCards
    .zip(actors)
    .sortBy('0.0', '0.1').reverse()
    .map(([card, actor], i, pairs) => ({
      Character: `${icon(actor.player, i, pairs.length)} ${actor.name} (${actor.player || 'NPC' })`,
      Order: `**${prettyCard(card)}**`,
    }))
    .value();

  return {
    embed: {
      title: 'Initiative Order',
      color: 0xFF5000,
      fields: _.map(['Order', 'Character'], row => ({
        name: row,
        value: _.map(rows, row).join('\n'),
        inline: true
      })),
    }
  };
});

bot.registerCommand('redraw', (msg, args) => {
  const newCard = _(deck)
    .without(drawnCards)
    .shuffle()
    .first();
  
  drawnCards.push(newCard);
  
  return {
    embed: {
      title: 'New Card',
      color: 0xFF5000,
      author: characters[msg.author.username],
      description: `**${prettyCard(newCard)}**`,
    },
  };
});
 
bot.connect();