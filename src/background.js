const Watcher = require('./Watcher');
const Distributor = require('./Distributor');

Watcher.init(Distributor.processFile);
