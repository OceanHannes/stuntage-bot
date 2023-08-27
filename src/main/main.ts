// long term: a switch to Java will be made: https://github.com/discord-jda/JDA
const CONFIG = require("../../config.ts");
const Discord = require("discord.js");
const { keepAlive } = require("./server.ts");

const nadeoService = require("./nadeo.service.ts");

const client = new Discord.Client();

//##################################################

client.once("ready", () => {
    console.log(`Bot is online as "${client.user.tag}"!`);
    nadeoService.login(CONFIG.NADEO_EMAIL, CONFIG.NADEO_PW)
        .then(loop);
});

//##################################################

client.on("message", (message) => {
});

//##################################################

function loop() {
    setTimeout(loop,10*1000); // 10s
    nadeoService.getNewRecords();
}

//##################################################

keepAlive();
client.login(CONFIG.BOT_TOKEN);
