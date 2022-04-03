const Watcher = require('./Watcher');
const Profile = require('./Profile');
const Distributor = require('./Distributor');

Watcher.init(
    Profile.getSourcePaths(),
    Profile.profile.flags.usePolling,
    Distributor.processFile
);
