/**
 * This adds tooling settings to our config
 *
 * @name bootstrap
 */

'use strict';

module.exports = function(lando) {

    // Modules
    var _ = lando.node._;

    // Add tooling module to lando
    lando.events.on('post-bootstrap', 1, function(lando) {

        // Log
        lando.log.info('Initializing tooling');

        // Add the SSH command
        lando.tasks.add('platform', require('./tasks/platform')(lando));

    });

};