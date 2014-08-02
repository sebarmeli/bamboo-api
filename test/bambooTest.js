var Bamboo = require('../lib/bamboo'),
    should = require('should'),
    nock = require('nock');

var baseTestUrl = 'http://host.com',
    testPlanKey = 'myPrj-myPlan',
    testApiUrl = '/rest/api/latest/result',
    testPlanResultUrl = testApiUrl + '/' + testPlanKey + '.json',
    testPlanLatest = '/rest/api/latest/plan.json';

describe("bamboo.getLatestSuccessfulBuildNumber", function() {
    "use strict";

    it("returns the latest successful build number", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl)
            .reply(200, JSON.stringify({
                results: {
                    result: [
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

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, "", function(error, result) {
            should.equal(error, null);
            result.toString().should.equal("22");
        });
    });

    it("returns a msg when the plan doesn't contain any successful build", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl)
            .reply(200, JSON.stringify({
                results: {
                    result: [
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

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, "", function(error, result) {
            error.toString().should.equal("Error: The plan doesn't contain any successful build");
            should.equal(result, null);
        });
    });

    it("returns a msg when the plan doesn't contain any successful build", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl)
            .reply(200, JSON.stringify({
                results: {
                    size: 3,
                    "max-result": 2,
                    "start-index": 0,
                    result: [
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

        nock(baseTestUrl)
            .get(testPlanResultUrl + '?start-index=2')
            .reply(200, JSON.stringify({
                results: {
                    size: 3,
                    "max-result": 1,
                    "start-index": 2,
                    result: [
                        {
                            number: "21",
                            state: "Failed"
                        }
                    ]
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, "", function(error, result) {
            error.toString().should.equal("Error: The plan doesn't contain any successful build");
            should.equal(result, null);
        });
    });

    it("returns a msg when the plan doesn't contain any result", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl)
            .reply(200, JSON.stringify({
                results: {
                    result: []
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, "", function(error, result) {
            error.toString().should.equal("Error: The plan doesn't contain any result");
            should.equal(result, null);
        });
    });

    it("returns a msg when the plan doesn't exist", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl)
            .reply(404);

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, "", function(error, result) {
            error.toString().should.equal("Error: Unreachable endpoint");
            should.equal(result, null);
        });
    });

    it("returns the latest successful build number in multiple 'requests'", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl)
            .reply(200, JSON.stringify({
                results: {
                    size: 3,
                    "max-result": 2,
                    "start-index": 0,
                    result: [
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

        nock(baseTestUrl)
            .get(testPlanResultUrl + '?start-index=2')
            .reply(200, JSON.stringify({
                results: {
                    size: 3,
                    "max-result": 1,
                    "start-index": 2,
                    result: [
                        {
                            number: "21",
                            state: "Successful"
                        }
                    ]
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, "", function(error, result) {
            should.equal(error, null);
            result.toString().should.equal("21");
        });
    });
});

describe("bamboo.getBuildStatus", function() {
    "use strict";

    it("returns the build Status", function() {

        nock(baseTestUrl)
            .get(testApiUrl + '/' + testPlanKey + '/416.json')
            .reply(200, JSON.stringify({
                lifeCycleState: "InProgress"
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getBuildStatus(testPlanKey + '/416', function(error, result) {
            should.equal(error, null);
            result.should.equal("InProgress");
        });
    });
});

describe("bamboo.getLatestBuildStatus", function() {
    "use strict";

    it("returns the latest build Status", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl)
            .reply(200, JSON.stringify({
                results: {
                    result: [
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

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getLatestBuildStatus(testPlanKey, function(error, state, number) {
            should.equal(error, null);
            state.should.equal("Failed");
            number.should.equal("23");
        });
    });

    it("returns the latest build Status", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl)
            .reply(200, JSON.stringify({
                results: {
                    size: 3,
                    "max-result": 1,
                    "start-index": 0,
                    result: []
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getLatestBuildStatus(testPlanKey, function(error, state, number) {
            error.toString().should.equal("Error: The plan doesn't contain any result");
            should.equal(state, null);
            should.equal(number, null);
        });
    });
});

describe("bamboo.getAllPlans", function() {
    "use strict";

    it("returns a list of all plans available", function() {

        nock(baseTestUrl)
            .get(testPlanLatest)
            .reply(200, JSON.stringify({
                plans: {
                    size: 3,
                    "max-result": 2,
                    "start-index": 0,
                    plan: [
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

        nock(baseTestUrl)
            .get(testPlanLatest + '?start-index=2')
            .reply(200, JSON.stringify({
                plans: {
                    size: 5,
                    "max-result": 2,
                    "start-index": 2,
                    plan: [
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

        nock(baseTestUrl)
            .get(testPlanLatest + '?start-index=4')
            .reply(200, JSON.stringify({
                plans: {
                    size: 5,
                    "max-result": 1,
                    "start-index": 4,
                    plan: [
                        {
                            key: "II-LL",
                            name: "Full name5"
                        }
                    ]
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getAllPlans("", function(error, result) {
            should.equal(error, null);
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

    it("returns a string saying that there are no plans", function() {

        nock(baseTestUrl)
            .get(testPlanLatest)
            .reply(200, JSON.stringify({
                plans: {
                    size: 3,
                    "max-result": 1,
                    "start-index": 0,
                    plan: []
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getAllPlans("", function(error, result) {
            error.toString().should.equal("Error: No plans available");
            should.equal(result, null);
        });
    });

});

describe("bamboo.getArtifactContent", function() {
    "use strict";

    it("returns the latest successful build number", function() {

        nock(baseTestUrl)
            .get('/browse/myPrj-myPlan-234/artifact/shared/name1/name1')
            .reply(200, "AAA");

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getArtifactContent("myPrj-myPlan-234", "name1", function(error, result) {
            should.equal(error, null);
            result.should.equal("AAA");
        });
    });
});

describe("bamboo.getJiraIssuesFromBuild", function() {
    "use strict";

    it("returns the list of JIRA task from a build - no dependent plan", function() {

        nock(baseTestUrl)
            .get(testApiUrl + '/plan1-234.json?expand=jiraIssues')
            .reply(200, JSON.stringify({
                buildReason: "",
                jiraIssues: {
                    issue: [
                        {
                            key: "AAA"
                        },
                        {
                            key: "BBB"
                        }
                    ]
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getJiraIssuesFromBuild("plan1-234", function(error, result) {
            should.equal(error, null);
            result.should.eql(["AAA", "BBB"]);
        });
    });

    it("returns the list of JIRA task from a build - dependent on planB", function() {

        nock(baseTestUrl)
            .get(testApiUrl + '/plan1-234.json?expand=jiraIssues')
            .reply(200, JSON.stringify({
                buildReason: "Child of <a>plan2-99</a>",
                jiraIssues: {
                    issue: [
                        {
                            key: "AAA"
                        },
                        {
                            key: "BBB"
                        }
                    ]
                }
            }));

        nock(baseTestUrl)
            .get(testApiUrl + '/plan2-99.json?expand=jiraIssues')
            .reply(200, JSON.stringify({
                buildReason: "Child of <a>plan3-11</a>",
                jiraIssues: {
                    issue: [
                        {
                            key: "CCC"
                        },
                        {
                            key: "BBB"
                        }
                    ]
                }
            }));

        nock(baseTestUrl)
            .get(testApiUrl + '/plan3-11.json?expand=jiraIssues')
            .reply(200, JSON.stringify({
                buildReason: "Changes by <a>XX</a>",
                jiraIssues: {
                    issue: [
                        {
                            key: "DDD"
                        },
                        {
                            key: "EEE"
                        }
                    ]
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getJiraIssuesFromBuild("plan1-234", function(error, result) {
            should.equal(error, null);
            result.should.eql(["AAA", "BBB", "CCC", "DDD", "EEE"]);
        });
    });
});
describe("bamboo.getChangesFromBuild", function() {
    "use strict";

    it("returns the list of changes from a build - no dependent plan", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl + '?expand=changes')
            .reply(200, JSON.stringify({
                changes: {
                    change: [
                        {
                            fullName: "Paul Smith"
                        },
                        {
                            fullName: "Mark Rose"
                        }
                    ]
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getChangesFromBuild(testPlanKey, function(error, result) {
            should.equal(error, null);
            result.should.eql(["Paul Smith", "Mark Rose"]);
        });
    });

    it("returns the list of JIRA task from a build - dependent on planB", function() {

        nock(baseTestUrl)
            .get(testApiUrl + '/plan1-234.json?expand=changes')
            .reply(200, JSON.stringify({
                buildReason: "Child of <a>plan2-99</a>",
                changes: {
                    change: [
                        {
                            fullName: "Paul Smith"
                        },
                        {
                            fullName: "Mark Rose"
                        }
                    ]
                }
            }));

        nock(baseTestUrl)
            .get(testApiUrl + '/plan2-99.json?expand=changes')
            .reply(200, JSON.stringify({
                buildReason: "Child of <a>plan3-11</a>",
                changes: {
                    change: [
                        {
                            fullName: "Eric Red"
                        },
                        {
                            fullName: "Mark White"
                        }
                    ]
                }
            }));

        nock(baseTestUrl)
            .get(testApiUrl + '/plan3-11.json?expand=changes')
            .reply(200, JSON.stringify({
                buildReason: "Changes by <a>XX</a>",
                changes: {
                    change: [
                        {
                            fullName: "Cait Black"
                        },
                        {
                            fullName: "Louise Yellow"
                        }
                    ]
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getChangesFromBuild("plan1-234", function(error, result) {
            should.equal(error, null);
            result.should.eql(["Paul Smith", "Mark Rose", "Eric Red", "Mark White", "Cait Black", "Louise Yellow"]);
        });
    });

});

describe("bamboo base http authentication, test on bamboo.getLatestSuccessfulBuildNumber method", function() {
    "use strict";

    var username = 'testuser',
        password = 'testpassword',
        authString = username + ':' + password,
        encrypted = (new Buffer(authString)).toString('base64'),
        planKey = "myPrjAuth-myPlanAuth",
        result = JSON.stringify({
            results: {
                result: [
                    {
                        number: "22",
                        state: "Successful"
                    },
                    {
                        number: "23",
                        state: "Failed"
                    }
                ]
            }
        }),
        headerMatch = function(val) { return val === 'Basic ' + encrypted; };

    nock(baseTestUrl).get(testApiUrl + '/' + planKey + '.json').matchHeader('Authorization', headerMatch).reply(200, result);

    it("should fail, since require authentication", function() {
        var bamboo = new Bamboo(baseTestUrl);

        bamboo.getLatestSuccessfulBuildNumber(planKey, false, function(error, result) {
            should.equal(result, null);
        });
    });

    it("returns the latest successful build number", function() {
        var bamboo = new Bamboo(baseTestUrl, username, password);

        bamboo.getLatestSuccessfulBuildNumber(planKey, false, function(error, result) {
            should.equal(error, null);
            result.should.equal("22");
        });
    });
});
