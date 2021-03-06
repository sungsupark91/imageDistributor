const exiftool = require('exiftool-vendored').exiftool;
const Path = require('path');
const StringUtils = require('./util/StringUtils');
const RAW_EXTENSIONS = [
    'CRW',
    'CR2',
    'CR3',
    'NEF',
    'NRW',
    'PEF',
    'DNG',
    'RAF',
    'SRW',
    'ORF',
    'SRF',
    'SR2',
    'ARW',
    'RW2',
    '3FR',
    'DCR',
    'KDC',
    'MRW',
    'RWL',
    'DNG',
    'MOS',
    'X3F',
    'GPR'
];

function getDate(tags) {
    // console.log(tags);

    let date;
    if (tags.CreationDate && tags.CreationDate.year) {
        date = tags.CreationDate;
    } else if (tags.CreateDate && tags.CreateDate.year) {
        date = tags.CreateDate;
    } else if (tags.FileModifyDate && tags.FileModifyDate.year) {
        date = tags.FileModifyDate;
    } else if (tags.ProfileDateTime && tags.ProfileDateTime.year) {
        date = tags.ProfileDateTime;
    }

    return {
        year: date.year.toString().padStart(4, '0'),
        month: date.month.toString().padStart(2, '0'),
        day: date.day.toString().padStart(2, '0'),
        hour: date.hour.toString().padStart(2, '0'),
        minute: date.minute.toString().padStart(2, '0'),
        second: date.second.toString().padStart(2, '0')
    };
}

function getFilmInfo(tags) {
    if (!tags.Aperture || !tags.ShutterSpeed || !tags.FocalLength) {
        return;
    }

    // 슬래시 특수문자여야함
    return `[F${tags.Aperture}][${new String(tags.ShutterSpeed).replace(
        '/',
        '_'
    )}][${
        tags.FocalLengthIn35mmFormat
            ? tags.FocalLengthIn35mmFormat // 환산화각 있으면 그걸로 표기
            : tags.FocalLength
    }]`;
}

module.exports = {
    parseImage: async imagePath => {
        try {
            const tags = await exiftool.read(Path.resolve(imagePath));

            return {
                model: tags.Model,
                isRaw: StringUtils.containsCaseInsensitiveTrim(
                    RAW_EXTENSIONS,
                    tags.FileType
                ),
                isPhone:
                    tags.DeviceType === 'Cell Phone' ||
                    (tags.LensID && tags.LensID.includes('Phone'))
                        ? true
                        : false,
                isVideo: tags.VideoFrameRate ? true : false,
                isScreenshoot: tags.UserComment === 'Screenshot',
                ...getDate(tags),
                type: tags.Model,
                filmInfo: getFilmInfo(tags) || ''
            };
        } catch (e) {
            console.error(e);
        }
    }
};
