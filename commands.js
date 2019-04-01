const _ = require('lodash');
require('lodash.product');

const JOKER = [Infinity, Infinity];
const ranks = _.range(2, 15);
const suits = _.range(1, 5);
const deck = _.concat(_.product(ranks, suits), [JOKER, JOKER]);

let drawnCards = [];
let lastInitiativeMessage = Promise.resolve();

function prettyCard(card) {
  if (card === JOKER) {
    return ':sparkles::black_joker::sparkles:';
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

function remainingDeck() {
  return _(deck)
    .reject(card => _(drawnCards).find(drawnCard => _.isEqual(drawnCard, card)))
    .shuffle();
};

function buildCommands({ bot, characters, roll } = {}) {
  return {
    myCharCommand: async (msg, args) => {
      const char = {
        name: args[0] || msg.author.username,
        player: msg.author.username,
        icon_url: msg.author.avatarURL,
      };

      characters[msg.author.id] = char;

      return {
        content: 'Registered Character',
        embed: {
          title: `Character ${char.name} registered for player ${msg.author.username}`,
          author: char,
        },
      }
    },
    
    testCommand: async (msg, args) => {
      _.forEach(msg.channel.guild.members.filter(m => m.bot), bot => {
        characters[bot.username] = {
          name: bot.nick || bot.username,
          player: bot.username,
          icon_url: bot.avatarURL,
        };
      });
      
      return 'Registered bot characters'
    },
    charsCommand: async (msg, args) => {
      _.forEach(characters, char => {
        bot.createMessage(msg.channel.id, { embed: { author: char } });
      });
    },

    clearCommand: async (msg, args) => {
      _.forEach(characters, (char, key) => {
        _.unset(characters, key);
      });
      
      return 'Unregistered all characters.';
    },

    removeCommand: async (msg, args) => {
      if (args.length === 0) {
        const char = characters[msg.author.id]
        if (char) {
          _.unset(characters, msg.author.id)
          return `Unregistered ${char.name}.`
        } else {
          return `No character registered for ${msg.author.username}.`
        }
      }

      const found = []
      _.forEach(characters, (char, key) => {
        if (_.includes(args, char.name) || _.includes(args, char.player)) {
          _.unset(characters, key)
          found.push(char.name)
        }
      })

      return `Unregistered ${found.join(', ')}.`;
    },
    
    initiativeCommand: async (msg, args) => {
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

      if (drawnCards.includes(JOKER)) {
        drawnCards = [];
      }

      const newCards = remainingDeck()
        .take(actors.length)
        .value();

      drawnCards.push(...newCards);

      const rows = _(newCards)
        .zip(actors)
        .sortBy('0.0', '0.1').reverse()
        .map(([card, actor], i, pairs) => ({
          Character: `${icon(actor.player, i, pairs.length)} ${actor.name} (${actor.player || 'NPC' })`,
          Order: `**${prettyCard(card)}**`,
        }))
        .value();

      lastInitiativeMessage = bot.createMessage(msg.channel.id, {
        embed: {
          title: 'Initiative Order',
          color: 0xFF5000,
          fields: _.map(['Order', 'Character'], row => ({
            name: row,
            value: _.map(rows, row).join('\n'),
            inline: true
          })),
        }
      })
    },

    shuffleCommand: async msg => {
      drawnCards = [];
      return 'Shuffled deck';
    },
    
    redrawCommand: async msg => {
      if (drawnCards.length >= deck.length) {
        return 'Deck is empty!';
      }
      
      const newCard = remainingDeck().first();

      drawnCards.push(newCard);
      
      //const message = await lastInitiativeMessage;
      //lastInitiativeMessage = message.edit({ embed: { description: 'waffle' } });

      return {
        embed: {
          title: 'New Card',
          color: 0xFF5000,
          author: characters[msg.author.username],
          description: `**${prettyCard(newCard)}**`,
        },
      };
    },

    rollCommand: (msg, args) => {
      return {
        embed: {
          title: 'Dice roll result',
          author: msg.author,
          fields: _.map(args, arg => {
            if (!roll.validate(arg)) {
              return {
                name: arg,
                value: 'Invalid roll :dizzy_face:',
                inline: true,
              };
            }

            const { rolled, result } = roll.roll(arg);
            return {
              name: arg,
              value: `**${result}** (${rolled.join(', ')})`,
              inline: true,
            }
          }),
        },
      };
    },

    charSheetCommand: async (msg, args) => {

    },
  };
}

module.exports = buildCommands;
