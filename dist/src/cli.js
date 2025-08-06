#!/usr/bin/env node

// This is a wrapper script that loads the actual CLI from lib
// This allows the package to work correctly when installed via npm
require('../../lib/cli.js');