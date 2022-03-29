module.exports = {
    Default: (obj, defaultValue) => {
        return obj === undefined ? defaultValue : obj;
    },
};
