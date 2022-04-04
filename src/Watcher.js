const chokidar = require('chokidar');
const Profile = require('./Profile');
const FileUtils = require('./util/FileUtils');
const watchers = []; // singleton watcher

function init(onCopyDoneEvent) {
    if (watchers !== undefined && watchers.length > 0) {
        return;
    }

    const sourcePaths = Profile.getSourcePaths();

    sourcePaths.forEach(sourcePath => {
        const watcher = chokidar.watch(sourcePath, {
            persistent: true,
            usePolling: Profile.profile.flags.usePolling
        });

        watcher.on('add', addedFilePath => {
            // 시놀로지 대응
            if (addedFilePath.includes('@eaDir')) {
                FileUtils.removeEaDir(addedFilePath);
                return;
            }

            const extension = FileUtils.getExtension(addedFilePath);
            if (!Profile.isTargetExtension(extension)) {
                return;
            }

            FileUtils.executeAfterFileCopyIsDone(addedFilePath, () => {
                onCopyDoneEvent(addedFilePath);
            });
        });

        watchers.push(watcher);
    });
}

module.exports = { init };
