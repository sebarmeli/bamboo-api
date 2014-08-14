# Bamboo API
[![Build Status](https://travis-ci.org/sebarmeli/bamboo-api.png)](https://travis-ci.org/sebarmeli/bamboo-api)
[![NPM version](https://img.shields.io/npm/v/bamboo-api.svg)](https://www.npmjs.org/package/bamboo-api)


Node.js module wrapping the [Atlassian Bamboo REST API](https://developer.atlassian.com/display/BAMBOODEV/Bamboo+REST+APIs).
This module gets some useful information from your [Atlassian Bamboo](http://www.atlassian.com/software/bamboo/overview) CI,
such as latest successful build number for a plan or JIRA issues associated to a specific build.

It can be used as command-line interface or can be included in your Node app.

# Installation
    
After getting Node.js and npm:

```
$ npm install -g bamboo-api
```

# Usage

## In Node app

You can require the module from your Node app.

```javascript
var Bamboo = require('bamboo-api');
```

After that, you can instantiate the Bamboo function:

```javascript
var bamboo = new Bamboo("http://www.host:8085");
```

and then you can use the available methods, e.g.:

```javascript
bamboo.getLatestBuildStatus("PROJECT_KEY-PLAN_KEY", function(error, result) {
    // do something here
});
```

Also you can use basic http **authentication** that specified in [RFC 1738](http://www.ietf.org/rfc/rfc1738.txt) by passing
`username` and `password` to `Bamboo` constructor as second and third parameter.

For example:

```javascript
var bamboo = new Bamboo("http://www.host:8085", "username", "password");

bamboo.getLatestBuildStatus("PROJECT_KEY-PLAN_KEY", function(error, result) {
    // do something here
});
```

### Available methods

#### bamboo.getLatestSuccessfulBuildNumber(planKey, params, callback)

Get the latest successful build number.

```javascript
bamboo.getLatestSuccessfulBuildNumber("PROJECT_KEY-PLAN_KEY", false, function(error, result) {
    if (error) {
        console.log(error);
        return;
    }

    console.log("Latest successful build number:", result);
});
```

#### bamboo.getLatestBuildStatus(planKey, callback)

Get latest build status: state and number.

```javascript
bamboo.getLatestSuccessfulBuildNumber("PROJECT_KEY-PLAN_KEY", function(error, state, number) {
    if (error) {
        console.log(error);
        return;
    }

    console.log("Latest build state:", state);
    console.log("Latest build number:", number);
});
```

#### bamboo.getBuildStatus(buildDetails, callback)

Get status of the build.

```javascript
bamboo.getBuildStatus("PROJECT_KEY-PLAN_KEY/BUILD_NUMBER", function(error, result) {
    if (error) {
        console.log(error);
        return;
    }

    console.log("Status of the build:", result);
});
```

#### bamboo.getChangesFromBuild(buildDetails, callback)

Get changes associated to a specific build. It also considers a dependent plan recursively.

```javascript
bamboo.getChangesFromBuild("PROJECT_KEY-PLAN_KEY/BUILD_NUMBER", function(error, result) {
    if (error) {
        console.log(error);
        return;
    }

    console.log("List of changes:", result);
});
```

#### bamboo.getJiraIssuesFromBuild(buildDetails, callback)

Get jira issues associated to a specific build. It also considers a dependent plan.

```javascript
bamboo.getJiraIssuesFromBuild("PROJECT_KEY-PLAN_KEY/BUILD_NUMBER", function(error, result) {
    if (error) {
        console.log(error);
        return;
    }

    console.log("List of JIRA tasks:", result);
});
```

#### bamboo.getArtifactContent(buildDetails, artifactName, callback)

Get content of an artifact associated to a build.

```javascript
bamboo.getArtifactContent("PROJECT_KEY-PLAN_KEY/BUILD_NUMBER", "artifact", function(error, result) {
    if (error) {
        console.log(error);
        return;
    }

    console.log("Content of an artifact:", result);
});
```

#### bamboo.getAllPlans(params, callback, currentPlans)

Get list of plans, key and names available.

```javascript
bamboo.getArtifactContent("?start-index=25", function(error, result) {
    if (error) {
        console.log(error);
        return;
    }

    console.log("Plans:", result);
});
```

## Command line

The module can be used from command-line and there are few commands available.

Before use you need to define the Bamboo URL in BAMBOO_URL environment variable (default: `http://localhost:8085`):

- *nix: ```export BAMBOO_URL=http://host:port```
- Windows: ```set BAMBOO_URL=http://host:port```

After variable is defined, you can use bamboo-api command line, otherwise on execution you should get following error:

```
$ bamboo-api build_no "PROJECT_KEY-PLAN_KEY"

> ERROR: Before use of Bamboo API command line, specified global variable BAMBOO_URL in your environment!

    For *nix users:

      export BAMBOO_URL="BAMBOO_URL_HERE"

    For Windows users:

      set BAMBOO_URL="BAMBOO_URL_HERE"

  For more information use --help or read README file.
> Error: connect ECONNREFUSED
```

### Available commands

For command line help use option `--help`:

```
$ bamboo-api --help

  Usage: bamboo-api [command] <params...>

  Commands:

    build_no <PROJECT_KEY-PLAN_KEY>
    get the latest successful build number

    status <PROJECT_KEY-PLAN_KEY>
    get status and build number of the latest build

    build_status <PROJECT_KEY-PLAN_KEY/BUILD_NUMBER>
    get the status of the build

    changes <PROJECT_KEY-PLAN_KEY/BUILD_NUMBER>
    gets all the changes associated to a specific build - considering dependent plan too

    jira_issues <PROJECT_KEY-PLAN_KEY/BUILD_NUMBER>
    gets all the JIRA issues associated to a specific build - considering dependent plan too

    artifact <PROJECT_KEY-PLAN_KEY/BUILD_NUMBER> <ARTIFACT_NAME>
    gets the content of an artifact associated to a build

    plans
    gets the list of all plans available

  Options:

    -h, --help     output usage information
    -V, --version  output the version number

  Environment variables:

    BAMBOO_URL          Bamboo's UR (default: 'http://localhost:8085').
                        Note: you can use base authentication using url,
                        Simply pass the 'user:password' before the host
                        with an '@' sign.

                        For example: http://user:password@example.com

  Examples:

    $ bamboo-api build_status "PROJECT_KEY-PLAN_KEY/BUILD_NUMBER"
    > InProgress

$ bamboo-api build_no --help

  Usage: build_no <PROJECT_KEY-PLAN_KEY>

  Options:

    -h, --help  output usage information

```

#### bamboo-api build_no

Get the build number of the latest successful build number:

```
$ bamboo-api build_no <PROJECT_KEY-PLAN_KEY>
```

Will output `result` or `error`.

#### bamboo-api status

Get status and build number of the latest build:

```
$ bamboo-api status <PROJECT_KEY-PLAN_KEY>
```

Will output `state` and `number` otherwise `error`.

#### bamboo-api build_status

Get the status of the build:

```
$ bamboo-api build_no <PROJECT_KEY-PLAN_KEY/BUILD_NUMBER>
```

Will output `result` or `error`.

#### bamboo-api changes

Get all the changes associated to a specific build - considering dependent plan:

```
$ bamboo-api changes <PROJECT_KEY-PLAN_KEY/BUILD_NUMBER>
```

Will output `result` or `error`.

#### bamboo-api jira_issue

Get the list of JIRA issues associated to a specific build - considering dependent plan:

```
$ bamboo-api jira_issue <PROJECT_KEY-PLAN_KEY/BUILD_NUMBER>
```

If you work with build pipelines, you know that builds are triggered by other builds. So you might need to find out the
JIRA issues associated to the commits done on the build triggering the considered 'plan'.

Note: For the JIRA integration to work, you need to define the JIRA task in the message of your Git commit.

Will output `result` or `error`.

#### bamboo-api artifact

Get the content of an artifact associated to a specific build:

```
$ bamboo-api artifact <PROJECT_KEY-PLAN_KEY/BUILD_NUMBER> <ARTIFACT_NAME>
```

Will output `result` or `error`.

#### bamboo-api plans

Get the list of all the plans available:

```
$ bamboo-api plans
```

Will output `result` or `error`.

# Development

This module contains only a limited set of information available with the Bamboo API. Feel free to extend it. Test cases
are located in the 'test' folder and you run them either through:

```
$ npm test
```

or if you have globally installed `mocha`, just use it:

```
$ mocha
```

# Copyright

Copyright (C) 2012 Sebastiano Armeli-Battana and other [contributors](https://github.com/sebarmeli/bamboo-api/graphs/contributors).

Distributed under the MIT License.