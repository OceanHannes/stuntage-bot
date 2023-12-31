const fs = require('fs');

const BASE_PATH = './src/resources/db';



function getMapIds() {
    const data = fs.readFileSync(`${BASE_PATH}/maps.csv`, "utf-8");
    const maps = readDataToMaps(data);

    return mapsToMapIds(maps);
}

function readDataToMaps(data) {
    let lines = data.trim().split("\n");

    return lines.reduce((group, line) => {
        line = line.replace("\r", "");
        const tokens = line.split(";");
        group.push({
            mapName: tokens[0],
            mapId: tokens[1],
        });
        return group;
    }, []);
}

function mapsToMapIds(maps) {
    return maps.reduce((group, map) => {
        group.push(map.mapId);
        return group;
    }, []);
}



module.exports = {
    getMapIds
};
