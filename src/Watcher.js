const chokidar = require('chokidar');

const FileUtils = require('./util/FileUtils');

const watchers = []; // singleton watcher

function init(sourcePaths, usePolling = false, onCopyDoneEvent) {
    if (watchers !== undefined && watchers.length > 0) {
        return;
    }

    sourcePaths.forEach(srcPath => {
        const watcher = chokidar.watch(srcPath, {
            persistent: true,
            usePolling: usePolling
        });

        watcher.on('add', srcPath => {
            console.log(srcPath);
            FileUtils.executeAfterFileCopyIsDone(srcPath, () => {
                onCopyDoneEvent(srcPath);
            });
        });

        watchers.push(watcher);
    });
}

module.exports = { init };
