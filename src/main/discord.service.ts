
function sendNewRecords(client, serverId, channelId, records) {
    const guild = client.guilds.cache.get(serverId);
    const channel = guild.channels.cache.get(channelId);

    if(guild.me.hasPermission("SEND_MESSAGES")) {
        records.forEach(record => {
            channel.send(`A new WR has been driven on **${record.mapName}** by **${record.displayName}**:   **${scoreToTime(record.score)}**`);
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



module.exports = {
    sendNewRecords
};
