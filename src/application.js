const
    program = require('commander'),
    processRecursiveFolder = require('./processRecursiveFolder'),
    { createLogger, format, transports }  = require('winston');


const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: {},
    transports: [
        new transports.Console({
            format: format.combine(
                format.simple()
            )
        })
    ]
});


const runAndExitOnError = (closure) => {
    return async (...args) => {
        try {
            await closure(...args);
        } catch(err) {
            console.error(err);
        }

        process.exit(0);
    }
};

program
    .command('clean <folder>')
    .option('--recent <recent>', 'Number of most recent backups to always keep', 1)
    .option('--all <all>', 'Number of days for which to keep all backups', 7)
    .option('--daily <daily>', 'Number of days for which to keep most recent records', 14)
    .option('--weekly <weekly>', 'Number of weeks for which to keep one backup each', 4)
    .option('--monthly <monthly>', 'Number of months for which to keep one backup each', 3)
    .option('--maxdelete <maxdelete>', 'If more backups than this number are found, dont delete them (use --force if you are sure of what you are doing).', 30)
    .option('--force <force>', 'force deletion', false)
    .option('--dry', 'dont do anything, just try and log', false)
    .option('--recursive <recursive>', 'scan directories recursively for levels (default: 1 means non-recursive, 2 would mean to also scan subfolders, 3 also the subfolders of subfolders)', 1)

    .action(runAndExitOnError(async (folder, options) => {
        logger.info('started backup cleaning');
        try {
            const {backupsToKeep, backupsToDelete} = await processRecursiveFolder(folder, options, new Date('2021-01-12T21:22:42.376Z'))
            logger.info('KEPT: '+JSON.stringify(backupsToKeep.map(b => b.relativePath)));
            logger.info('REMOVED: '+JSON.stringify(backupsToDelete.map(b => b.relativePath)));
            logger.info('done cleaning backups');
        } catch(err) {
            logger.error(err);
        }

    }));

program.parse(process.argv);

// malte
// test should keep tobias/nocomment-20210111-1733-7d9fec1c2.tar because its most recent and we keep 1 recent always
// test should keep tobias/nocomment-20201221-1733-7d9fec1c2.tar because we keep one backup each months for the last 3 months

// tobias
// test should keep tobias/nocomment-20210111-1733-7d9fec1c2.tar because its most recent and we keep 1 recent always
// test should keep tobias/nocomment-20201221-1733-7d9fec1c2.tar because we keep one backup each months for the last 3 months