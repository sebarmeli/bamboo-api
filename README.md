bamboo-api
------

Node.js module wrapping the [Atlassian Bamboo REST API](https://developer.atlassian.com/display/BAMBOODEV/Bamboo+REST+APIs) . This module gets some useful information from your [Atalassian Bamboo](http://www.atlassian.com/software/bamboo/overview) CI, such as latest successful build number for a plan or JIRA issues associated to a specific build.

It can be used as command-line interface or can be included in your Node app.

Installation
------------

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

Get the content of an artifact associated to a specific build of a plan:

    bamboo-api artifact <planKey> <build_no> <artifact_name>


Configuration
-------------

Define the Bamboo URL in BAMBOO_URL environment variable (defaults to http://localhost:8085):

(*nix)

    export BAMBOO_URL=http://host:port

(Windows)

    set BAMBOO_URL=http://host:port