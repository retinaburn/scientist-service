# scientist-service
Service to mirror requests to Control server, and Candidate server to compare and measure GET responses

## Goal
Provide a service that can be deployed locally, or remotely which allows for comparing of responses from two services. Control - which is the known good service, and Candidate - which contains the new behaviour.

## Use Cases

Sometimes I find myself in one of the following:

### Compare updated local service against deployed service
I have an existing service in an environment, say production. There is a change in requirements, so I update the tests and the codebase locally. I run my unit tests, and any integration tests and everything looks ok. But how does the new service perform compare to the old service? Does it return the same responses for the same input. 

### Compare behaviour across versions of a deployed service 
My application currently uses version 1 of the service, but there is a version 2 of the service deployed by some co-workers. I want to see if my Postman test suite of my application works on both version 1 and version 2.

### Compare behaviour for alternate code paths when behaviour is controlled by header
I have made added an alternate code-path to a service and deployed it to Pre-production/Production, which is controlled via feature-flag in a header. I want to observe how the new code path behaves compared to the existing code path.


### Alternatives to Scientist

In the past I would have:
1. Saved the response from both executions in a text file and compared the output
2. Visually compared responses from both executions
3. Written a throw away integration test to compare
4. Write better test suites ;)

## What does Scientist Service do?

It is a proxy service for idempotent requests (GET typically) that sends an incoming request to the specified Control endpoint and returns the response to the caller. It also mirrors the request to the Candidate endpoint. It then compares the response code and response body from both executions.

When Scientist receives the request it:
1. Replaces the host of the incoming request (which is scientist itself) with the specified Control host
2. It sends an async request to the Control host, with all the incoming request headers intact
3. When it receives the response from the Control host it stores the response, and then forwards on to the caller
4. In the meantime, it prepares the request for the Candidate host
    
    4.1 Uses the specified Candidate host or the Control host if no Candidate host is specified
    
    4.2 Performs a regexp replacement on the path of the incoming request, if specified

    4.3 Deletes any specified headers

    4.4 Adds any new specified headers

    4.5 Sends the request
5. Once both the Candidate and Control responses have been received the HTTP status codes, and the bodies are compared


###TODO
1. Diagrams
2. Show examples
3. Show logging and describe how to perform



