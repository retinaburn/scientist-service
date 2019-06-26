const 
debug       = require('debug')('scientist'),
dcontrol    = require('debug')('scientist:control'),
http        = require('http'),
url         = require('url'),
axios       = require('axios'),
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

//TODO how can I clean this ugly up
var CONTROL_RESPONSE_STATUS, CONTROL_RESPONSE_BODY, CONTROL_ELAPSED_NANOSEC
var CANDIDATE_RESPONSE_STATUS, CANDIDATE_RESPONSE_BODY, CANDIDATE_ELAPSED_NANOSEC

var server = http.createServer( (req, res) => {
    debug('Incoming Request: %o', req.url)
    let parsedUrl = url.parse(req.url, true);
    debug('Incoming Request Path: %o', parsedUrl.pathname)
    debug('Incoming Request Headers: %o', req.headers)

    //First thing we want to do is send the request to Control - after that happens we can take care of Candidate
    let controlRequestOptions = constructionOptions(argv.controlHost, req.url.toString(), req.headers)

    //Control Request
    //- sends response from Control back to caller
    let control = sendControlRequest(controlRequestOptions, res, handleControlResponse, handleControlRequestError)


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

async function sendControlRequest(options, originatingResponse, handleResponse, handleRequestError){
    let controlStartTime = process.hrtime.bigint();
    
    dcontrol('Constructed options: %o', options)

    return axios.get( options.url, options).then(function(res){
        dcontrol('GET status: %o', res.status)
        setControlElapsedTime(controlStartTime, process.hrtime.bigint())
        handleResponse(originatingResponse, res)
    })
    .catch(function(error){
        setControlElapsedTime(controlStartTime, process.hrtime.bigint())
        if (error.response){
            // control response status code outside axios default response.status range
            dcontrol('Control GET status: %o', error.response.status)
            handleResponse(originatingResponse, error.response)
        } else if (error.request) {
            // no response, so its a bad request
            handleRequestError(originatingResponse, error)
        } else {
            dcontrol('Control Error', error.message)
        }
    })

}

function handleControlResponse(originatingResponse, res){
    dcontrol('Returning Control Response to Originator')
    let data = JSON.stringify(res.data)
    originatingResponse.writeHead(res.status, res.headers)
    originatingResponse.write(data)
    originatingResponse.end()
    CONTROL_RESPONSE_STATUS = res
    CONTROL_RESPONSE_BODY = data
}

function handleControlRequestError(originatingResponse, error){
    dcontrol('Returning Control error response to Originator')
    originatingResponse.setHeader('Content-Type', 'application/json')
    originatingResponse.writeHead(500)
    originatingResponse.write(error.toString())
    originatingResponse.end()
}

function setControlElapsedTime(startTime, endTime){
    dcontrol(`Start: ${startTime}, End: ${endTime}`)
    CONTROL_ELAPSED_NANOSEC = endTime - startTime;
}