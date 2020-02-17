Let's talk about logging with tracing in web application servers, particularly from the perspective of a http request that just came in. After the server receives it, its metadata is logged - the header, the origin, the http method etc. The request is then routed to the designated handler, which then parses the body, maybe firing off other functions and even queries and modifications to the database, all while processing it. If all goes well, the client recieves the desired response. Otherwise, an error occured along the way. All through, logging is (and should be) taking place. However, if there is no means of relating the logs to this particular request then monitoring features, tracking errors and debugging ends up being more involved than it needs to be. That is why appending a lightweight unique identifier/ trace ID/ transaction ID such as a UUID to each request-induced log is a [best-practice](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/assigntransactionid.md). 



In javascript (nodejs), a quick hack when using express is simply to add the trace ID as a property to `res.locals`. This is convenient when logging within express handlers and middleware. But as soon as we need to extend it to some other part of the application, we are forced to introduce unnecessary coupling in our codebase since we either have to pass the `res` object or the `traceID` to each and every function just in case later on we want to do some logging there. 



This needs not be the case though- folks writing nodejs backends have already come up with great solutions for incorporating tracing plainly without having to pass around ugly trace IDs all over. Their solutions have drawn inspiration from traditional multithreaded web-frameworks (which of course need language support). In such servers, each request is handled in its own thread and since threads have *thread-local-storage*, the logger instance invoked can always access the Trace ID without the ID having to be passed to each function. Now as we know, node.js is single-threaded and async-based; it has no concept of '*thread-local-storage*'. Instead, it has call-backs and an event-loops which the module [continuation-local-storage]([https://www.npmjs.com/package/continuation-local-storage](https://www.npmjs.com/package/continuation-local-storage), CLS utilizes to 'simulate' thread-local-storage. From its readme:

> Continuation-local storage works like thread-local storage in threaded programming, but is based on chains of Node-style callbacks instead of threads. The standard Node convention of functions calling functions is very similar to something called ["continuation-passing style"](http://en.wikipedia.org/wiki/Continuation-passing_style) in functional programming, and the name comes from the way this module allows you to set and get values that are scoped to the lifetime of these chains of function calls.



Even though CLS is more popular, an arguably better alternative is [cls-hooked](https://www.npmjs.com/package/cls-hooked). It utilizes the  [async_hooks](https://nodejs.org/api/async_hooks.html) API in node.js's standard library to cover pretty much the same ground as CLS. It's worth noting that async_hooks is considered to be experimental even thought it has been around for a while. I'd love to get into details on how both `cls-hooked` and `async_hooks` work under the hood but I believe the two posts I've linked just below do a better job:

* NodeJS logging made right: [link](https://itnext.io/nodejs-logging-made-right-117a19e8b4ce)

* A Pragmatic Overview of Async Hooks API in Node.js: [link](https://itnext.io/a-pragmatic-overview-of-async-hooks-api-in-node-js-e514b31460e9)



What I really want to take on is incorporating tracing when using a `pino`-based logger all while introducing as few modifications as possible. I opted to use `pino` over other logging libraries since it's lightweight, fast and has a relatively simpler API. However, most of the articles and documentation I found on tracing in node.js focused on `winston`- after all, it's the most popular module. The only [one](https://itnext.io/nodejs-logging-made-right-117a19e8b4ce) I found on `pino` was quite complicated, at least for me. I did learn a lot from it though, such as what the `Proxy` object is in javascript and how it can be used. But ultimately, I was unable to get it working for my use-case, probably due to my own error somewhere. Therefore, the following is a brief write-up of my approach - hopefully, it can help someone out there:



Other than `pino` and `cls-hooked`, I'll also be using [cuid](https://www.npmjs.com/package/cuid) to generate unique Ids.
