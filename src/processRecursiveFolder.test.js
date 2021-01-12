const processRecursiveFolder = require('./processRecursiveFolder')

test('processRecursiveFolder', async () => {
    const {backupsToKeep, backupsToDelete} = await processRecursiveFolder('./testbackups', {
        recent: 1,
        all: 7,
        daily: 14,
        weekly: 4,
        monthly: 3,
        maxdelete: 30,
        force: false,
        dry: true,
        recursive: 2
    }, new Date('2021-01-12T21:22:42.376Z'))

    const backupsToDeletePaths = backupsToDelete.map(b => b.relativePath);

    expect(backupsToDeletePaths.indexOf('malte/nocomment-20210101-1733-7d9fec1c2.tar.gz')).toBeLessThan(0);
    expect(backupsToDeletePaths.indexOf('malte/nocomment-20201205-1733-7d9fec1c2.tar.gz')).toBeLessThan(0);
    expect(backupsToDeletePaths.indexOf('malte/nocomment-20201114-1733-7d9fec1c2.tar.gz')).toBeLessThan(0);
    expect(backupsToDeletePaths.indexOf('malte/nocomment-20201025-1733-7d9fec1c2.tar.gz')).toBeLessThan(0);

    expect(backupsToDeletePaths.indexOf('tobias/nocomment-20210111-1733-7d9fec1c2.tar.gz')).toBeLessThan(0);
    expect(backupsToDeletePaths.indexOf('tobias/nocomment-20201221-1733-7d9fec1c2.tar.gz')).toBeLessThan(0);


    expect(backupsToDeletePaths.indexOf('malte/nocomment-20201201-1733-7d9fec1c2.tar.gz')).toBeGreaterThan(-1);
    expect(backupsToDeletePaths.indexOf('malte/nocomment-20200901-1733-7d9fec1c2.tar.gz')).toBeGreaterThan(-1);
    expect(backupsToDeletePaths.indexOf('malte/nocomment-20200928-1733-7d9fec1c2.tar.gz')).toBeGreaterThan(-1);
    expect(backupsToDeletePaths.indexOf('malte/nocomment-20201002-1733-7d9fec1c2.tar.gz')).toBeGreaterThan(-1);

    expect(backupsToDeletePaths.indexOf('tobias/nocomment-20120322-1733-7d9fec1c2.tar.gz')).toBeGreaterThan(-1);
    expect(backupsToDeletePaths.indexOf('tobias/nocomment-20120327-1733-7d9fec1c2.tar.gz')).toBeGreaterThan(-1);
    expect(backupsToDeletePaths.indexOf('tobias/nocomment-20201220-1733-7d9fec1c2.tar.gz')).toBeGreaterThan(-1);
});