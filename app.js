const 
debug   = require('debug')('scientist'),
http    = require('http'),
url     = require('url'),
argv    = require('yargs')
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

var server = http.createServer( (req, res) => {
    debug('Incoming Request: %o', req.url)
    let parsedUrl = url.parse(req.url, true);
    debug('Incoming Request Path: %o', parsedUrl.pathname)
    debug('Incoming Request Headers: %o', req.headers)

    let controlRequestOptions = constructionOptions(argv.controlHost, req.url.toString(), req.headers)
    let candidateRequestOptions = controlRequestOptions

    // if candidateHost specified, use that for candidate request
    if (argv.candidateHost)
        candidateRequestOptions.baseURL = argv.candidateHost
    // if URL replacement specified, perform replacement on url
    if (argv.replace){
        candidateRequestOptions.url = candidateRequestOptions.url.replace(argv.replace[0], argv.replace[1])
    }
    // if candidate header deletion specified
    if (argv.delete){
        argv.delete.forEach(key => {
            delete candidateRequestOptions.headers[key]
        })
    }
    //if candidate header addition specified
    if (argv.add){
        argv.add.forEach(elem => {
            let keyval = elem.split(':', 2)
            candidateRequestOptions.headers[keyval[0]] = keyval[1]
        })
    }

})

server.listen( port )
console.log(`\nListening on port ${port}`)



function constructionOptions(hostname, path, requestHeaders){
    delete requestHeaders['host'] //remove the scientist service host
    let options = {
        baseURL: hostname,
        url: path,
        headers: requestHeaders
    }
    return options
}