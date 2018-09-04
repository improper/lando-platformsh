[NOT PRODUCTION READY] 

## Lando Platformsh

Lando Platformsh allows developers exeute Platformsh Cli commands from within Lando services.

## Install

1. `yarn add lando-platformsh -d`
2. If Lando Plugin Anywhere is not already installed, execute: `./node_modules/.bin/lando-pa.js` or, if it is installed globally, `lando-pa`.

Now, give it a try from within your project root directory (where your package.json is configured): `lando platform list`. Or execute within a specific service: `lando platform list --service`

**Key Points**

- This plugin depends on and installs `lando-plugin-anywhere` which allows this plugin to be autoloaded from your `node_modules` directory of your project.
