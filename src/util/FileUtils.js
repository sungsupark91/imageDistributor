const fs = require('fs');
const Path = require('path');

function createDirectoryIfNotExists(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true }, console.error);
    }
}

function resolveFileName(path, i = 0) {
    if (!fs.existsSync(path)) {
        return path;
    }

    const fileName = Path.basename(path);
    const extension = fileName.split('.').pop();
    const fileNameWithoutExtension = fileName.split(`.${extension}`)[0];

    const newPath = Path.resolve(
        Path.dirname(path),
        `${fileNameWithoutExtension}_(${i}).${extension}`
    );
    if (!fs.existsSync(newPath)) {
        return newPath;
    }

    return resolveFileName(path, i + 1);
}

async function moveFileSync(sourcePath, destinationPath) {
    try {
        fs.mkdirSync(Path.dirname(destinationPath), { recursive: true });
        fs.renameSync(sourcePath, resolveFileName(destinationPath));
    } catch (e) {
        console.error(e);
    }
}

// dirPath에 하위폴더 중 BaseName 으로 시작하는 폴더가 있으면 반환함.
function findFolderWithDescription(dirPathFrom, findBaseName) {
    return fs
        .readdirSync(dirPathFrom)
        .filter(fileOrDir =>
            fs.statSync(Path.resolve(dirPathFrom, fileOrDir)).isDirectory()
        )
        .map(dir => dir.trim())
        .find(dir => dir.startsWith(findBaseName));
}

function getAllFilesInPath(path, recursive = false) {
    return fs
        .readdirSync(path)
        .map(fileOrDir => {
            const currentPath = Path.resolve(path, fileOrDir);
            if (fs.statSync(currentPath).isDirectory() && recursive === true) {
                return getAllFilesInPath(currentPath, recursive);
            }
            return currentPath;
        })
        .flat(10);
}

function executeAfterFileCopyIsDone(path, doneCb, previousMtimeMs) {
    if (!previousMtimeMs) {
        previousMtimeMs = fs.statSync(path).mtimeMs;
    }

    fs.stat(path, function (err, stat) {
        if (err) {
            console.error(err);
            return;
        }

        const currentMtimeMs = stat.mtimeMs;
        if (stat.size > 0 && currentMtimeMs === previousMtimeMs) {
            doneCb();
        } else {
            setTimeout(() => {
                executeAfterFileCopyIsDone(path, doneCb, currentMtimeMs);
            }, 1000);
        }
    });
}

function getExtension(fileName) {
    return fileName.split('.').pop();
}

function getFileNameWithoutExtension(fileName) {
    const ext = getExtension(fileName);
    if (!ext) {
        return fileName;
    }
    return fileName.split(`.${ext}`)[0];
}

function getFs() {
    return fs;
}

module.exports = {
    getFs,
    createDirectoryIfNotExists,
    resolveFileName,
    moveFileSync,
    findFolderWithDescription,
    executeAfterFileCopyIsDone,
    getExtension,
    getFileNameWithoutExtension,
    getAllFilesInPath
};
