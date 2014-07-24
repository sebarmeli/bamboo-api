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
});

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

describe ("bamboo.getBuildStatus", function(){
  it("returns the build Status", function () {

    var fake = nock('http://host.com')
      .get('/rest/api/latest/result/myPlan-213.json')
      .reply(200, JSON.stringify({
        lifeCycleState: "InProgress"
      }));

    var bamboo = new Bamboo("http://host.com");
    bamboo.getBuildStatus("myPlan-213", function(result){
      result.should.equal("InProgress");
    });
  });
});

describe ("bamboo.getLatestBuildStatus", function(){
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
    bamboo.getLatestBuildStatus("myPrj-myPlan", function(result){
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
    bamboo.getLatestBuildStatus("myPrj-myPlan", function(result){
      result.should.equal("The plan doesn't contain any result");
    });
  });

  it("returns the latest status and the build number", function () {
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
    bamboo.getLatestBuildStatus("myPrj-myPlan", function(result, resultNo){
      result.should.equal("Failed");
      resultNo.should.equal("23");
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
    bamboo.getArtifactContent("myPrj-myPlan-234", "name1", function(result){
      result.should.equal("AAA");
    });
  });
});

describe ("bamboo.getJiraIssuesFromBuild", function(){
  it("returns the list of JIRA task from a build - no dependent plan", function () {

    var fake = nock('http://host.com')
      .get('/rest/api/latest/result/plan1-234.json?expand=jiraIssues')
      .reply(200, JSON.stringify({
        buildReason: "",
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
    bamboo.getJiraIssuesFromBuild("plan1-234", function(result){
      result.should.eql(["AAA", "BBB"]);
    });
  });

  it("returns the list of JIRA task from a build - dependent on planB", function () {

    var fake = nock('http://host.com')
      .get('/rest/api/latest/result/plan1-234.json?expand=jiraIssues')
      .reply(200, JSON.stringify({
        buildReason: "Child of <a>plan2-99</a>",
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
        buildReason: "Child of <a>plan3-11</a>",
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

    var fake3 = nock('http://host.com')
      .get('/rest/api/latest/result/plan3-11.json?expand=jiraIssues')
      .reply(200, JSON.stringify({
        buildReason: "Changes by <a>XX</a>",
        jiraIssues : {
          issue : [
            {
              key: "DDD"
            },
            {
              key: "EEE"
            }
          ]
        }
      }));

    var bamboo = new Bamboo("http://host.com");
    bamboo.getJiraIssuesFromBuild("plan1-234", function(result){
      result.should.eql(["AAA", "BBB", "CCC", "DDD", "EEE"]);
    });
  });
});
describe ("bamboo.getChangesFromBuild", function(){
  it("returns the list of changes from a build - no dependent plan", function () {

    var fake = nock('http://host.com')
      .get('/rest/api/latest/result/plan1-234.json?expand=changes')
      .reply(200, JSON.stringify({
        changes : {
          change : [
            {
              fullName: "Paul Smith"
            },
            {
              fullName: "Mark Rose"
            }
          ]
        }
      }));

    var bamboo = new Bamboo("http://host.com");
    bamboo.getChangesFromBuild("plan1-234", function(result){
      result.should.eql(["Paul Smith", "Mark Rose"]);
    });
  });

  it("returns the list of JIRA task from a build - dependent on planB", function () {

    var fake = nock('http://host.com')
      .get('/rest/api/latest/result/plan1-234.json?expand=changes')
      .reply(200, JSON.stringify({
        buildReason: "Child of <a>plan2-99</a>",
        changes : {
          change : [
            {
              fullName: "Paul Smith"
            },
            {
              fullName: "Mark Rose"
            }
          ]
        }
      }));

    var fake2 = nock('http://host.com')
      .get('/rest/api/latest/result/plan2-99.json?expand=changes')
      .reply(200, JSON.stringify({
        buildReason: "Child of <a>plan3-11</a>",
        changes : {
          change : [
            {
              fullName: "Eric Red"
            },
            {
              fullName: "Mark White"
            }
          ]
        }
      }));

    var fake3 = nock('http://host.com')
      .get('/rest/api/latest/result/plan3-11.json?expand=changes')
      .reply(200, JSON.stringify({
        buildReason: "Changes by <a>XX</a>",
        changes : {
          change : [
            {
              fullName: "Cait Black"
            },
            {
              fullName: "Louise Yellow"
            }
          ]
        }
      }));

    var bamboo = new Bamboo("http://host.com");
    bamboo.getChangesFromBuild("plan1-234", function(result){
      result.should.eql(["Paul Smith", "Mark Rose", "Eric Red", "Mark White", "Cait Black", "Louise Yellow"]);
    });
  });

});

describe ("bamboo base http authentication, test on bamboo.getLatestSuccessfulBuilNumber method", function(){
    var baseUrl = 'http://host.com'
        , username = 'testuser'
        , password = 'testpassword'
        , authString = username + ':' + password
        , encrypted = (new Buffer(authString)).toString('base64')
        , planKey = "myPrjAuth-myPlanAuth"
        , result = JSON.stringify({
            results : {
                result : [{
                    number: "22",
                    state: "Successful"
                }, {
                    number: "23",
                    state: "Failed"
                }]
            }
        })
        , headerMatch = function(val) { return val == 'Basic ' + encrypted };

    nock(baseUrl).get('/rest/api/latest/result/myPrjAuth-myPlanAuth.json').matchHeader('Authorization', headerMatch).reply(200, result);

    it("should fail, since require authentication", function () {
        var bamboo = new Bamboo(baseUrl);

        bamboo.getLatestSuccessfulBuilNumber(planKey, false, function(result){
            result.should.equal("Unreachable endpoint");
        });
    });

    it("returns the latest successful build number", function () {
        var bamboo = new Bamboo(baseUrl, username, password);

        bamboo.getLatestSuccessfulBuilNumber(planKey, false, function(result){
            result.should.equal("22");
        });
    });
});
