var request = require('request'),
	_ = require('underscore');

/*
*	Function defining a Bamboo instance
*
*   @param {String} hostname. E.g. "http://hostname.com:8085"
*/
function Bamboo(host) {
	this.host = host || "http://localhost:8085";
}

/*
*	Returns the latest successful build number
*
*   @return {String} build number
*   @param {String} planKey. Bamboo plan key name
*   @return {String} params. Query string. E.g. "?start-index=25"
*   @param {String} callback. Executed when the remote JSON has been parsed.
*/
Bamboo.prototype.getLatestSuccessfulBuilNumber = function(planKey, params, callback) {
	var self = this,
		planUri = self.host + "/rest/api/latest/result/" + planKey + ".json";
	planUri += (params) ? params : "";

	request({ uri: planUri }, function (error, response, body) {

		var errors = checkErrors(error, response);
		if (errors) {
			callback(errors);
			return false;
		}

		var bodyJson = JSON.parse(response.body),
			results = bodyJson.results,
			result = results.result,
			build_no = "",
			isSearching = false;

		// Search for the latest 'Successful' build
		for (var i = 0, len = result.length; i < len; i ++){
			var resultEl = result[i];

			if (resultEl.state === "Successful") {
				build_no = resultEl.number;
				callback(build_no);
				return;
			}
		}
		
		// Loop through the next series of builds
		var newIndex = results["max-result"] + results["start-index"];
		if (newIndex < results.size) {
			isSearching = true;
			self.getLatestSuccessfulBuilNumber(planKey, "?start-index=" + newIndex, function(result){
				callback(result);
				return;
			});
		} else {
			isSearching = false;
		}

		if (!build_no && !isSearching) {
			callback("The plan doesn't contain any successful build");
		}
    });
};

/*
*	Returns the latest build status
*
*   @return {String} build number
*   @param {String} planKey. Bamboo plan key name
*   @param {String} callback. Executed when the remote JSON has been parsed.
*/
Bamboo.prototype.getLatestBuilsStatus = function(planKey, callback) {
	var self = this,
		planUri = self.host + "/rest/api/latest/result/" + planKey + ".json";
	
	request({ uri: planUri }, function (error, response, body) {
		var errors = checkErrors(error, response);

		if (errors) {
			callback(errors);
			return false;
		}

		var bodyJson = JSON.parse(response.body),
			results = bodyJson.results;

		callback(results.result[0].state);
    });
};

/*
*	Returns the jira issues associated to a specific build. It also considers a dependent plan
*
*   @return {Array} List of JIRA tasks
*   @param {String} planKey. Bamboo plan key name
*   @param {String} buildNum. Bamboo build number
*   @param {String} dependendPlan. Bamboo dependent plan
*   @param {String} callback. Executed when the remote JSON has been parsed.
*/
Bamboo.prototype.getJiraIssuesFromBuild = function(planKey, buildNum, dependendPlan, callback) {
	var self = this,
		planUri = self.host + "/rest/api/latest/result/" + planKey + "-" + buildNum + ".json?expand=jiraIssues";
	
	request({ uri: planUri }, function (error, response, body) {
		if (error || response.statusCode !== 200) {
			callback("Unreachable endpoint");
			return false;
		}

		var bodyJson = JSON.parse(response.body),
			jiraIssues = bodyJson.jiraIssues.issue,
			buildReason = bodyJson.buildReason,
			jiraNumbers = [];
		
		_.each(jiraIssues, function(issue){
			jiraNumbers.push(issue.key);
			_.uniq(jiraNumbers);
		});

		if (dependendPlan && buildReason.indexOf(dependendPlan) != -1) {
			var r = dependendPlan + "-\\d+",
				reg = new RegExp(r, "g"),
				buildNumDependent = buildReason.match(reg)[0].replace(dependendPlan,"").substring(1);

			// Search for JIRA issues coming from the dependent plan
			self.getJiraIssuesFromBuild(dependendPlan, buildNumDependent, null, function(result){
				_.each(result, function(item){ 
					jiraNumbers.push(item); 
				});
				callback(_.uniq(jiraNumbers));
			});
		} else {
			callback(jiraNumbers);
		}
	});
};

/*
*	Returns the content of an artifact associated to a build
*
*   @return {String} content of an articact
*   @param {String} planKey. Bamboo plan key name
*   @param {String} buildNum. Bamboo build number
*   @param {String} artifactName. Artifact name
*   @param {String} callback. Executed when the remote JSON has been parsed.
*/
Bamboo.prototype.getArtifactContent = function(planKey, buildNum, artifactName, callback) {
	var self = this,
		artifactUri = self.host + "/browse/" + planKey + "-" + buildNum + "/artifact/shared/" + artifactName + "/" + artifactName;
	
	request({ uri: artifactUri }, function (error, response, body) {
		if (error || response.statusCode !== 200) {
			callback("Unreachable endpoint");
			return false;
		}
		callback(body.toString("utf-8", 0));
    });
};

/*
*	Returns the list of plans key names available
*
*   @return {Array} currentPlans - List of plans available (each plan has a 'key' and a 'name' value)
*   @return {String} params - Query string. E.g. "?start-index=25"
*   @param {String} callback. Executed when the remote JSON has been parsed.
*/
Bamboo.prototype.getAllPlans = function(params, callback, currentPlans) {
	var self = this,
		list = currentPlans || [],
		planUri = self.host + "/rest/api/latest/plan.json";

	planUri += (params) ? params : "";

	request({ uri: planUri }, function (error, response, body) {

		if (error || response.statusCode !== 200) {
			callback("Unreachable endpoint");
			return false;
		}

		var bodyJson = JSON.parse(response.body),
			plans = bodyJson.plans;

		if (plans.plan.length === 0) {
			callback("No plans available");
			return false;
		}

		_.each(plans.plan, function(plan){
			list.push({
				key: plan.key,
				name: plan.name
			});
		});

		// Loop through the next series of builds
		var newIndex = plans["max-result"] + plans["start-index"];

		if (newIndex < plans.size) {
			self.getAllPlans("?start-index=" + newIndex, function(result){
				callback(result);
			}, list);
		} else {
			callback(list);
		}
    });
};


function checkErrors(error, response) {
	if (error || response.statusCode !== 200) {
		return "Unreachable endpoint";
	}

	var body = JSON.parse(response.body),
		results = body.results;

	if (results.result.length === 0) {
		return "The plan doesn't contain any result";
	}
}

module.exports = Bamboo;