//https://github.com/The-Firexx/trackmania2020apidocumentation
const backendService = require("./shared/backend.service.ts")

const BASE_PATH = 'https://prod.trackmania.core.nadeo.online';

let levelZeroToken = null;
let levelOneToken = null;
let levelOneRefreshToken = null;
let levelTwoToken = null;
let levelTwoRefreshToken = null;



async function login(email, password) {
    await loginTokenLevelZero(email, password);
    await loginTokenLevelOne();
    await loginTokenLevelTwo();
    console.log("Fully authorized to nadeo services!");
    // TODO: tokens should be refreshed every 12h
}

async function loginTokenLevelZero(email, password) {
    const appendedString = `${email}:${password}`;
    const basicEncodedString = btoa(appendedString);
    const response = await backendService.post("https://public-ubiservices.ubi.com/v3/profiles/sessions", {
        "Authorization": `Basic ${basicEncodedString}`,
        "Ubi-AppId": "86263886-327a-4328-ac69-527f0d20a237",
        "Ubi-RequestedPlatformType": "uplay",
        "Content-Type": "application/json",
        "User-Agent": "PostmanRuntime/7.28.4",  // basically just a random value: I took this one from the documentation
    });
    const responseData = await response.json();
    levelZeroToken = responseData.ticket;
}

async function loginTokenLevelOne() {
    const response = await backendService.post(`${BASE_PATH}/v2/authentication/token/ubiservices`, {
        "Authorization": `ubi_v1 t=${levelZeroToken}`,
        "Content-Type": "application/json",
    });
    const responseData = await response.json();
    levelOneToken = responseData.accessToken;
    levelOneRefreshToken = responseData.refreshToken;
}

async function loginTokenLevelTwo() {
    const response = await backendService.post(`${BASE_PATH}/v2/authentication/token/nadeoservices`, {
        "Authorization": `nadeo_v1 t=${levelOneToken}`,
        "Content-Type": "application/json",
        }, {
        "audience": "NadeoLiveServices",
    });
    const responseData = await response.json();
    levelTwoToken = responseData.accessToken;
    levelTwoRefreshToken = responseData.refreshToken;
}



module.exports = {
    login,
};
