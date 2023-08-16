const CONFIG = require("../../config.ts");
const Discord = require("discord.js");
const { keepAlive } = require("./server.ts");

const client = new Discord.Client();

client.once("ready", () => {
    console.log('bot is online as "' + client.user.tag + '"');
});

// logic to be implemented

keepAlive();
client.login(CONFIG.BOT_TOKEN);
