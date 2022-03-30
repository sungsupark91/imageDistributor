module.exports = {
    apps: [
        {
            name: "수빈",
            script: "src/index.js",
            args: "soobin",
            error_file: "log/soobin_err.log",
            out_file: "log/soobin_out.log",
        },
        {
            name: "스냅",
            script: "src/index.js",
            args: "snap",
            error_file: "log/snap_err.log",
            out_file: "log/snap_out.log",
        },
        {
            name: "Raw",
            script: "src/index.js",
            args: "raw",
            error_file: "log/raw_err.log",
            out_file: "log/raw_out.log",
        },
    ],
};
