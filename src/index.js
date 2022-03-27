const fs = require("fs");
const Path = require("path");
const ImageParser = require("./ImageParser");
const chokidar = require("chokidar");

const profileName = process.argv[2];

process.setMaxListeners(100);

if (!profileName) {
    console.log("Please pass profile path!");
    process.exit();
}

const profilePath = Path.resolve(
    __dirname,
    "..",
    "profiles",
    `${profileName}.json`
);

if (!fs.existsSync(profilePath)) {
    console.log(`${profileName} does not exists!`);
    process.exit();
}

const profile = require(profilePath);
console.log(profile);
// ~~ private functions
function createDirectoryIfNotExists(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true }, console.error);
    }
}

function isTarget(fileName) {
    if (!fileName) {
        return false;
    }

    return containsCaseInsensitiveTrim(
        profile.targetExtensions,
        getExtension(fileName)
    );
}

function getExtension(fileName) {
    return fileName.split(".").pop();
}

function containsCaseInsensitiveTrim(strs, targetStr) {
    if (!strs || !targetStr) return false;
    return strs
        .map((str) => str.trim().toUpperCase())
        .includes(targetStr.toUpperCase().trim());
}

// 룰 없으면 반환 안함
function getRuleByExtension(extension) {
    for (setting of profile.rules.filter((setting) => setting.use === true)) {
        if (containsCaseInsensitiveTrim(setting.targetExtensions, extension)) {
            return setting;
        }
    }
}

// function

// 파일이 존재할 경우 신규 파일
function renameFileIfNeeded(path, i = 0) {
    if (!fs.existsSync(path)) {
        return path;
    }

    const fileName = Path.basename(path);
    const extension = fileName.split(".").pop();
    const fileNameWithoutExtension = fileName.split(`.${extension}`)[0];

    const newPath = Path.resolve(
        Path.dirname(path),
        `${fileNameWithoutExtension}_(${i}).${extension}`
    );
    if (!fs.existsSync(newPath)) {
        return newPath;
    }

    return renameFileIfNeeded(path, i + 1);
}

// ~~ main
createDirectoryIfNotExists(profile.sourceBasePath);
createDirectoryIfNotExists(profile.destinationBasePath);

async function moveFileSync(sourcePath, destinationPath) {
    try {
        fs.mkdirSync(Path.dirname(destinationPath), { recursive: true });
        fs.renameSync(sourcePath, renameFileIfNeeded(destinationPath));
    } catch (e) {
        console.error(e);
    }
}

async function distributeFile(sourcePath) {
    const { filmInfo, isPhone, year, month, day, hour, minute, second } =
        await ImageParser.parseImage(sourcePath);
    const extension = getExtension(Path.basename(sourcePath));
    const rule = getRuleByExtension(extension);
    let subDirectory;
    if (rule) {
        subDirectory = rule.subDirectoryName;
    }

    // FIXME: 프로필로 관리
    if (isPhone) {
        subDirectory = "Phone";
    }

    const destinationPath = Path.resolve(
        profile.destinationBasePath,
        year,
        `${month}${day}`,
        subDirectory ? subDirectory : "",
        `${
            !isPhone && filmInfo ? `${filmInfo}_` : ""
        }${hour}시${minute}분${second}초.${extension}`
    );

    console.log(`New Path: ${destinationPath}`);
    moveFileSync(sourcePath, destinationPath);
}

// Initialize watcher.
const watcher = chokidar.watch(profile.sourceBasePath, {
    persistent: true,
    usePolling: false,
});

watcher.on("add", (path) => {
    // source 최상위 폴더에 들어오는 이미지가 아닌 경우 처리하지 않는다.
    if (Path.dirname(path) !== profile.sourceBasePath) {
        return;
    }

    if (!isTarget(path)) {
        return;
    }

    executeAfterFileCopyIsDone(path, fs.statSync(path).mtimeMs, () => {
        console.log(`Distributing ${path}...`);
        distributeFile(path);
    });
});

function executeAfterFileCopyIsDone(path, previousMtimeMs, doneCb) {
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
                executeAfterFileCopyIsDone(path, currentMtimeMs, doneCb);
            }, 1000);
        }
    });
}
