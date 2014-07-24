bamboo-api [![Build Status](https://travis-ci.org/sebarmeli/bamboo-api.png)](https://travis-ci.org/sebarmeli/bamboo-api)
------

Node.js module wrapping the [Atlassian Bamboo REST API](https://developer.atlassian.com/display/BAMBOODEV/Bamboo+REST+APIs) . This module gets some useful information from your [Atalassian Bamboo](http://www.atlassian.com/software/bamboo/overview) CI, such as latest successful build number for a plan or JIRA issues associated to a specific build.

It can be used as command-line interface or can be included in your Node app.

Installation
------------
    
After getting Node.js and npm:

    npm install -g bamboo-api

Usage
-----

You can require the module from your Node app.

	var Bamboo = require('bamboo-api');

After that, you can instantiate the Bamboo function:

	var bamboo = new Bamboo("http://www.host:8085");

and then you can use the avaialble mthods, e.g.:

	bamboo.getAllPlans("PRJ_PLAN", function(result){
		// do something here
	});

Also you can use basic http **authentication** that specified in [RFC 1738](http://www.ietf.org/rfc/rfc1738.txt) by passing
`username` and `password` to `Bamboo` constructor as second and third parameter.

For example:

```javascript
var bamboo = new Bamboo("http://www.host:8085", "username", "password");

bamboo.getAllPlans("PRJ_PLAN", function(result) {
    // do something here
});
```

The module can be used from command-line and there are few comamnds available.

Get the status of a plan (you need to pass the plan key - visible in the URL when you access to a Bamboo plan):

    bamboo-api status <planKey>

Get the build number of the latest successful build for a plan:

    bamboo-api build_no <planKey>

Get the list of all the plans available:

    bamboo-api plans

Get the list of JIRA issues (JIRA needs to be integrated with Bamboo) associated to a specific build:

    bamboo-api jira_issue <plan> <build_no> [dependent_plan]

If you work with build pipelines, you know that builds are triggered by other builds. So you might need to find out the JIRA issues associated to the commits done on the build triggering the considered "plan".

Note: For the JIRA integration to work, you need to define the JIRA task in the message of your Git commit.

Get the content of an artifact associated to a specific build of a plan:

    bamboo-api artifact <planKey> <build_no> <artifact_name>


Configuration
-------------

Define the Bamboo URL in BAMBOO_URL environment variable (defaults to http://localhost:8085):

(*nix)

    export BAMBOO_URL=http://host:port

(Windows)

    set BAMBOO_URL=http://host:port


Development
------------

This module contains only a limited set of information available with the Bamboo API. Feel free to extend it. Test cases are located in the 'test' folder and you run them either through:

    npm test

or

    mocha

    