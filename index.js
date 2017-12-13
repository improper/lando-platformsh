/**
 * Su SSH plugin
 *
 * @name su
 */

'use strict';

module.exports = function(lando) {

    // Add tooling settings to the global config
    require('./lib/bootstrap')(lando);

};