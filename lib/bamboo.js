/**
 * Bamboo API
 *
 * @param {String} host - hostname. By default "http://hostname.com:8085"
 * @param {String=} username - optional param for base HTTP authentication. Username
 * @param {String=} password - optional param for base HTTP authentication. Password
 * @returns {Bamboo}
 */
module.exports = function(host, username, password) {
    "use strict";

    var request = require('request'),
        _ = require('underscore'),
        stream = require('stream'),
        qs = require('querystring');

    /**
     * Function defining a Bamboo instance
     *
     * @param {String} host - hostname. By default "http://localhost:8085"
     * @param {String=} username - optional param for base HTTP authentication. Username
     * @param {String=} password - optional param for base HTTP authentication. Password
     * @constructor
     */
    var Bamboo = function(host, username, password) {
        var defaultUrl = "http://localhost:8085";

        host = host || defaultUrl;

        if (username && password) {
            var protocol = host.match(/(^|\s)(https?:\/\/)/i);

            if (_.isArray(protocol)) {
                protocol = _.first(protocol);

                var url = host.substr(protocol.length);

                host = protocol + username + ":" + password + "@" + url;
            }
        }

        this.host = host || defaultUrl;
    };

    /**
     * Callback for getLatestSuccessfulBuildNumber
     *
     * @typedef {Function} getLatestSuccessfulBuildNumberCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {String|null} result - if no error will return build number
     */
    /**
     * Returns the latest successful build number
     *
     * @param {String} planKey - Bamboo plan key, like "PROJECT_KEY-PLAN_KEY"
     * @param {getLatestSuccessfulBuildNumberCallback} callback
     * @param {Object=} urlParams - optional parameter for request url, like `{"os_authType": "basic", "start-index": 25}`
     */
    Bamboo.prototype.getLatestSuccessfulBuildNumber = function(planKey, callback, urlParams) {
        var self = this,
            planUri =  self.host + "/rest/api/latest/result/" + planKey + ".json";

        urlParams = urlParams || {};

        request({ uri: planUri, qs: urlParams }, function(error, response, body) {
            var errors = checkErrorsWithResult(error, response);

            if (errors) {
                callback(errors, null);
                return;
            }

            try {
                var bodyJson = JSON.parse(body);
            } catch (parseError) {
                callback(parseError, null);
                return;
            }

            var results = bodyJson.results,
                result = results.result,
                buildNo = "",
                isSearching = false;

            // Search for the latest 'Successful' build
            for (var i = 0; i < result.length; i++) {
                var resultEl = result[i];

                if (resultEl.state === "Successful") {
                    buildNo = resultEl.number;
                    callback(null, buildNo);
                    return;
                }
            }

            // Loop through the next series of builds
            var newIndex = results["max-result"] + results["start-index"];
            if (newIndex < results.size) {
                isSearching = true;
                urlParams["start-index"] = newIndex;

                self.getLatestSuccessfulBuildNumber(planKey, function(error, result) {
                    callback(error, result);
                }, urlParams);
            }

            if (!buildNo && !isSearching) {
                callback(new Error("The plan doesn't contain any successful build"), null);
            }
        });
    };

    /**
     * Callback for getLatestBuildStatus
     *
     * @typedef {Function} getLatestBuildStatusCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {String|null} state - last result state if no error will return build number
     * @param {String|null} number - last result number if no error will return build number
     */
    /**
     * Returns latest build status: state and number
     *
     * @param {String} planKey - Bamboo plan key, like "PROJECT_KEY-PLAN_KEY"
     * @param {getLatestBuildStatusCallback} callback
     */
    Bamboo.prototype.getLatestBuildStatus = function(planKey, callback) {
        var planUri = this.host + "/rest/api/latest/result/" + planKey + ".json";

        request({ uri: planUri }, function(error, response, body) {
            var errors = checkErrorsWithResult(error, response);

            if (errors) {
                callback(errors, null, null);
                return;
            }

            try {
                var bodyJson = JSON.parse(body);
            } catch (parseError) {
                callback(parseError, null, null);
                return;
            }

            var results = bodyJson.results,
                lastResult = _.first(results.result);

            callback(null, lastResult.state, lastResult.number);
        });
    };

    /**
     * Callback for getBuildStatus
     *
     * @typedef {Function} getBuildStatusCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {String|null} lifeCycleState - build life cycle, like "InProgress"
     */
    /**
     * Returns the status of the build
     *
     * @param {String} buildDetails - Bamboo plan key + build number, like "PROJECT_KEY-PLAN_KEY/BUILD_NUMBER"
     * @param {getBuildStatusCallback} callback
     */
    Bamboo.prototype.getBuildStatus = function(buildDetails, callback) {
        var planUri = this.host + "/rest/api/latest/result/" + buildDetails + ".json";

        request({ uri: planUri }, function(error, response, body) {
            var errors = checkErrors(error, response);

            if (errors) {
                callback(errors, null);
                return;
            }

            try {
                var bodyJson = JSON.parse(body);
            } catch (parseError) {
                callback(parseError, null);
                return;
            }

            callback(null, bodyJson.lifeCycleState);
        });
    };

    /**
     * Callback for getBuildState
     *
     * @typedef {Function} getBuildStateCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {String|null} state - build state, like "Successful" of "Failure"
     */
    /**
     * Returns the state of the build
     *
     * @param {String} buildDetails - Bamboo plan key + build number, like "PROJECT_KEY-PLAN_KEY/BUILD_NUMBER"
     * @param {getBuildStateCallback} callback
     */
    Bamboo.prototype.getBuildState = function(buildDetails, callback) {
        var planUri = this.host + "/rest/api/latest/result/" + buildDetails + ".json";

        request({ uri: planUri }, function(error, response, body) {
            var errors = checkErrors(error, response);

            if (errors) {
                callback(errors, null);
                return;
            }

            try {
                var bodyJson = JSON.parse(body);
            } catch (parseError) {
                callback(parseError, null);
                return;
            }

            callback(null, bodyJson.state);
        });
    };

    /**
     * Callback for getChangesFromBuild
     *
     * @typedef {Function} getChangesFromBuildCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {Array|null} result - List of changes
     */
    /**
     * Returns the changes associated to a specific build. It also considers a dependent plan recursively
     *
     * @param {String} buildDetails - Bamboo plan key + build number, like "PROJECT_KEY-PLAN_KEY/BUILD_NUMBER"
     * @param {getChangesFromBuildCallback} callback
     */
    Bamboo.prototype.getChangesFromBuild = function(buildDetails, callback) {
        var self = this,
            planUri = self.host + "/rest/api/latest/result/" + buildDetails + ".json?expand=changes";

        request({ uri: planUri }, function(error, response, body) {
            var errors = checkErrors(error, response);

            if (errors) {
                callback(errors, null);
                return;
            }

            try {
                var bodyJson = JSON.parse(body);
            } catch (parseError) {
                callback(parseError, null);
                return;
            }

            var changes = bodyJson.changes.change,
                buildReason = bodyJson.buildReason,
                changeNames = [];

            _.each(changes, function(change) {
                this.push(change.fullName);
            }, changeNames);

            _.uniq(changeNames);

            if (buildReason && buildReason.indexOf("Child of") !== -1) {
                var dependentPlan = buildReason.substring(buildReason.indexOf(">") + 1).replace("</a>", "");

                // Search for JIRA issues coming from the dependent plan
                self.getChangesFromBuild(dependentPlan, function(error, result) {
                    var errors = checkErrors(error, response);

                    if (errors) {
                        callback(errors, null);
                        return;
                    }

                    callback(null, _.union(changeNames, result));
                });
            } else {
                callback(null, changeNames);
            }
        });
    };

    /**
     * Callback for getJiraIssuesFromBuild
     *
     * @typedef {Function} getJiraIssuesFromBuildCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {Array|null} result - List of JIRA tasks
     */
    /**
     * Returns the jira issues associated to a specific build. It also considers a dependent plan
     *
     * @param {String} buildDetails - Bamboo plan key + build number, like "PROJECT_KEY-PLAN_KEY/BUILD_NUMBER"
     * @param {getJiraIssuesFromBuildCallback} callback
     */
    Bamboo.prototype.getJiraIssuesFromBuild = function(buildDetails, callback) {
        var self = this,
            planUri = self.host + "/rest/api/latest/result/" + buildDetails + ".json?expand=jiraIssues";

        request({ uri: planUri }, function(error, response, body) {
            var errors = checkErrors(error, response);

            if (errors) {
                callback(errors, null);
                return;
            }

            try {
                var bodyJson = JSON.parse(body);
            } catch (parseError) {
                callback(parseError, null);
                return;
            }

            var jiraIssues = bodyJson.jiraIssues.issue,
                buildReason = bodyJson.buildReason,
                jiraNumbers = [];

            _.each(jiraIssues, function(issue) {
                this.push(issue.key);
            }, jiraNumbers);

            _.uniq(jiraNumbers);

            if (buildReason.indexOf("Child of") !== -1) {
                var dependentPlan = buildReason.substring(buildReason.indexOf(">") + 1).replace("</a>", "");

                // Search for JIRA issues coming from the dependent plan
                self.getJiraIssuesFromBuild(dependentPlan, function(error, result) {
                    var errors = checkErrors(error, response);

                    if (errors) {
                        callback(errors, null);
                        return;
                    }

                    callback(null, _.union(jiraNumbers, result));
                });
            } else {
                callback(null, jiraNumbers);
            }
        });
    };

    /**
     * Callback for getArtifactContent
     *
     * @typedef {Function} getArtifactContentCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {String|null} result - content of an artifact
     */
    /**
     * Returns the content of an artifact associated to a build
     *
     * @param {String} buildDetails - Bamboo plan key + build number, like "PROJECT_KEY-PLAN_KEY/BUILD_NUMBER"
     * @param {String} artifactName - Artifact name
     * @param {getArtifactContentCallback} callback
     */
    Bamboo.prototype.getArtifactContent = function(buildDetails, artifactName, callback) {
        var artifactUri = this.host + "/browse/" + buildDetails + "/artifact/shared/" + artifactName + "/" + artifactName;

        request({ uri: artifactUri }, function(error, response, body) {
            var errors = checkErrors(error, response);

            if (errors) {
                callback(errors, null);
                return;
            }

            callback(null, body);
        });
    };

    /**
     * Returns a stream of the content of an artifact associated to a build
     *
     * @param {String} buildDetails - Bamboo plan key + build number, like "PROJECT_KEY-PLAN_KEY/BUILD_NUMBER"
     * @param {String} artifactName - Artifact name
     * @returns {stream.Readable} stream
     */
    Bamboo.prototype.getArtifactContentStream = function(buildDetails, artifactName) {
        var artifactUri = this.host + "/browse/" + buildDetails + "/artifact/shared/" + artifactName + "/" + artifactName;

        var out = new stream.PassThrough();
        var req = request({ uri: artifactUri });

        req.on('error', function (err) {
          out.emit('error', err);
        });

        req.on('response', function (res) {
            var errors = checkErrors(null, res);

            if (errors) {
                stream.emit('error', errors);
                return;
            }

            res.pipe(out);
        });

        return out;
    };

    /**
     * Callback for getAllPlans
     *
     * @typedef {Function} getAllPlansCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {Array|null} result - if no error will return list of plans available (each plan has a 'key' and a 'name' value)
     */
    /**
     * Returns the list of plans, key and names available
     *
     * @param {getAllPlansCallback} callback
     * @param {Object=} urlParams - optional parameter for request url, like `{"os_authType": "basic", "start-index": 25}`
     * @param {Array=} currentPlans - List of plans available (each plan has a 'key' and a 'name' value)
     */
    Bamboo.prototype.getAllPlans = function(callback, currentPlans, urlParams) {
        var self = this,
            planUri = self.host + "/rest/api/latest/plan.json";

        urlParams = urlParams || {};
        currentPlans = currentPlans || [];

        request({ uri: planUri, qs: urlParams}, function(error, response, body) {
            var errors = checkErrors(error, response);

            if (errors) {
                callback(errors, null);
                return;
            }

            try {
                var bodyJson = JSON.parse(body);
            } catch (parseError) {
                callback(parseError, null);
                return;
            }

            var plans = bodyJson.plans;

            if (plans.plan.length === 0) {
                callback(new Error("No plans available"), null);
                return;
            }

            _.each(plans.plan, function(plan) {
                this.push({
                    key: plan.key,
                    name: plan.name
                });
            }, currentPlans);

            // Loop through the next series of builds
            var newIndex = plans["max-result"] + plans["start-index"];

            if (newIndex < plans.size) {
                urlParams["start-index"] = newIndex;

                self.getAllPlans(function(error, result) {
                    var errors = checkErrors(error, response);

                    if (errors) {
                        callback(errors, null);
                        return;
                    }

                    callback(null, result);
                }, currentPlans, urlParams);
            } else {
                callback(null, currentPlans);
            }
        });
    };

    /**
     * Callback for buildPlan
     *
     * @typedef {Function} buildPlanCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {String|null} result - if no error, will return information for queued build, including build number,
     *                               changes and reason of build (see Bamboo API documentation for `restQueuedBuild` response)
     */
    /**
     * Fire build execution for specified plan. Effectively, this method adds build to the build queue, so is not
     * guarantied that build would be executed immediately.
     *
     * @param {String} buildDetails - "PROJECT_KEY-PLAN_KEY"
     *
     * @param {buildPlanCallback} callback
     *
     * @param {Object=} urlParams - optional parameters for request url, like `{"os_authType": "basic"}`
     * @param {Object=} buildParams - optional parameters for the build, like {stage: String, executeAllStages: Boolean, customRevision: String},
     *                               please documentation https://docs.atlassian.com/bamboo/REST/5.11.1/#d2e1481
     */
    Bamboo.prototype.buildPlan = function(buildDetails, callback, urlParams, buildParams) {
        var self = this,
            url = self.host + "/rest/api/latest/queue/" + buildDetails + ".json",
            planUri = mergeUrlWithParams(url, urlParams),
            postParams = (!buildParams || _.isEmpty(buildParams)) ? {} : {form: buildParams};

        request.post(
            planUri,
            postParams,
            function(error, response, body) {
                var errors = checkErrors(error, response);

                if (errors) {
                    callback(errors, null);
                    return;
                }

                callback(null, body);
            });
    };

    /**
     * Callback for enablePlan
     *
     * @typedef {Function} enablePlanCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {Boolean|null} result - if no error, will return true
     */
    /**
     * Method will changes status of a given plan to enabled.
     *
     * On success - callback(null, true)
     * On failure - callback(error, null)
     *
     * @param {String} planKey - "PROJECT_KEY-PLAN_KEY"
     * @param {enablePlanCallback} callback
     * @param {Object=} urlParams - optional parameters for request url, like `{"os_authType": "basic"}`
     */
    Bamboo.prototype.enablePlan = function(planKey, callback, urlParams) {
        var successResult = true;
        var self = this,
            url = self.host + "/rest/api/latest/plan/" + planKey + "/enable.json",
            planUri = mergeUrlWithParams(url, urlParams);

        request.post(
            planUri,
            {},
            function(error, response) {
                var errors = checkErrors(error, response);

                if (errors) {
                    callback(errors, null);
                    return;
                }

                callback(null, successResult);
            });
    };

      /**
     * Callback for disablePlan
     *
     * @typedef {Function} disablePlanCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {Boolean|null} result - if no error, will return true
     */
    /**
     * Method will changes status of a given plan to disabled.
     *
     * On success - callback(null, true)
     * On failure - callback(error, null)
     *
     * @param {String} planKey - "PROJECT_KEY-PLAN_KEY"
     * @param {disablePlanCallback} callback
     * @param {Object=} urlParams - optional parameters for request url, like `{"os_authType": "basic"}`
     */
    Bamboo.prototype.disablePlan = function(planKey, callback, urlParams) {
        var successResult = true;
        var self = this,
            url = self.host + "/rest/api/latest/plan/" + planKey + "/enable.json",
            planUri = mergeUrlWithParams(url, urlParams);

        request.delete(
            planUri,
            {},
            function(error, response) {
                var errors = checkErrors(error, response);

                if (errors) {
                    callback(errors, null);
                    return;
                }

                callback(null, successResult);
            });
    };

    /**
     * Callback for createBranchPlan
     *
     * @typedef {Function} createBranchPlanCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {String|null} result - will return branch plan string if branch successfully created, otherwise `false`
     */
    /**
     * Creates a plan branch in Bamboo
     *
     * this call seems to be not documented, so we relay on some forum data:
     * https://answers.atlassian.com/questions/215164/bamboo-rest-api-to-create-branches
     *
     * note that for this to work, a repository needs to be link to Bamboo plan, since its not well documented
     * I dont know how to handle multiple repositories
     *
     * On success - callback(null, BRANCH_PLAN_KEY)
     * On failure - callback(error, null)
     *
     * @param   {String} planKey - "PROJECT_KEY-PLAN_KEY"
     * @param   {String} bambooBranchName - the name that will be displayed in Bamboo for the branch
     * @param   {String} vcsBranchName - the branch name in the repository, this parameter depends on the version control used,
     * in git its something like "refs/heads/BRANCH_NAME" - you can find it by going to .git/refs/heads folder in your file system
     * @param   {createBranchPlanCallback} callback
     */
    Bamboo.prototype.createBranchPlan = function(planKey, bambooBranchName, vcsBranchName, callback) {
        var self = this,
            planUri = self.host + "/rest/api/latest/plan/" + planKey + "/branch/" + bambooBranchName + ".json?vcsBranch=" + vcsBranchName;

        request.put(
            planUri,
            {},
            function(error, response, body) {
                var errors = checkErrors(error, response);

                if (errors) {
                    callback(errors, null);
                    return;
                }

                try {
                    var json = JSON.parse(body);
                    callback(null, json.key);
                } catch (err) {
                    callback(err, null);
                }
            }
        )
    };

    /**
     * Callback for search
     *
     * @typedef {Function} searchCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {Array.<Object>} result - if no error, will return array of found entities
     */
    /**
     * Performs search on Bamboo's entities.
     * In order to provide suitable params, Please follow https://docs.atlassian.com/bamboo/REST/5.11.1/#d2e167
     *
     * @param {String} entityToSearch - the entity to search (currently, one of [users, authors, plans, branches, projects, versions])
     *
     * @param {searchCallback} callback
     * @param {Object=} urlParams - optional parameters for request url, like `{"os_authType": "basic"}`. You can provide here
     * search criteria
     * @example of urlParams
     *  {
     *      os_authType: "basic"
     *      masterPlanKey: "KEY",
     *      IncludeMasterBranch: false
     *  }
     */
    Bamboo.prototype.search = function(entityToSearch, callback, urlParams) {
        var self = this,
            planUri = self.host + "/rest/api/latest/search/" + entityToSearch + ".json";

        urlParams = urlParams || {};

        request({
            uri: planUri,
            qs: urlParams
        }, function(error, response, body) {
            var errors = checkErrors(error, response);

            if (errors) {
                callback(errors, null);
                return;
            }

            try {
                body = JSON.parse(body);
            } catch (parseError) {
                callback(parseError, null);
                return;
            }

            // keys in body, as defined in bamboo's API documentation
            var resultsKey = "searchResults",
                entityKey = "searchEntity";

            var searchResults = body[resultsKey]; // as defined in API documentation

            callback(null, _.pluck(searchResults, entityKey));
        });
    };

    /**
     * Method checks for errors in error and server response
     * Additionally parsing response body and checking if it contain any results
     *
     * @param {Error|null} error
     * @param {Object} response
     * @returns {Error|Boolean} if error, will return Error otherwise false
     * @protected
     */
    function checkErrorsWithResult(error, response) {
        var errors = checkErrors(error, response);

        if (errors !== false) {
            return errors;
        }

        try {
            var body = JSON.parse(response.body);
        } catch (parseError) {
            return parseError;
        }

        var results = body.results;

        if (typeof results === "undefined" || results.result.length === 0) {
            return new Error("The plan doesn't contain any result");
        }

        return false;
    }

    /**
     * Method checks for errors in error and server response
     *
     * @param {Error|null} error
     * @param {Object} response
     * @returns {Error|Boolean} if error, will return Error otherwise false
     * @protected
     */
    function checkErrors(error, response) {
        if (error) {
            return error instanceof Error ? error : new Error(error);
        }

        // Bamboo API enable plan returns 204 with empty response in case of success
        if ((response.statusCode !== 200) && (response.statusCode !== 204)) {
            return new Error("Unreachable endpoint! Response status code: " + response.statusCode);
        }

        return false;
    }

    /**
     * Method will add params to the specified url
     *
     * @param {String} url
     * @param {Object=} params - optional, object with parameters that should be merged with specified url
     * @returns {String}
     * @protected
     */
    function mergeUrlWithParams(url, params) {
        params = params || {};
        return _.isEmpty(params) ? url : url + "?" + qs.stringify(params);
    }

    return new Bamboo(host, username, password);
};
