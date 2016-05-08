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
        stream = require('stream');

    /**
     * Function defining a Bamboo instance
     *
     * @param {String} host - hostname. By default "http://hostname.com:8085"
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
     * @param {String|Boolean} params - Query string. E.g. "?start-index=25". Could be false
     * @param {getLatestSuccessfulBuildNumberCallback} callback
     */
    Bamboo.prototype.getLatestSuccessfulBuildNumber = function(planKey, params, callback) {
        var self = this,
            planUri = self.host + "/rest/api/latest/result/" + planKey + ".json" + (params || "");

        request({ uri: planUri }, function(error, response, body) {
            var errors = checkErrorsWithResult(error, response);

            if (errors) {
                callback(errors, null);
                return;
            }

            var bodyJson = JSON.parse(body),
                results = bodyJson.results,
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
                self.getLatestSuccessfulBuildNumber(planKey, "?start-index=" + newIndex, function(error, result) {
                    callback(error, result);
                });
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

            var bodyJson = JSON.parse(body),
                results = bodyJson.results,
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

            var bodyJson = JSON.parse(body);

            callback(null, bodyJson.lifeCycleState);
        });
    };
    
    
    /**
     * Callback for getBuildState
     *
     * @typedef {Function} getBuildStateCallback
     * @param {Error|null} error - will return null if no error happen
     * @param {String|null} state - build state, like "Successful" of "Failure"
     *
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

            var bodyJson = JSON.parse(body);

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

            var bodyJson = JSON.parse(body),
                changes = bodyJson.changes.change,
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

            var bodyJson = JSON.parse(body),
                jiraIssues = bodyJson.jiraIssues.issue,
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

            callback(null, body.toString("utf-8", 0));
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
          out.emit('error', error);
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
     * @param {String|null} result - if no error will return build number
     */
    /**
     * Returns the list of plans, key and names available
     *
     * @param {String|Boolean} params - Query string. E.g. "?start-index=25". Could be false
     * @param {getAllPlansCallback} callback
     * @param {Array=} currentPlans - List of plans available (each plan has a 'key' and a 'name' value)
     */
    Bamboo.prototype.getAllPlans = function(params, callback, currentPlans) {
        var self = this,
            planUri = self.host + "/rest/api/latest/plan.json" + (params || "");

        currentPlans = currentPlans || [];

        request({ uri: planUri }, function(error, response, body) {
            var errors = checkErrors(error, response);

            if (errors) {
                callback(errors, null);
                return;
            }

            var bodyJson = JSON.parse(body),
                plans = bodyJson.plans;

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
                self.getAllPlans("?start-index=" + newIndex, function(error, result) {
                    var errors = checkErrors(error, response);

                    if (errors) {
                        callback(errors, null);
                        return;
                    }

                    callback(null, result);
                }, currentPlans);
            } else {
                callback(null, currentPlans);
            }
        });
    };

    /**
     *
     * @param {String} buildDetails - "PROJECT_KEY-PLAN_KEY"
     * @param {Object} params
     * @param callback
     */
    Bamboo.prototype.buildPlan = function(buildDetails, params, callback) {
        var errorStatusCodes = [400, 401, 404, 415]; // as described in https://docs.atlassian.com/bamboo/REST/5.9.1-SNAPSHOT/#d2e620, 500 raises the error argument
        var self = this,
            planUri = self.host + "/rest/api/latest/queue/" + buildDetails + ".json?os_authType=basic";

        request.post(
            planUri,
            (!params || _.isEmpty(params)) ? {} : {form: params},
            handleResponse(errorStatusCodes, callback)
        )
    }

    /**
     * Changes staus of a given plan as described below to enabled.
     * On success - callback(null, true)
     * On failure - callback(error)
     *
     * @param   {String} planKey - "PROJECT_KEY-PLAN_KEY"
     * @param   {Object} params
     * @param   callback
     */
    Bamboo.prototype.enablePlan = function(planKey, callback) {
        var successResult = true;
        var self = this,
            planUri = self.host + "/rest/api/latest/plan/" + planKey + "/enable.json?os_authType=basic";
        request.post(
            planUri,
            {},
            function(error, response, body) {
                if (error) {
                    callback(error);
                }
                callback(null, successResult);
            }
        )
    }
    
    /**
     * creates a plan branch in Bamboo 
     * 
     * this call seems to be not documented, so we relay on some forum data:
     * https://answers.atlassian.com/questions/215164/bamboo-rest-api-to-create-branches
     * 
     * note that for this to work, a repository needs to be link to Bamboo plan, since its not well documented
     * I dont know how to handle multiple repositories  
     * 
     * On success - callback(null, true)
     * On failure - callback(error)
     *
     * @param   {String} planKey - "PROJECT_KEY-PLAN_KEY"
     * @param   {String} bambooBranchName - the name that will be displayed in Bamboo for the branch
     * @param   {String} vcsBranchName - the branch name in the repository, this parameter depends on the version control used,
     * in git its something like "refs/heads/BRANCH_NAME" - you can find it by going to .git/refs/heads folder in your file system 
     * @param   {Object} params
     * @param   callback
     */
    Bamboo.prototype.createBranchPlan = function(planKey, bambooBranchName, vcsBranchName, callback) {
        var successResult = true;
        var self = this,
            planUri = self.host + "/rest/api/latest/plan/" + planKey + "/branch/" + bambooBranchName + ".json?vcsBranch=" + vcsBranchName;
        
        request.put(
            planUri,
            {},
            function(error, response, body) {
                
                if (response.statusCode !== 200) {
                   return new Error(body);
                }
                
                if (error) {
                    callback(error);
                }
                try {
                    var json = JSON.parse(body.toString("utf-8", 0));
                    
                    callback(null, json);
                } catch (err) {
                    callback(err);
                }
            }
        )
    }

  /**
     * Performs search on Bamboo's entities
     * In order to provide suitable params, Please follow https://docs.atlassian.com/bamboo/REST/5.5.0/#d2e923
     * @param entityToSearch    string - The entity to search (currently, one of [users, authors, plans, branches, projects, versions])
     * @param optionsQuery      object - search parameters to provide as described in link above, represented as object
     * @example of optionsQuery
     *  {
     *      masterPlanKey: "KEY",
     *      IncludeMasterBranch: false
     *  }
     * @param callback - callback(error) on error, callback(null, result) else
     *
     * @return [object]  array of found entities
     *
     */
    Bamboo.prototype.search = function (entityToSearch, params, callback) {

        var self = this,
            planUri = self.host + "/rest/api/latest/search/" + entityToSearch + ".json";

        request({
            uri: planUri,
            qs: params
        }, function (error, response, body) {

            // keys in body, as defined in bamboo's apidoc
            var resultsKey = "searchResults",
                entityKey = "searchEntity";

            if (error) {
                return callback(error);
            }

            try {
                var body = JSON.parse(body.toString("utf-8", 0));
                var searchResults = body[resultsKey]; // as defined in doc

                return callback(null, _.pluck(searchResults, entityKey));

            } catch (err) {
                callback(err);
            }
        });
    }

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

        var body = JSON.parse(response.body),
            results = body.results;

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

        if (response.statusCode !== 200) {
            return new Error("Unreachable endpoint");
        }

        return false;
    }
    
    /**
     * According to bamboo's doc, each RestAPI resource has specific error status codes available.
     * For some error status codes (such as 401 Unauthorized), error object is empty.
     * If response's status code is one of the given status codes, the given callback will be called with error.
     *
     * Given error status codes and desired callback, the function will generate a response handler to request which will behave as described above.
     *
     * @param errorStatusCodes  {[Number]}  Array of possible error status codes (each request has specific possible error status codes evailable)
     * @param callback          If response's status code is one of the possible error status codes or error object is not null - error is raised,
     *                          else - callback is called with the body
     *
     * @return - Handler as follows:
     *  @param error             {Error}     Error raised from request if exist
     *  @param response          {Object}    The result response object of the request sent
     *  @param body              {Object}    The result body object of the request sent
     */
    function generateResponseHandler(errorStatusCodes, callback) {
        return function handler(error, response, body) {
            if (error) {
                return callback(error);
            }
            if (_.contains(errorStatusCodes, response.statusCode)) { // if error contains
                return callback(body.toString("utf-8", 0));
            }
            // Possible errors handled and not found, call with body as result
            callback(error, body.toString("utf-8", 0));
        }
    }

    return new Bamboo(host, username, password);
};
