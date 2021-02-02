const
    _ = require('lodash'),
    getFilteredBackups = require('./getFilteredBackups'),
    subDays = require('date-fns/subDays'),
    sub = require('date-fns/sub'),
    format = require('date-fns/format'),
    getWeek = require('date-fns/getWeek'),
    fs = require('fs-extra');

const { lstatSync, readdirSync } = require('fs')
const { join } = require('path')

const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source =>
    readdirSync(source).map(name => join(source, name)).filter(isDirectory)


module.exports = async (folder, options, referenceDate = new Date()) => {

    const groupKeep = (backups, grouper, subtractQuery) => {
        let filteredBackups = backups.filter((b) => {
            const subtractedReferenceDate = sub(referenceDate, subtractQuery);
            return b.time > subtractedReferenceDate;
        });


        filteredBackups =  _.uniqBy(filteredBackups, ({time}) => {
            return _.isFunction(grouper) ? grouper(time)
                : format(time, grouper);
        });

        return filteredBackups;
    };

    const processFolder = async (folder, options) => {
        const allBackups = await getFilteredBackups(folder);
        if(allBackups.length < 1) { return {backupsToKeep: [], backupsToDelete: [] } }

        // keep the recent backups and all
        let backupsToKeep = allBackups
            .filter(({time}, i) => {
                if(i < options.recent) {
                    return true;
                }

                if(time > subDays(referenceDate, options.all)) {
                    return true;
                }

                return false;
            })

        // let dkeep = groupKeep(allBackups, 'yyyy-MM-dd', {days: options.daily});
        backupsToKeep = backupsToKeep.concat(groupKeep(allBackups, 'yyyy-MM-dd', {days: options.daily}));
        backupsToKeep = backupsToKeep.concat(groupKeep(allBackups, time => format(time, 'yyyy-MM')+'-WN-'+getWeek(time), {weeks: options.weekly}));
        backupsToKeep = backupsToKeep.concat(groupKeep(allBackups, 'yyyy-MM', {months: options.monthly}));

        backupsToKeep = _.uniqBy(backupsToKeep, 'name');

        const backupsToDelete = allBackups.filter(a => backupsToKeep.indexOf(a) < 0)
        _

        // console.log(backupsToKeep);
        // console.log(backupsToDelete);

        return {backupsToKeep, backupsToDelete};
    }

    const processFolderRecursively = async (folder, options, depth = 0) => {
        // console.log('processFolderRecursively', folder, depth)
        if(depth >= options.recursive) {
            // console.log('processFolderRecursively depth >= options.recursive', folder, depth)
            return {backupsToKeep: [], backupsToDelete: []};
        }

        depth++;

        let allBackupsToKeep  = [];
        let allBackupsToDelete  = [];

        const folderBackups = await processFolder(folder, options);
        allBackupsToKeep = folderBackups.backupsToKeep;
        allBackupsToDelete = folderBackups.backupsToDelete;

        const subDirs = getDirectories(folder);
        for(let i = 0; i < subDirs.length; i++) {
            const theStuff = await processFolderRecursively(subDirs[i], options, depth);
            // console.log('processFolderRecursively', theStuff)
            const {backupsToKeep, backupsToDelete} = theStuff;

            allBackupsToKeep = allBackupsToKeep.concat(backupsToKeep);
            allBackupsToDelete = allBackupsToDelete.concat(backupsToDelete);
        }

        return {backupsToKeep: allBackupsToKeep, backupsToDelete: allBackupsToDelete};
    };

    const {backupsToKeep, backupsToDelete} = await processFolderRecursively(folder, options);
    if(!options.force && backupsToDelete.length > options.maxdelete) {
        throw new Error('Cowardly refusing to delete more than '+options.maxdelete+' files. If you know what you are doing, use the force option. May the force be with you.');
    }

    if(!options.dry) {
        for(let backup of backupsToDelete) {
            await fs.unlink(backup.path);
        }
    }
    return {backupsToKeep, backupsToDelete};
};

//a
//b
//c
//d
//e
//f