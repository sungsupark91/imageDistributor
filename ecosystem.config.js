module.exports = {
    apps: [
        {
            name: 'Background',
            script: 'src/background.js',
            args: 'profile',
            error_file: 'log/error.log',
            out_file: 'log/out.log'
        }
    ]
};
