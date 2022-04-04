const profileName = process.argv[2];
const FileUtils = require('./util/FileUtils');
const Path = require('path');
const StringUtils = require('./util/StringUtils');
const cliColor = require('cli-color');

function resolveFormat(formatStr = '', values = {}) {
    return formatStr
        .replace(/@년/gi, values.year || '')
        .replace(/@월/gi, values.month || '')
        .replace(/@일/gi, values.day || '')
        .replace(/@시/gi, values.hour || '')
        .replace(/@분/gi, values.minute || '')
        .replace(/@초/gi, values.second || '')
        .replace(/@원본/gi, values.originalFileName || '')
        .replace(/@모델명/gi, values.model || '')
        .replace(/\s/g, '_');
}

function resolvePathRule(filePath) {
    for (const pathRule of profile.pathRules) {
        if (filePath.startsWith(pathRule.from)) {
            return pathRule;
        }
    }
}

function checkValidation(profile) {
    if (!profile) {
        console.error('No profile!');
        return false;
    }

    const requiredFields = [
        'targetExtensions',
        'folderFormat',
        'fileFormat',
        'pathRules',
        'flags'
    ];

    const pathRulesRequiredFields = ['from', 'to'];

    const missingFields = [];

    requiredFields.forEach(key => {
        if (!profile.hasOwnProperty(key)) {
            missingFields.push(key);
        }
    });

    pathRulesRequiredFields.forEach(key => {
        profile.pathRules.forEach(pathRule => {
            if (!pathRule.hasOwnProperty(key)) {
                missingFields.push(key);
            }
        });
    });

    console.error('Missing Property: ' + missingFields);
}

function loadProfile() {
    const profilePath = Path.resolve(
        __dirname,
        '..',
        'profiles',
        `${profileName}.json`
    );

    if (!profileName) {
        console.log('프로파일을 선택해주세요.');
        process.exit();
    }

    if (!FileUtils.getFs().existsSync(profilePath)) {
        console.log(`${profileName} does not exists!`);
        process.exit();
    }

    const profile = require(profilePath);

    if (!profileName) {
        console.log('Please pass profile path!');
        process.exit();
    }

    // if (!checkValidation(profile)) {
    //     console.error('Invalid profile!');
    //     console.log(profile);
    //     process.exit();
    // }

    // 디렉터리 기본 생성
    profile.pathRules.forEach(pathRule => {
        const fromPath = Path.resolve(profile.sourceBasePath, pathRule.from);
        FileUtils.createDirectoryIfNotExists(fromPath);

        const toPath = pathRule.to;
        FileUtils.createDirectoryIfNotExists(toPath);
    });

    return profile;
}

function isTargetExtension(extension) {
    return StringUtils.containsCaseInsensitiveTrim(
        profile.targetExtensions,
        extension
    );
}

function describeProfile(profile) {
    const describeFormatExample = format => {
        return `(예: ${resolveFormat(format, {
            year: '2022',
            month: '02',
            day: '02',
            hour: '02',
            minute: '02',
            second: '02',
            originalFileName: 'DSC1001',
            model: 'X100V'
        })})`;
    };

    const showFlag = flag => {
        return `${
            flag === true ? cliColor.green('활성') : cliColor.red('비활성')
        }`;
    };

    const description = `
${cliColor.bold.cyan(
    `---------------------- 프로필(${profileName}) 설명 ------------------------------`
)}
    * 대상 확장자: ${cliColor.bold.blueBright(
        `${profile.targetExtensions.join(', ')}`
    )}
    (대상 확장자만 대상폴더로 자동 이동됩니다)
    
    - 이동 경로${profile.pathRules
        .map((pathRule, index) => {
            let desc = `
    * 경로 ${index + 1}
        - 파일 감시 폴더: ${cliColor.underline(pathRule.from)}
        - 이동 대상 폴더: ${cliColor.underline(pathRule.to)}
        (파일감시폴더에서 파일을 감지하여 이동대상폴더로 이동시킵니다)
        `;

            if (pathRule.folderFormat) {
                desc += `
        - 개별 폴더 포멧: ${pathRule.folderFormat} ${describeFormatExample(
                    pathRule.folderFormat
                )}`;
            }

            if (pathRule.fileFormat) {
                desc += `
        - 개별 파일 포멧: ${pathRule.fileFormat} ${describeFormatExample(
                    pathRule.fileFormat
                )}`;
            }
            return desc;
        })
        .join('\n')}
    
    * 옵션값:
        - 스마트폰촬영 서브 폴더 생성: ${showFlag(
            profile.flags.subFolderByPhone
        )}
        (스마트폰으로 촬영된 것이 확인되면 /Phone 이라는 하위폴더에 생성합니다.)

        - 필름 정보 파일명에 기록: ${showFlag(profile.flags.remainFilmInfo)}
        (조리개, 셔터스피드, 초점거리의 정보가 있다면 [F4.0][1_1000][35mm] 같은 형식으로 파일명 앞에 기록합니다.)            

        - RAW 촬영 서브 폴더 생성: ${showFlag(profile.flags.subFolderByRaw)}
        (RAW 촬영 정보일 경우 RAW 이름의 서브 폴더를 생성하여 이동합니다)

        - VIDEO 서브 폴더 생성: ${showFlag(profile.flags.remainFilmInfo)}
        (동영상인 경우 VIDEO 서브폴더에 이동합니다)

        - 설명이 있는 폴더 우선으로 파일 이동: ${showFlag(
            profile.flags.folderWithDescription
        )}
        ("2021-01-01" 폴더로 파일이 이동하려고 하는데 만약 "2021-01-01 가족사진" 이라는 폴더가 있다면, 새로 "2021-01-01" 폴더를 생성하지 않고 기존 폴더에 이동을 합니다.
        비활성인 경우 항상 "2021-01-01" 폴더로 이동됩니다.)

        - 폴링 방식으로 백그라운드 파일 감지: ${showFlag(
            profile.flags.usePolling
        )}
        (기본값: false. 백그라운드 파일 감지에 문제가 생기면 true 로 변경해보세요.)
${cliColor.bold.cyan(
    `----------------------------------------------------------------------------`
)}
`;
    console.log(description);
}

// singleton
const profile = loadProfile();
module.exports = {
    profile,
    describe: () => {
        describeProfile(profile);
    },
    isTargetExtension,
    getTargetPath: () => {
        return profile.pathRules.map(it => it.to);
    },
    getSourcePaths: () => {
        return profile.pathRules.map(it => it.from);
    },
    resolvePathRule,
    resolveFormat
};
