const exiftool = require("exiftool-vendored").exiftool;
const Path = require("path");

function getDate(tags) {
    // console.log(tags);
    // console.log(tags.CreationDate);
    // console.log(tags.CreateDate);
    // console.log(tags.ProfileDateTime);
    // console.log(tags.FileModifyDate);

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
        year: date.year.toString().padStart(4, "0"),
        month: date.month.toString().padStart(2, "0"),
        day: date.day.toString().padStart(2, "0"),
        hour: date.hour.toString().padStart(2, "0"),
        minute: date.minute.toString().padStart(2, "0"),
        second: date.second.toString().padStart(2, "0"),
    };
}

function getFilmInfo(tags) {
    if (!tags.Aperture || !tags.ShutterSpeed || !tags.FocalLength) {
        return;
    }

    return `[F${tags.Aperture}][${tags.ShutterSpeed.replace("/", "\\")}][${
        tags.FocalLength
    }]`;
}

module.exports = {
    parseImage: async (imagePath) => {
        try {
            const tags = await exiftool.read(Path.resolve(imagePath));

            const isPhone =
                tags.DeviceType === "Cell Phone" ||
                (tags.LensID && tags.LensID.includes("Phone"));

            return {
                isPhone,
                isScreenshoot: tags.UserComment === "Screenshot",
                ...getDate(tags),
                type: tags.Model,
                filmInfo: getFilmInfo(tags),
            };
        } catch (e) {
            console.error(e);
        }
    },
};
