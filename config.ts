const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
    path: path.resolve(__dirname, `${process.env.NODE_ENV}.env`)
});

module.exports = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    BOT_TOKEN: process.env.BOT_TOKEN,
    NADEO_EMAIL: process.env.NADEO_EMAIL,
    NADEO_PW: process.env.NADEO_PW,
    DISCORD_SERVER: process.env.DISCORD_SERVER,
    DISCORD_CHANNEL: process.env.DISCORD_CHANNEL,
}
