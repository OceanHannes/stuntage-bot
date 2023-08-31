//https://github.com/The-Firexx/trackmania2020apidocumentation
const backendService = require("./shared/backend.service.ts");
const recordRepository = require("./record.repository.ts");
const mapRepository = require("./map.repository.ts");

const BASE_PATH_PROD_TRACKMANIA = 'https://prod.trackmania.core.nadeo.online';
const BASE_PATH_LIVE_SERVICES = 'https://live-services.trackmania.nadeo.live';

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
    setTimeout(refreshTokens, 30*60*1000); // 30min
}

async function refreshTokens() {
    try {
        await refreshTokenLevelOne();
        await refreshTokenLevelTwo();
        console.log("Fully re-authorized to nadeo services!");
        setTimeout(refreshTokens, 30*60*1000); // 30min
    } catch (e) {
        console.log("Exception whilst refreshing Tokens! Trying again in 1 minute.");
        setTimeout(refreshTokens, 1000); // 1min
    }
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
    if (!response.ok) { throw new Error('Exception on "loginTokenLevelZero"'); }

    const responseData = await response.json();
    levelZeroToken = responseData.ticket;
}

async function loginTokenLevelOne() {
    const response = await backendService.post(`${BASE_PATH_PROD_TRACKMANIA}/v2/authentication/token/ubiservices`, {
        "Authorization": `ubi_v1 t=${levelZeroToken}`,
        "Content-Type": "application/json",
    });
    if (!response.ok) { throw new Error('Exception on "loginTokenLevelOne"'); }

    const responseData = await response.json();
    levelOneToken = responseData.accessToken;
    levelOneRefreshToken = responseData.refreshToken;
}

async function loginTokenLevelTwo() {
    const response = await backendService.post(`${BASE_PATH_PROD_TRACKMANIA}/v2/authentication/token/nadeoservices`, {
        "Authorization": `nadeo_v1 t=${levelOneToken}`,
        "Content-Type": "application/json",
        }, {
        "audience": "NadeoLiveServices",
    });
    if (!response.ok) { throw new Error('Exception on "loginTokenLevelTwo"'); }

    const responseData = await response.json();
    levelTwoToken = responseData.accessToken;
    levelTwoRefreshToken = responseData.refreshToken;
}

async function refreshTokenLevelOne() {
    const response = await backendService.post(`${BASE_PATH_PROD_TRACKMANIA}/v2/authentication/token/refresh`, {
        "Authorization": `nadeo_v1 t=${levelOneRefreshToken}`,
        "Content-Type": "application/json",
    });
    if (!response.ok) { throw new Error('Exception on "refreshTokenLevelOne"'); }

    const responseData = await response.json();
    levelOneToken = responseData.accessToken;
    levelOneRefreshToken = responseData.refreshToken;
}

async function refreshTokenLevelTwo() {
    const response = await backendService.post(`${BASE_PATH_PROD_TRACKMANIA}/v2/authentication/token/refresh`, {
        "Authorization": `nadeo_v1 t=${levelTwoRefreshToken}`,
        "Content-Type": "application/json",
    });
    if (!response.ok) { throw new Error('Exception on "refreshTokenLevelTwo"'); }

    const responseData = await response.json();
    levelTwoToken = responseData.accessToken;
    levelTwoRefreshToken = responseData.refreshToken;
}

async function getNewRecords() {
    try {
        const mapIds = mapRepository.getMapIds();

        let recordEntities = [];
        for (const mapId of mapIds) {
            const newRecordEntities = await getNewMapRecords(mapId);
            newRecordEntities.forEach(n => {
                recordEntities.push(n);
            });
        }

        return recordRepository.updateAndReturnNewWorldRecords(recordEntities);
    } catch (e) {
        console.log("Exception whilst trying to get new Records! Skipping this cycle.");
        return [];
    }
}

async function getNewMapRecords(mapId) {
    const response = await backendService.get(`${BASE_PATH_LIVE_SERVICES}/api/token/leaderboard/group/Personal_Best/map/${mapId}/top`, {
        "Authorization": `nadeo_v1 t=${levelTwoToken}`
    });

    const responseData = await response.json();
    const worldRecordsOfMap = responseData.tops.filter(y => y.zoneName === 'World')[0].top;

    const mapName = await getMapName(mapId);

    let playerRecords = [];
    worldRecordsOfMap.forEach(player => {
        playerRecords.push(player.accountId);
    })
    const playerData = await getPlayerNames(playerRecords);

    let recordEntities = [];
    worldRecordsOfMap.forEach(record => {
        recordEntities.push({
            accountId: record.accountId,
            displayName: playerData.filter(p => p.accountId === record.accountId)[0].displayName,
            mapId: mapId,
            mapName: mapName,
            position: record.position,
            score: record.score,
        });
    });

    return recordEntities;
}

async function getMapName(mapId) {
    const response = await backendService.get(`${BASE_PATH_PROD_TRACKMANIA}/maps?mapUidList=${mapId}`, {
        "Authorization": `nadeo_v1 t=${levelOneToken}`
    });

    const responseData = await response.json();
    return removeStylingFromStunt(responseData[0].name);
}

async function getPlayerNames(ids) {
    const response = await backendService.get(`${BASE_PATH_PROD_TRACKMANIA}/accounts/displayNames/?accountIdList=${ids}`, {
        "Authorization": `nadeo_v1 t=${levelOneToken}`
    });

    return await response.json();
}

function removeStylingFromStunt(name) {
    //https://wiki.trackmania.io/en/content-creation/text-styling
    return name.replace("$w$s$0FCS$0FDT$0FEUN$0FFT$Z", "STUNT");
}



module.exports = {
    login,
    getNewRecords
};
