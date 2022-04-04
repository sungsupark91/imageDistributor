const inquirer = require('inquirer');
const cliColor = require('cli-color');
const Profile = require('./Profile');
const Distributor = require('./Distributor');
const FileUtils = require('./util/FileUtils');
const pm2 = require('pm2');
const AsciiArt = require('./ascii/AsciiArt');

async function checkBackgroundOnline() {
    return new Promise((res, rej) => {
        pm2.connect(function (err) {
            if (err) {
                console.error(err);
                process.exit(2);
            }

            pm2.describe('Background', (err, list) => {
                if (err || !list) {
                    console.error(err);
                    pm2.disconnect();
                    res(false);
                }
                try {
                    res(list[0].pm2_env.status === 'online');
                } catch (e) {
                    res(false);
                }
            });
        });
    });
}

async function startBackground() {
    return new Promise((res, rej) => {
        pm2.connect(function (err) {
            if (err) {
                console.error(err);
                process.exit(2);
            }

            pm2.start(
                {
                    name: 'Background',
                    script: 'src/background.js',
                    args: 'profile',
                    error_file: 'log/error.log',
                    out_file: 'log/out.log'
                },

                (err, apps) => {
                    if (err) {
                        console.error(err);
                        rej(pm2.disconnect());
                    }

                    res(true);
                }
            );
        });
    });
}

async function stopBackground() {
    return new Promise((res, rej) => {
        pm2.connect(function (err) {
            if (err) {
                console.error(err);
                process.exit(2);
            }

            pm2.delete('Background', (err, apps) => {
                if (err) {
                    console.error(err);
                    pm2.disconnect();
                    res(false);
                }

                res(true);
            });
        });
    });
}

async function confirm(msg, yesMsg = '네', noMsg = '아니요') {
    const { y } = await inquirer.prompt([
        {
            type: 'list',
            name: 'y',
            message: msg,
            choices: [yesMsg, noMsg]
        }
    ]);

    return y == yesMsg;
}

async function pressAnyKeyToContinue() {
    return await inquirer.prompt([
        {
            name: 'continue',
            message: '메뉴로 돌아가려면 아무 키나 입력하세요...\n'
        }
    ]);
}

async function processAllNewFilesFromSourcePaths(cb) {
    const filePaths = [];

    Profile.getSourcePaths().forEach(path => {
        const allFiles = FileUtils.getAllFilesInPath(path);

        filePaths.push(...allFiles);
    });

    return Promise.all(filePaths.map(cb));
}

async function promptActionsUntilExit() {
    console.clear();
    const isBackgroundOnline = await checkBackgroundOnline();
    console.log(cliColor.bold.yellow(AsciiArt.title));

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: '어떤 작업을 원하시나요?',
            loop: false,
            choices: [
                {
                    name: '프로필 설정 보기',
                    value: async () => {
                        Profile.describe();
                        await pressAnyKeyToContinue();
                    }
                },
                // {
                //     name: '이미지 분류 프리뷰',
                //     value: async () => {
                //         if (
                //             await confirm(
                //                 '이 작업은 시간이 조금 소요될 수 있어요. 진행할까요?'
                //             )
                //         ) {
                //             await processAllNewFilesFromSourcePaths(
                //                 Distributor.previewFile
                //             );

                //             console.log(
                //                 cliColor.blueBright(
                //                     `확인하고 이상 없으면 "이미지 분류 실행" 메뉴를 실행해서 파일을 옮기셔도 됩니다.`
                //                 )
                //             );

                //             await pressAnyKeyToContinue();
                //         }
                //     }
                // },
                // new inquirer.Separator(),
                // {
                //     name: '이미지 분류 실행',
                //     value: async () => {
                //         if (
                //             await confirm(
                //                 '이미지가 모두 대상 경로로 이동됩니다. 처리가 끝나면 프로그램은 자동 종료됩니다. 진행할까요?'
                //             )
                //         ) {
                //             await processAllNewFilesFromSourcePaths(
                //                 Distributor.processFile
                //             );

                //             console.log(
                //                 cliColor.blueBright(`작업을 끝냈습니다.`)
                //             );

                //             await pressAnyKeyToContinue();
                //         }
                //     }
                // },
                (() => {
                    if (isBackgroundOnline) {
                        return new inquirer.Separator(
                            '백그라운드에서 이미지 분류 실행(이미 실행중)'
                        );
                    }

                    return {
                        name: `백그라운드에서 이미지 분류 실행`,
                        value: async () => {
                            if ((await checkBackgroundOnline()) === true) {
                                console.log(
                                    '이미 백그라운드에서 동작중입니다.'
                                );
                                await pressAnyKeyToContinue();
                                return;
                            }

                            if (
                                await confirm(
                                    `백그라운드에서 계속 파일이 추가될 때마다 자동으로 이동됩니다. 백그라운드 실행 후 프로그램은 종료됩니다. 진행할까요?`
                                )
                            ) {
                                await startBackground();
                                console.log(
                                    cliColor.blueBright(
                                        `백그라운드에서 이미지 분류를 시작했습니다. 앞으로 이미지는 자동감지되어 처리됩니다.`
                                    )
                                );
                                await pressAnyKeyToContinue();
                            }
                        }
                    };
                })(),
                (() => {
                    if (!isBackgroundOnline) {
                        return new inquirer.Separator(
                            '백그라운드 종료 (실행중인 작업 없음)'
                        );
                    }
                    return {
                        name: '백그라운드 종료',
                        value: async () => {
                            if (
                                await confirm(
                                    `백그라운드에서 프로그램은 종료됩니다. 진행할까요?`
                                )
                            ) {
                                await stopBackground();
                                console.log(
                                    cliColor.blueBright(
                                        `백그라운드를 종료했습니다.`
                                    )
                                );
                                await pressAnyKeyToContinue();
                            }
                        }
                    };
                })(),
                new inquirer.Separator(),
                {
                    name: '개발자 컨텍',
                    value: async () => {
                        console.log(cliColor.magentaBright(AsciiArt.sungsu));
                        await pressAnyKeyToContinue();
                    }
                },
                {
                    name: '프로그램 종료',
                    value: async () => {
                        if (await confirm('종료할까요?')) {
                            process.exit();
                        }
                    }
                }
            ]
        }
    ]);

    if (!(await action())) {
        promptActionsUntilExit();
    }
}

async function main() {
    console.clear();
    console.log(
        cliColor.bold.red.bold(
            '!!! 이 프로그램을 사용하고나서 발생하는 어떠한 문제에 대해서 개발자는 책임지지 않습니다. \n!!!사용법을 충분히 숙지하고 실행해주세요.'
        )
    );

    if (!(await confirm('동의하시나요?'))) {
        console.log(
            '프로그램을 사용하기 위해서는 동의가 필요합니다. 프로그램을 종료할게요..ㅠ^ㅠ'
        );
        return process.exit();
    }

    console.log('동의해주셔서 감사합니다!\n\n');
    promptActionsUntilExit();
}

main();
