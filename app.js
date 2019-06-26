const 
debug = require('debug')('scientist'),
argv = require('yargs')
    .alias('help', 'h')
    .alias('help', '?')
    .command(require('./command-module'))
    .argv
    
debug(argv)

const port = process.env["NODE_PORT"] | '8080'
debug(`port ${port}`)

//Hack to disable certificate check for https
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log(`Control Host: ${argv.controlHost}`)
console.log(`Candidate Host: ${argv.candidateHost || argv.controlHost}`)

if (argv.replace){
    console.log(`Path Replacement: Candidate requests with '${argv.replace[0]}' in the path will be replaced with '${argv.replace[1]}'`)
} else {
    console.log('No Path Replacement specified')
}

if (argv.delete){
    argv.delete.forEach( (element) => {
        console.log(`Deleting header from Candidate requests: (${element})`)
    });
} 

if (argv.add){
    argv.add.forEach( (element) => {
        let keyval = element.split(':', 2)
        console.log(`Adding header to Candidate requests key:(${keyval[0]}) value(${keyval[1]})`)
    })
}

