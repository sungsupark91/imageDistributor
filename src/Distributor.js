const FileUtils = require('./util/FileUtils');
const Path = require('path');
const ImageParser = require('./ImageParser');
const cliColor = require('cli-color');
const Profile = require('./profile');
const profile = Profile.profile;

async function run(sourcePath, viewOnly = true) {
    if (!sourcePath) {
        return;
    }

    const originalFileName = Path.basename(sourcePath);
    if (!originalFileName) {
        return;
    }

    const extension = FileUtils.getExtension(originalFileName);
    const originalFileNameWithoutExtension =
        FileUtils.getFileNameWithoutExtension(originalFileName);
    const parentDirectoryPath = Path.dirname(sourcePath);

    if (!Profile.isTargetExtension(extension)) {
        return;
    }

    const pathRule = Profile.resolvePathRule(sourcePath);
    if (!pathRule) {
        return;
    }

    const { from, to, folderFormat, fileFormat } = pathRule;

    // 하위폴더에 들어와있는데 recursive 옵션이 false 인 경우 스킵!
    if (parentDirectoryPath !== from && profile.recursive === false) {
        return;
    }

    const {
        filmInfo,
        isPhone,
        isVideo,
        isRaw,
        model,
        year,
        month,
        day,
        hour,
        minute,
        second
    } = await ImageParser.parseImage(sourcePath);

    let subFolder = '';

    if (isPhone && profile.flags.subFolderByPhone === true) {
        subFolder = 'Phone';
    }

    if (isVideo && profile.flags.subFolderByVideo === true) {
        subFolder = 'Video';
    }

    if (isRaw && profile.flags.subFolderByRaw === true) {
        subFolder = 'Raw';
    }

    // /base/2020/0101
    const targetBasePath = Path.resolve(
        to,
        Profile.resolveFormat(folderFormat, {
            year: year,
            month: month,
            day: day,
            hour: hour,
            minute: minute,
            second: second,
            model: model
        })
    );

    // 0101
    const folderNameWithoutDescription = Path.basename(targetBasePath);

    // /base/2020
    const targetBaseParentPath = Path.resolve(targetBasePath, '..');
    FileUtils.createDirectoryIfNotExists(targetBaseParentPath);

    // "/base/2020 하위에 0101 어디놀러감" 요런 폴더를 찾아서 제공해줌. "1010 어디놀러감" 반환됨
    const folderNameWithDescription = FileUtils.findFolderWithDescription(
        targetBaseParentPath,
        folderNameWithoutDescription
    );

    let newFileName = '';
    if (profile.flags.remainFilmInfo === true && filmInfo) {
        newFileName += `${filmInfo}_`;
    }
    newFileName += `${Profile.resolveFormat(fileFormat, {
        year: year,
        month: month,
        day: day,
        hour: hour,
        minute: minute,
        second: second,
        originalFileName: originalFileNameWithoutExtension,
        model: model
    })}.${extension}`;

    const destinationPath = Path.resolve(
        targetBaseParentPath,
        folderNameWithDescription
            ? folderNameWithDescription
            : folderNameWithoutDescription,
        subFolder,
        newFileName
    );

    console.log(cliColor.yellowBright(`FROM:\t ${sourcePath}`));
    console.log(cliColor.greenBright(`TO:\t ${destinationPath}`));

    if (viewOnly === false) {
        FileUtils.moveFileSync(sourcePath, destinationPath);
    }
}

module.exports = {
    processFile: sourcePath => {
        return run(sourcePath, false);
    },
    previewFile: sourcePath => {
        return run(sourcePath, true);
    }
};
