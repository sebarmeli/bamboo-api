var Bamboo = require('../lib/bamboo'),
	should = require('should'),
	nock = require('nock');

describe ("bamboo.getLatestSuccessfulBuilNumber", function(){
	
	it("returns the latest successful build number", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/result/myPrj-myPlan.json')
			.reply(200, JSON.stringify({
				results : {
					result : [
						{
							number: "23",
							state: "Failed"
						},
						{
							number: "22",
							state: "Successful"
						}
					]
				}
			}));

		var bamboo = new Bamboo("http://host.com");
		bamboo.getLatestSuccessfulBuilNumber("myPrj-myPlan", "", function(result){
			result.should.equal("22");
		});
	});

	it("returns a msg when the plan doesn't contain any successful build", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/result/myPrj-myPlan.json')
			.reply(200, JSON.stringify({
				results : {
					result : [
						{
							number: "23",
							state: "Failed"
						},
						{
							number: "22",
							state: "Failed"
						}
					]
				}
			}));

		var bamboo = new Bamboo("http://host.com");
		bamboo.getLatestSuccessfulBuilNumber("myPrj-myPlan", "", function(result){
			result.should.equal("The plan doesn't contain any successful build");
		});
	});

	it("returns a msg when the plan doesn't contain any successful build", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/result/myPrj-myPlan.json')
			.reply(200, JSON.stringify({
				results : {
					size: 3,
					"max-result": 2,
					"start-index": 0,
					result : [
						{
							number: "23",
							state: "Failed"
						},
						{
							number: "22",
							state: "Failed"
						}
					]
				}
			}));

		var fake2 = nock('http://host.com')
			.get('/rest/api/latest/result/myPrj-myPlan.json?start-index=2')
			.reply(200, JSON.stringify({
				results : {
					size: 3,
					"max-result": 1,
					"start-index": 2,
					result : [
						{
							number: "21",
							state: "Failed"
						}
					]
				}
			}));

		var bamboo = new Bamboo("http://host.com");
		bamboo.getLatestSuccessfulBuilNumber("myPrj-myPlan", "", function(result){
			result.should.equal("The plan doesn't contain any successful build");
		});
	});

	it("returns a msg when the plan doesn't contain any result", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/result/myPrj-myPlan.json')
			.reply(200, JSON.stringify({
				results : {
					result : []
				}
			}));

		var bamboo = new Bamboo("http://host.com");
		bamboo.getLatestSuccessfulBuilNumber("myPrj-myPlan", "", function(result){
			result.should.equal("The plan doesn't contain any result");
		});
	});

	it("returns a msg when the plan doesn't exist", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/result/myPrj-myPlan.json')
			.reply(404);

		var bamboo = new Bamboo("http://host.com");
		bamboo.getLatestSuccessfulBuilNumber("myPrj-myPlan", "", function(result){
			result.should.equal("Unreachable endpoint");
		});
	});

	it("returns the latest successful build number in multiple 'requests'", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/result/myPrj-myPlan.json')
			.reply(200, JSON.stringify({
				results : {
					size: 3,
					"max-result": 2,
					"start-index": 0,
					result : [
						{
							number: "23",
							state: "Failed"
						},
						{
							number: "22",
							state: "Failed"
						}
					]
				}
			}));

		var fake2 = nock('http://host.com')
			.get('/rest/api/latest/result/myPrj-myPlan.json?start-index=2')
			.reply(200, JSON.stringify({
				results : {
					size: 3,
					"max-result": 1,
					"start-index": 2,
					result : [
						{
							number: "21",
							state: "Successful"
						}
					]
				}
			}));

		var bamboo = new Bamboo("http://host.com");
		bamboo.getLatestSuccessfulBuilNumber("myPrj-myPlan", "", function(result){
			result.should.equal("21");
		});
	});
});

describe ("bamboo.getLatestBuilsStatus", function(){
	it("returns the latest build Status", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/result/myPrj-myPlan.json')
			.reply(200, JSON.stringify({
				results : {
					result : [
						{
							number: "23",
							state: "Failed"
						},
						{
							number: "22",
							state: "Failed"
						},
						{
							number: "21",
							state: "Successful"
						}
					]
				}
			}));

		var bamboo = new Bamboo("http://host.com");
		bamboo.getLatestBuilsStatus("myPrj-myPlan", function(result){
			result.should.equal("Failed");
		});
	});

	it("returns the latest build Status", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/result/myPrj-myPlan.json')
			.reply(200, JSON.stringify({
				results : {
					size: 3,
					"max-result": 1,
					"start-index": 0,
					result : []
				}
			}));

		var bamboo = new Bamboo("http://host.com");
		bamboo.getLatestBuilsStatus("myPrj-myPlan", function(result){
			result.should.equal("The plan doesn't contain any result");
		});
	});

});

