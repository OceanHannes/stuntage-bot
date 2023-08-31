// long term: a switch to Java will be made: https://github.com/discord-jda/JDA
const CONFIG = require("../../config.ts");
const Discord = require("discord.js");
const keepAlive = require("./server.ts");

const nadeoService = require("./nadeo.service.ts");
const discordService = require("./discord.service.ts");

const client = new Discord.Client();

let cycleNumber = 0;

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
    cycleNumber++;
    console.log(`CycleNumber: ${cycleNumber}`);
    setTimeout(loop, 30*60*1000); // 30min
    nadeoService.getNewRecords()
        .then(records => {
            console.log(`finished CycleNumber: ${cycleNumber}`);
            if (records.length > 0) {
                discordService.sendNewRecords(client, CONFIG.DISCORD_SERVER, CONFIG.DISCORD_CHANNEL, records);
            }
        });
}

//##################################################

keepAlive();
client.login(CONFIG.BOT_TOKEN);
