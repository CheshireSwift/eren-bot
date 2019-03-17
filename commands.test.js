/* global jest describe it xit expect beforeEach afterEach */
Math.random = () => 0; // Deliberately break Math.random so that we can get known results.
const _ = require('lodash');

const buildCommands = require('./commands');

describe('the bot commands', () => {
  const channel = { id: 123 };
  
  describe('character registry', () => {
    it('adds new characters with the `mychar` command', async () => {
      const characters = {};
      const { myCharCommand } = buildCommands({ characters })
      
      const charName = 'Zarathur the Inhospitable'
      const author = {
        username: 'Alice',
        id: '1234',
      };
      
      const msg = { author };
      const args = [charName];
      const response = await myCharCommand(msg, args);
      
      expect(response.embed.title).toMatch(charName);
      expect(response.embed.title).toMatch(author.username);
      expect(characters[msg.author.id]).toMatchObject({ name: charName, player: author.username });
    });
    
    it('lists all characters with the `chars`command', async () => {
      const bot = {
        createMessage: jest.fn(),
      };
      const characters = {
        1234: { name: 'Waffles', player: 'Alice' },
        5678: { name: 'Pickles', player: 'Bob' },
      };
      
      const { charsCommand } = buildCommands({ bot, characters })
      
      const msg = { channel };
      await charsCommand(msg);
      
      _.forEach(characters, character => {
        expect(bot.createMessage).toHaveBeenCalledWith(channel.id, {embed: { author: character } });
      });
    });
    
    it('is cleared (all characters deleted) with the `clearChars` command', async () => {
      const characters = {
        a: 1,
        b: 2,
      };
      
      const { clearCommand } = buildCommands({ characters });
      
      await clearCommand();
      
      expect(_.isEmpty(characters)).toBe(true);
    });
  });
  
  describe('initiative', () => {
    const message = {
      edit: jest.fn(),
    }
    
    let lastMessage
    const bot = {
      createMessage: (channelId, messageToSend) => {
        lastMessage = messageToSend;
        return Promise.resolve(message);
      },
    }
      
    it('is drawn initiative for all registered characters and the specified NPCs', async () => {
      const characters = {
        Alice: { name: 'Waffles' },
        Bob: { name: 'Pickles' },
      };

      const { initiativeCommand } = buildCommands({ characters, bot });

      const msg = { channel };
      const args = ['Gribbly'];
      await initiativeCommand(msg, args);
      const response = lastMessage;

      const [cardsField, charsField] = response.embed.fields;

      expect(cardsField.value.split('\n')).toHaveLength(3);
      expect(charsField.value.split('\n')).toHaveLength(3);

      _.forEach(characters, char => {
        expect(charsField.value).toMatch(char.name);
      });

      _.forEach(args, npc => {
        expect(charsField.value).toMatch(npc);
      });
    });

    describe('redrawing', () => {
      const characters = {
        Alice: { name: 'Foo', player: 'Alice' },
        Bob: { name: 'Bar', player: 'Bob' },
        Carolyn: { name: 'Baz', player: 'Carolyn' },
        Dave:  { name: 'Quirk', player: 'Dave' },
      };

      it('deals a fresh initiative card for the player who requested it', async () => {
        const username = 'Carolyn';
        const msg = { author: { username }, channel };
        
        const { initiativeCommand, redrawCommand } = buildCommands({ characters, bot });

        await initiativeCommand(msg);

        const initiativeDraw = lastMessage;

        const cardsField = initiativeDraw.embed.fields[0];

        expect(cardsField.value).toMatch(':spades:2')
        expect(cardsField.value).toMatch(':hearts:2')
        expect(cardsField.value).toMatch(':diamonds:2')
        expect(cardsField.value).toMatch(':clubs:2')

        const { embed } = await redrawCommand(msg);
        expect(embed.author).toBe(characters[username]);
        expect(embed.description).toMatch(':spades:3');
      });

      xit('updates the previous initiative message when the card is redrawn', async () => {
        const { initiativeCommand, redrawCommand } = buildCommands({ characters, bot });
        
        await initiativeCommand({ author: {}, channel });
        const [cardsField, charsField] = lastMessage.embed.fields;
        const cards = cardsField.value.split('\n');
        const chars = charsField.value.split('\n');

        const thirdChar = chars[2];
        const thirdPerson = /\((.*)\)/.exec(thirdChar)[1];
        await redrawCommand({ author: { username: thirdPerson }, channel });

        expect(message.edit).toHaveBeenCalled();
      });
    });
  });
  
  it('roll');
  
  it('charsheet');
});