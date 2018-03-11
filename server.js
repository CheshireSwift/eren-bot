const Eris = require('eris');
 
const bot = new Eris(process.env.DISCORD_BOT_TOKEN);
 
bot.on('ready', () => {
    console.log('Ready!');
});
 
bot.on('messageCreate', (msg) => {
    if(msg.content.includes('1337')) {
        bot.createMessage(msg.channel.id, 'damn it');
    }
});
 
bot.connect();