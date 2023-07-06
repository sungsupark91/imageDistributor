const chokidar = require('chokidar');
const FileUtils = require('./util/FileUtils');
const { previewFile } = require('./Distributor')
const watchers = []; // singleton watcher

const watcher = chokidar.watch("C://Users/sungs/Desktop/편집/테스트", {
    persistent: true,
    usePolling: true
});

watcher.on('add', addedFilePath => {
    // 시놀로지 대응
    if (addedFilePath.includes('@eaDir')) {
        FileUtils.removeEaDir(addedFilePath);
        return;
    }

    const extension = FileUtils.getExtension(addedFilePath);

    FileUtils.executeAfterFileCopyIsDone(addedFilePath, () => {
        console.log(addedFilePath);
        previewFile(addedFilePath);
    });
});

watchers.push(watcher);