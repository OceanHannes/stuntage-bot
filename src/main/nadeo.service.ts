//https://github.com/The-Firexx/trackmania2020apidocumentation
const backendService = require("./shared/backend.service.ts");
const recordRepository = require("./record.repository.ts");
const mapRepository = require("./map.repository.ts");

const BASE_PATH_PROD_TRACKMANIA = 'https://prod.trackmania.core.nadeo.online';
const BASE_PATH_LIVE_SERVICES = 'https://live-services.trackmania.nadeo.live';
const BASE_PATH_API_TRACKMANIA = 'https://api.trackmania.com';

let levelZeroToken = null;
let levelOneToken = null;
let levelOneRefreshToken = null;
let levelTwoToken = null;
let levelTwoRefreshToken = null;

let apiTrackmaniaClientId = null
let apiTrackmaniaClientSecret = null
let apiTrackmaniaToken = null;



async function login(CONFIG) {
    await loginTokenLevelZero(CONFIG.NADEO_EMAIL, CONFIG.NADEO_PW);
    await loginTokenLevelOne();
    await loginTokenLevelTwo();

    apiTrackmaniaClientId = CONFIG.CLIENT_ID;
    apiTrackmaniaClientSecret = CONFIG.CLIENT_SECRET;
    await loginApiTrackmania();

    console.log("Fully authorized to nadeo services!");
    setTimeout(refreshTokens, 30*60*1000); // 30min
}

async function refreshTokens() {
    try {
        await refreshTokenLevelOne();
        await refreshTokenLevelTwo();

        await loginApiTrackmania();

        console.log("Fully re-authorized to nadeo services!");
        setTimeout(refreshTokens, 30*60*1000); // 30min
    } catch (e) {
        console.log("Exception whilst refreshing Tokens! Trying again in 1 minute. Exception: " + e);
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

async function loginApiTrackmania() {
    const response = await backendService.post(`${BASE_PATH_API_TRACKMANIA}/api/access_token`, {
        "Content-Type": "application/json",
        }, {
        "grant_type": "client_credentials",
        "client_id": apiTrackmaniaClientId,
        "client_secret": apiTrackmaniaClientSecret
    });
    if (!response.ok) { throw new Error('Exception on "loginApiTrackmania"'); }

    const responseData = await response.json();
    apiTrackmaniaToken = responseData.access_token;
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

        let promises = [];
        for (const mapId of mapIds) {
            const promise = getNewMapRecords(mapId);
            promises.push(promise);
        }

        const newRecordEntitiesByMap = await Promise.all(promises);

        let recordEntities = [];
        for (const recordEntity of newRecordEntitiesByMap) {
            recordEntity.forEach(n => {
                recordEntities.push(n);
            });
        }

        return recordRepository.updateAndReturnNewWorldRecords(recordEntities);
    } catch (e) {
        console.log("Exception whilst trying to get new Records! Skipping this cycle. Exception: " + e);
        return [];
    }
}

async function getNewMapRecords(mapId) {
    const response = await backendService.get(`${BASE_PATH_LIVE_SERVICES}/api/token/leaderboard/group/Personal_Best/map/${mapId}/top`, {
        "Authorization": `nadeo_v1 t=${levelTwoToken}`
    });

    const responseData = await response.json();
    const worldRecordsOfMap = responseData.tops.filter(y => y.zoneName === 'World')[0].top;

    const mapInfo = await getMapInfo(mapId);

    let playerRecords = [];
    worldRecordsOfMap.forEach(player => {
        playerRecords.push(player.accountId);
    })
    const playerData = await getPlayerNames(playerRecords);

    let recordEntities = [];

    for (const record of worldRecordsOfMap) {
        const date = await getRecordDate(record.accountId, mapInfo.mapId);
        recordEntities.push({
            player: {
                accountId: record.accountId,
                playerName: playerData[record.accountId],
                position: record.position,
                score: record.score,
                date,
            },
            map: {
                mapId,
                mapName: removeStylingFromStunt(mapInfo.name),
                mapIcon: mapInfo.thumbnailUrl,
            }
        });
    }

    return recordEntities;
}

async function getMapInfo(mapId) {
    const response = await backendService.get(`${BASE_PATH_PROD_TRACKMANIA}/maps?mapUidList=${mapId}`, {
        "Authorization": `nadeo_v1 t=${levelOneToken}`
    });

    const responseData = await response.json();
    return responseData[0];
}

async function getPlayerNames(ids) {
    const response = await backendService.get(`${BASE_PATH_API_TRACKMANIA}/api/display-names?${playerIdsToUrlParameters(ids)}`, {
        "Authorization": `Bearer ${apiTrackmaniaToken}`
    });

    return await response.json();
}

function playerIdsToUrlParameters(ids) {
    let urlParameters = "";
    for (const id of ids) {
        urlParameters = urlParameters + "accountId[]=" + id + "&";
    }
    return urlParameters;
}

async function getRecordDate(accountId, mapUuid) {
    const response = await backendService.get(`${BASE_PATH_PROD_TRACKMANIA}/mapRecords?accountIdList=${accountId}&mapIdList=${mapUuid}`, {
        "Authorization": `nadeo_v1 t=${levelOneToken}`
    });

    const responseData = await response.json();
    return responseData[0].timestamp;
}

function removeStylingFromStunt(name) {
    //https://wiki.trackmania.io/en/content-creation/text-styling
    name = name.replaceAll("$O", "");
    name = name.replaceAll("$o", "");
    name = name.replaceAll("$I", "");
    name = name.replaceAll("$i", "");
    name = name.replaceAll("$W", "");
    name = name.replaceAll("$w", "");
    name = name.replaceAll("$N", "");
    name = name.replaceAll("$n", "");
    name = name.replaceAll("$T", "");
    name = name.replaceAll("$t", "");
    name = name.replaceAll("$S", "");
    name = name.replaceAll("$s", "");
    name = name.replaceAll("$G", "");
    name = name.replaceAll("$g", "");
    name = name.replaceAll("$Z", "");
    name = name.replaceAll("$z", "");
    name = name.replaceAll("$0FCS", "S");
    name = name.replaceAll("$0FDT", "T");
    name = name.replaceAll("$0FEUN", "UN");
    name = name.replaceAll("$0FFT", "T");
    return name;
}



module.exports = {
    login,
    getNewRecords
};
