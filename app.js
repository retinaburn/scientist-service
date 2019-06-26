const 
debug = require('debug')('scientist'),
argv = require('yargs')
    .alias('help', 'h')
    .alias('help', '?')
    .command(require('./command-module'))
    .argv
    
debug(argv)
