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
        _ = require('underscore');

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

    return new Bamboo(host, username, password);
};
