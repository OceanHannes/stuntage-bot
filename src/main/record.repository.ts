const fs = require('fs');

const BASE_PATH = './src/resources/db';



async function updateAndReturnNewWorldRecords(newRecords) {
    const data = fs.readFileSync(`${BASE_PATH}/records.csv`, "utf-8");
    const savedRecords = readDataToRecords(data);
    saveRecords(newRecords);

    return getChangedWorldRecords(savedRecords, newRecords);
}

function readDataToRecords(data) {
    const lines = data.trim().split("\r\n");

    return lines.reduce((group, line) => {
        const tokens = line.split(";");
        group.push({
            accountId: tokens[0],
            displayName: tokens[1],
            mapId: tokens[2],
            mapName: tokens[3],
            position: tokens[4],
            score: tokens[5],
        });
        return group;
    }, []);
}

function saveRecords(records) {
    fs.writeFileSync(`${BASE_PATH}/test.csv`, recordsToString(records));
}

function recordsToString(records) {
    return records.reduce((group, record) => {
        return group + `${record.accountId};${record.displayName};${record.mapId};${record.mapName};${record.position};${record.score}\r\n`;
    }, "");
}

function getChangedWorldRecords(oldRecordList, newRecordList) {
    let newRecords = [];
    newRecordList.forEach(n => {
        const entryOnInteresting = oldRecordList.filter(o => (
            n.mapId == o.mapId &&
            o.position == 1 &&
            n.position == 1
        ));

        if (entryOnInteresting.length > 0) {
            const entryOnExisting = entryOnInteresting.filter(o => (
                n.accountId == o.accountId &&
                n.score == o.score
            ));

            if (entryOnExisting.length === 0) {
                newRecords.push(n);
            }
        }
    });
    return newRecords;
}



module.exports = {
    updateAndReturnNewWorldRecords
};
