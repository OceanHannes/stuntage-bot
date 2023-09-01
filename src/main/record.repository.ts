const fs = require('fs');

const BASE_PATH = './src/resources/db';



function updateAndReturnNewWorldRecords(newRecords) {
    const data = fs.readFileSync(`${BASE_PATH}/records.csv`, "utf-8");
    const savedRecords = readDataToRecords(data);
    saveRecords(newRecords);

    return getChangedWorldRecords(savedRecords, newRecords);
}

function readDataToRecords(data) {
    const lines = data.trim().split("\n");

    return lines.reduce((group, line) => {
        line = line.replace("\r", "");
        const tokens = line.split(";");
        group.push({
            player: {
                accountId: tokens[1],
                playerName: tokens[2],
                position: tokens[3],
                score: tokens[0],
                date: tokens[4],
            },
            map: {
                mapId: tokens[5],
                mapName: tokens[6],
                mapIcon: tokens[7],
            }
        });
        return group;
    }, []);
}

function saveRecords(records) {
    fs.writeFileSync(`${BASE_PATH}/records.csv`, recordsToString(records));
}

function recordsToString(records) {
    return records.reduce((group, record) => {
        return group + `${record.player.score};${record.player.accountId};${record.player.playerName};${record.player.position};${record.player.date};${record.map.mapId};${record.map.mapName};${record.map.mapIcon}\n`;
    }, "");
}

function getChangedWorldRecords(oldRecordList, newRecordList) {
    let newRecords = [];
    newRecordList.forEach(n => {
        const entryOnInteresting = oldRecordList.filter(o => (
            n.map.mapId == o.map.mapId &&
            o.player.position == 1 &&
            n.player.position == 1
        ));

        if (entryOnInteresting.length > 0) {
            const entryOnExisting = entryOnInteresting.filter(o => (
                n.player.accountId == o.player.accountId &&
                n.player.score == o.player.score
            ));

            if (entryOnExisting.length === 0) {
                const o = entryOnInteresting[0];
                newRecords.push({
                    newWrHolder: {
                        accountId: n.player.accountId,
                        playerName: n.player.playerName,
                        score: n.player.score,
                        position: n.player.position,
                        date: n.player.date,
                    },
                    oldWrHolder: {
                        accountId: o.player.accountId,
                        playerName: o.player.playerName,
                        score: o.player.score,
                    },
                    map: {
                        mapId: n.map.mapId,
                        mapName: n.map.mapName,
                        mapIcon: n.map.mapIcon,
                    },
                });
            }
        }
    });
    return newRecords;
}



module.exports = {
    updateAndReturnNewWorldRecords
};
