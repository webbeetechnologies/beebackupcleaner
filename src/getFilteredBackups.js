const
    micromatch = require('micromatch'),
    _ = require('lodash'),
    { lstatSync, readdirSync } = require('fs');

const decodeDateFilename = (str) => {
    if(str.match(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/)) {
        return str.replace(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/, "$1-$2-$3 $4:$5")
    }

    // fallback to legacy
    let date = new Date(Date.parse(str.replace(/__VB__/g,':',)
        .replace(/__BV__/g, '.')));

    return date.toUTCString();
};

const getFiles = (directoryPath) => {
    const files = readdirSync(directoryPath);
    return files.filter(p => lstatSync(directoryPath+'/'+p).isFile())
};

module.exports = async (backupRoot, {searchStr, from, to} = {}) => {
    let backupFolderLines = getFiles(backupRoot);

    let backups = [];
    for(let backupLine of backupFolderLines) {
        backupLine = `${backupRoot}/${backupLine}`;

        let matchResult = backupLine.match(/.*\/((.*)\/((\w*)-(\d+-\d+)-(\w+)).tar.gz)/);

        if(!matchResult) {
            continue;
        }

        let backupData = {
            relativePath: matchResult[1],
            name: matchResult[3],
            comment: matchResult[4],
            time: new Date(decodeDateFilename(matchResult[5])),
            installation: matchResult[2],
            commit: matchResult[6],
            path: backupLine
        };

        if(
            searchStr &&
            searchStr.length &&
            !micromatch.isMatch(backupData.name, searchStr) &&
            !micromatch.isMatch(backupData.installation, searchStr) &&
            !micromatch.isMatch(backupData.comment, searchStr)
        ) {
            continue;
        }

        if(from && backupData.time < from) {
            continue;
        }

        if(to && backupData.time > to) {
            continue;
        }

        backups.push(backupData);

    }

    backups = _.orderBy(backups, ['name'], ['desc']);

    return backups;
};
