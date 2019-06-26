exports.command = ['run <control-host> [candidate-host] [options]', '$0 <control-host> [candidate-host] [options]']
exports.describe = "Scientist service is a proxy that sends requets to the Control endpoint" +
    " and returns the response to the caller, while also mirroring the request to the Candidate endpoint." +
    " comparing the response status codes and response bodies.\n" +
    "\n" +
    "Control   - The known good endpoint that performs the current behaviour\n" +
    "Candidate - The endpoint that contains the proposed new functionality\n" +
    "\n" +
    "When the scientist service receives a request the host is replaced with the control-host parameter and" +
    " the headers, and request body are sent to the Control. When a response is received it is stored and returned" +
    " to the caller. Asynchronously the request is mirrored to the Candidate where the following steps are performed:\n"+
    "1. Replace control hostname with candidate-host (if specified)\n" +
    "2. The request path is modified according to the regexp (if specified)\n" +
    "3. Header modifications performed (deletion first, addition second).\n" +
    "\n" +
    "When the responses have been received from the Control and Candidate requests the response codes and bodies" +
    " are compared and logged to the console."

exports.builder = (yargs) => {
    yargs.positional('control-host', {
        describe: 'Valid URL for the control host (known good service)',
        coerce: function(host) {
            new URL(host) //will throw error if invalid host
            return host   //we dont want to use the URL internally
        }
    })
    .positional('candidate-host', {
        'describe': 'Valid URL for the candidate host (proposed service with changes). If not provided, control-host will be used for candidate requests',
        'coerce': function(host) {
            new URL(host) // will throw error if invalid host
            return host   //we dont want to use the URL internally
        }
    })
    .option('replace', {
        describe: '"<regexp|string> <replacement-string>" replaces the regular expression or string match in the path with the replace-string for candidate requests',
        alias: 'r',
        nargs: 2, //2 arguments required for 'replace'
        coerce: function(arg) {
            //test supplied regexp|string to see if it is a valid regexp 
            //and replace argument with compiled regexp if it is
            try{ 
                arg[0] = new RegExp(arg[0]) 
            } catch (err) {
                //do not throw error because argument passed may be valid string
                //but not valid regular expression
                console.error(err) 
            }
            return arg
        }
    })
    .option('delete', {
        describe: "'key' deletes the specified header from Candidate requests. Multiple delete options may be used. Header deletions occur before add additions",
        alias: ['d','delete-header'],
        array: true,
        nargs: 1, //deletion requires 1 arg for header key
    })
    .option('add', {
        describe: "'key: value' adds a header to the Candidate request. Multiple add options may be used",
        alias: ['a','add-header'],
        array: true,
        nargs: 1, //add header requires 1 arg, a string with "key: value"
        coerce: function(arg) {
            //check each add header specified matches format
            // and update the array to be split elements
            arg.forEach(element => {
                try{
                    let splitval = element.split(':', 2)
                    if (splitval[1] == undefined)
                        throw "Add header format 'key:value'"
                } catch (err){
                    throw "Add header format 'key:value'"
                }
            })
            return arg
        }
    })
    .strict()
    .example('$0 http://host1 http://host2', 'All requests received will be sent first to the Control host (host1), then to Candidate host (host2) and the results compared')
    .example('$0 http://host1 -r v1 v2', 'Control requests will be sent to the v1 endpoint, Candidate requests will be sent to the v2 endpoint on the same host')
    .example('$0 http://host1 http://host2 -r /v. /v2', 'Control requests will be sent to the v1 endpoint, Candidate requests will be sent to the V2 endpoint. The regexp matches any thing like /v.')
    .example('$0 http://host1 -a "new-header: true', 'Control and Candidate requests go to host1, but Candidate requests get the additional header specified')
    .example('$0 http://host1 http://host2 -a "h1: true" -a "h2: true"', 'Control and Candidate requestes go to different hosts, and Candidate requests will have two additional headers')
    .example('$0 http://host1 http://host2 -d "h1"', 'Control requests go to host1, Candidate requests go to host2 with the header "h2" removed')
    .example('$0 http://host1 http://host2 -d h1 -a "h1: true"', 'Candidate requests will have the header "h1" removed, then added with the value "true"')
    .example('$0 http://host1 http://host2 -a "h1: true" -d "h1"', 'Candidate requests will have the header "h1" removed, then added with the value "true"')
}