describe ("bamboo.getAllPlans", function(){
	it("returns a list of all plans available", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/plan.json')
			.reply(200, JSON.stringify({
				plans : {
					size: 3,
					"max-result": 2,
					"start-index": 0,
					plan : [
						{
							key: "AA-BB",
							name: "Full name1"
						},
						{
							key: "CC-DD",
							name: "Full name2"
						}
					]
				}
			}));

		var fake2 = nock('http://host.com')
			.get('/rest/api/latest/plan.json?start-index=2')
			.reply(200, JSON.stringify({
				plans : {
					size: 5,
					"max-result": 2,
					"start-index": 2,
					plan : [
						{
							key: "EE-FF",
							name: "Full name3"
						},
						{
							key: "GG-HH",
							name: "Full name4"
						}
					]
				}
			}));

		var fake3 = nock('http://host.com')
			.get('/rest/api/latest/plan.json?start-index=4')
			.reply(200, JSON.stringify({
				plans : {
					size: 5,
					"max-result": 1,
					"start-index": 4,
					plan : [
						{
							key: "II-LL",
							name: "Full name5"
						}
					]
				}
			}));

		var bamboo = new Bamboo("http://host.com");
		bamboo.getAllPlans("", function(result){
			result.should.eql([
				{ 
					key: "AA-BB",
					name: "Full name1"
				},
				{ 
					key: "CC-DD",
					name: "Full name2"
				},
				{ 
					key: "EE-FF",
					name: "Full name3"
				},
				{ 
					key: "GG-HH",
					name: "Full name4"
				},
				{ 
					key: "II-LL",
					name: "Full name5"
				}
			]);
		});
	});

	it("returns a string saying that there are no plans", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/plan.json')
			.reply(200, JSON.stringify({
				plans : {
					size: 3,
					"max-result": 1,
					"start-index": 0,
					plan : []
				}
			}));

		var bamboo = new Bamboo("http://host.com");
		bamboo.getAllPlans("", function(result){
			result.should.equal("No plans available");
		});
	});

});

describe ("bamboo.getArtifactContent", function(){
	it("returns the latest successful build number", function () {

		var fake = nock('http://host.com')
			.get('/browse/myPrj-myPlan-234/artifact/shared/name1/name1')
			.reply(200, "AAA");

		var bamboo = new Bamboo("http://host.com");
		bamboo.getArtifactContent("myPrj-myPlan", "234", "name1", function(result){
			result.should.equal("AAA");
		});
	});
});

describe ("bamboo.getJiraIssuesFromBuild", function(){
	it("returns the list of JIRA task from a build - no dependent plan", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/result/plan1-234.json?expand=jiraIssues')
			.reply(200, JSON.stringify({
				jiraIssues : {
					issue : [
						{
							key: "AAA"
						},
						{
							key: "BBB"
						}
					]
				}
			}));

		var bamboo = new Bamboo("http://host.com");
		bamboo.getJiraIssuesFromBuild("plan1", "234", "", function(result){
			result.should.eql(["AAA", "BBB"]);
		});
	});

	it("returns the list of JIRA task from a build - dependent on planB", function () {

		var fake = nock('http://host.com')
			.get('/rest/api/latest/result/plan1-234.json?expand=jiraIssues')
			.reply(200, JSON.stringify({
				buildReason: "Changes from plan2-99",
				jiraIssues : {
					issue : [
						{
							key: "AAA"
						},
						{
							key: "BBB"
						}
					]
				}
			}));

		var fake2 = nock('http://host.com')
			.get('/rest/api/latest/result/plan2-99.json?expand=jiraIssues')
			.reply(200, JSON.stringify({
				buildReason: "",
				jiraIssues : {
					issue : [
						{
							key: "CCC"
						},
						{
							key: "BBB"
						}
					]
				}
			}));

		var bamboo = new Bamboo("http://host.com");
		bamboo.getJiraIssuesFromBuild("plan1", "234", "plan2", function(result){
			result.should.eql(["AAA", "BBB", "CCC"]);
		});
	});
});