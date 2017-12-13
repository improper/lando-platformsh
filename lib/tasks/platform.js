/**
 * Command to destroy a lando app
 *
 * @name destroy
 */

'use strict';

module.exports = function (lando) {

    // Modules
    var _ = lando.node._;

    var landoGlobalOptions = ['_', '$0', 'service', 'appname'];

    function getOptionsAsArray(options) {
        var optionsAsArray = [];
        for (var option in options) {
            if (options.hasOwnProperty(option)) {
                optionsAsArray[option] = options[option];
            }
        }
        return optionsAsArray;
    }

// The task object
    return {
        // Options can be detected within the command string by using `[optionName]`
        // Example: 'platform [command]`
        command: 'platform [command]',
        describe: 'Execute platform.sh cli within appserver',
        options: {},
        run: function (options) {
            var platformPath = '/var/www/.platformsh/bin/platform';
            // Handle our options
            if (!_.has(options, 'service') && _.has(options, 'appname')) {
                options.service = options.appname;
                options.appname = undefined;
            }
            // Try to get the app if we can
            return lando.app.get(options.appname)

            // Handle app or no app
                .then(function (app) {

                    // We have an app so lets try to build a ssh exec
                    if (app) {

                        // Default to appserver if we have no second arg
                        var service = options.service || 'appserver';

                        var run;

                        var platformCommandArgs, platformArgs = "";
                        // Let's check to see if the app has been started
                        return lando.app.isRunning(app)

                        // If not let's make sure we start it
                            .then(function (isRunning) {
                                if (!isRunning) {
                                    return lando.app.start(app);
                                }
                            })

                            .then(function () {
                                platformCommandArgs = getOptionsAsArray(options);
                                landoGlobalOptions.forEach(function (optionId) {
                                    delete platformCommandArgs[optionId];
                                });
                            })

                            // Only allow command as an argument
                            .then(function () {
                                delete platformCommandArgs['command'];
                            })

                            .then(function () {
                                Object.keys(platformCommandArgs).forEach(function (key) {
                                    if (key.length == 1) {
                                        platformArgs += " -" + key;
                                        return;
                                    }
                                    platformArgs += " --" + key + "=" + platformCommandArgs[key];
                                });
                            })
                            .then(function () {
                                options.command = options.command || '';
                            })
                            // Build command
                            .then(function () {
                                run = {
                                    id: [app.dockerName, service, '1'].join('_'),
                                    compose: app.compose,
                                    project: app.name,
                                    cmd: 'cd $LANDO_MOUNT && ' + platformPath + ' ' + options.command + ' ' + platformArgs,
                                    opts: {
                                        app: app,
                                        mode: 'attach',
                                        user: options.user || 'www-data',
                                        services: [service]
                                    }
                                };
                            })
                            // Exec
                            .then(function () {
                                    var fs = require('fs'),
                                        userCmd = run.cmd,
                                        testCmd = 'cd $LANDO_MOUNT && ' + platformPath + ' --quiet';
                                    run.cmd = testCmd;

                                    let hasPlatformBin = () => {
                                        return new Promise((resolve, reject) => {
                                            let cmdFindPlatformCli = `ls ${platformPath} 2>/dev/null  >/dev/null`;
                                            run.cmd = cmdFindPlatformCli;

                                            return lando.engine.run(run)
                                                .then((result) => {
                                                    resolve("Installed")
                                                })
                                                .catch((result) => {
                                                    reject("Could not find platform at path " + platformPath)
                                                })
                                                .finally(function (result) {
                                                    run.cmd = userCmd;
                                                });
                                        });
                                    };
                                    let installPlatform = () => {
                                        return new Promise((resolve, reject) => {
                                            console.log("Installing Platform.sh");
                                            let installCommand = 'cd $LANDO_MOUNT ' +
                                                '&& curl -sS https://platform.sh/cli/installer  2> /dev/null | php 2> /dev/null 2> /dev/null';
                                            run.cmd = installCommand;

                                            return lando.engine.run(run)
                                                .then((result) => {
                                                    resolve(result)
                                                })
                                                .catch((result) => {
                                                    reject("Could not install Platform Cli on " + service)
                                                })
                                                .finally(function (result) {
                                                    run.cmd = userCmd;
                                                });
                                        })
                                    };
                                    let runUserCmd = () => {
                                        return new Promise((resolve, reject) => {
                                            run.cmd = userCmd;

                                            return lando.engine.run(run)
                                                .then((result) => {
                                                    resolve(result)
                                                })
                                                .catch((result) => {
                                                    reject("There was a problem executing your Platform Cli command")
                                                })
                                        })
                                    };
                                    let killAppWithError = (message) => {
                                        throw message;
                                        process.exit(1);
                                    };
                                    hasPlatformBin()
                                        .catch(() => {return installPlatform()})
                                        .catch(() => { return killAppWithError("Failed to install platform.sh on specified service: "+ service)})
                                        .then(() => { return runUserCmd()})
                                }
                            );

                    }

                    // Warn user we couldn't find an app
                    else {
                        lando.log.warn('Could not find app in this dir');
                    }

                });

        }
    }
        ;

}
;