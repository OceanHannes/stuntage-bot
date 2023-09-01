const { PermissionsBitField } = require("discord.js");

let Discord;
let client;
let guild;
let channel;
let me;
let oceanhannes;

async function setup(setupDiscord, setupClient, serverId, channelId) {
    Discord = setupDiscord;
    client = setupClient;
    guild = await client.guilds.fetch(serverId);
    channel = await guild.channels.fetch(channelId);
    me = await guild.members.fetchMe();
    oceanhannes = await guild.members.fetch('364758573437419520')
        .then(member => member.user);
}

function sendNewRecords(records) {
    if(me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
        records.forEach(record => {
            const card = new Discord.EmbedBuilder()
                .setColor(0x00F0E0)
                .setTitle(record.map.mapName)
                .setThumbnail(record.map.mapIcon)
                .setDescription('A no-lifer has achieved the impossible!')
                .addFields(
                    { name: 'Player', value: record.newWrHolder.playerName },
                    { name: '\u200B', value: '\u200B' },
                    { name: 'New WR Time', value: `${scoreToTime(record.newWrHolder.score)}s`, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: 'Diff', value: `-${scoreToTime(record.oldWrHolder.score - record.newWrHolder.score)}s`, inline: true },
                    { name: 'Date', value: timestampToUnix(record.newWrHolder.date), inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: 'Old WR-holder', value: record.oldWrHolder.playerName, inline: true },
                    { name: '\u200B', value: '\u200B' },
                )
                .setFooter({ text: 'Bot by OceanHannes', iconURL: oceanhannes.avatarURL() });

            channel.send({ embeds: [card] });
            //channel.send(`A new WR has been driven on **${record.mapName}** by **${record.playerName}**:   **${scoreToTime(record.score)}**`);
        });
    } else
    {
        console.log("no permission to send message in guild: " + guild.name);
    }
}

function scoreToTime(score) {
    const ms = score % 1000;
    score = (score - ms) / 1000;
    const sec = score % 60;
    score = (score - sec) / 60;
    const min = score;

    const ms_string = ('00' + ms).slice(-3);
    const sec_string = ('00' + sec).slice(-2);
    const min_string = ('00' + min).slice(-2);

    return min_string + ':' + sec_string + '.' + ms_string;
}

function timestampToUnix(timestamp) {
    return `<t:${Date.parse(timestamp)/1000}:f>`;
}



module.exports = {
    setup,
    sendNewRecords
};
