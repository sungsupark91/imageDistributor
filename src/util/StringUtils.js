module.exports = {
    containsCaseInsensitiveTrim: (strs, targetStr) => {
        if (!strs || !targetStr) return false;
        return strs
            .map((str) => str.trim().toUpperCase())
            .includes(targetStr.toUpperCase().trim());
    },
};
