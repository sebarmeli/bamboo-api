var Bamboo = require('../lib/bamboo'),
    should = require('should'),
    nock = require('nock');

var baseTestUrl = 'http://host.com',
    testPlanKey = 'myPrj-myPlan',
    testApiUrl = '/rest/api/latest/result',
    testApiQueueUrl = '/rest/api/latest/queue',
    testApiPlanUrl = '/rest/api/latest/plan',
    testApiSearchUrl = '/rest/api/latest/search',
    testPlanResultUrl = testApiUrl + '/' + testPlanKey + '.json',
    testPlanLatest = '/rest/api/latest/plan.json';

describe("bamboo.getLatestSuccessfulBuildNumber", function() {
    "use strict";

    it("returns the latest successful build number", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl + "?")
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
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, function(error, result) {
            should.equal(error, null);
            result.toString().should.equal("22");
        });
    });

    it("returns a msg when the plan doesn't contain any successful build", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl + "?")
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
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, function(error, result) {
            error.toString().should.equal("Error: The plan doesn't contain any successful build");
            should.equal(result, null);
        });
    });

    it("returns a msg when the plan doesn't contain any successful build", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl + "?")
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
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, function(error, result) {
            error.toString().should.equal("Error: The plan doesn't contain any successful build");
            should.equal(result, null);
        });
    });

    it("returns a msg when the plan doesn't contain any result", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl + "?")
            .reply(200, JSON.stringify({
                results: {
                    result: []
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, function(error, result) {
            error.toString().should.equal("Error: The plan doesn\'t contain any result");
            should.equal(result, null);
        });
    });

    it("returns a msg when the plan doesn't exist", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl + "?")
            .reply(404);

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, function(error, result) {
            error.toString().should.equal("Error: Unreachable endpoint! Response status code: 404");
            should.equal(result, null);
        });
    });

    it("returns the latest successful build number in multiple 'requests'", function() {

        nock(baseTestUrl)
            .get(testPlanResultUrl + "?")
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
        bamboo.getLatestSuccessfulBuildNumber(testPlanKey, function(error, result) {
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


describe("bamboo.createBranchPlan", function() {
    "use strict";
    
    var bambooBranchName = "BambooBranchName";
    var vcsBranchName = "/refs/heads/VCS-Branch";
    
    var url = "/rest/api/latest/plan/" + testPlanKey + "/branch/" + bambooBranchName + ".json";
    
    it("create a branch plan", function() {

        nock(baseTestUrl)
            .put(url)
            .query({"vcsBranch": vcsBranchName})
            .reply(200, JSON.stringify({
                "description":"Plan Description",
                "shortName": bambooBranchName,
                "shortKey":"TF2",
                "enabled":true,
                "link":{
                    "href":"http://localhost:8085/rest/api/latest/plan/" + testPlanKey + "1",
                    "rel":"self"
                },
                "key": testPlanKey + "1",
                "name":"Name"
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.createBranchPlan(testPlanKey, bambooBranchName, vcsBranchName, function(error, result) {
            should.equal(error, null);
            should.equal(result, testPlanKey + 1);
        });
    });
    
    it("create same branch should fail with branch already existed", function () {
        nock(baseTestUrl)
            .put(url)
            .query({"vcsBranch": vcsBranchName})
            .reply(500, JSON.stringify({
                "message":"Invalid parameters while trying to create new branch BRANCH-NAME for plan PLAN-NAME. Error: branchName: [This name is already used in a branch or plan.]",
                "status-code":500
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.createBranchPlan(testPlanKey, bambooBranchName, vcsBranchName, function(error, result) {
            error.toString().length.should.be.above(10);
            should.equal(result, null);
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
            .get(testPlanLatest + "?")
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
        bamboo.getAllPlans(function(error, result) {
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
            .get(testPlanLatest + "?")
            .reply(200, JSON.stringify({
                plans: {
                    size: 3,
                    "max-result": 1,
                    "start-index": 0,
                    plan: []
                }
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getAllPlans(function(error, result) {
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

describe("bamboo.getArtifactContentStream", function() {
    "use strict";

    it("returns the latest successful build number", function(done) {
        nock(baseTestUrl)
            .get('/browse/myPrj-myPlan-234/artifact/shared/name1/name1')
            .reply(200, "AAA");

        var bamboo = new Bamboo(baseTestUrl);
        var stream = bamboo.getArtifactContentStream("myPrj-myPlan-234", "name1");
        stream.on('error', done);
        stream.on('readable', function () {
            var chunk;
            while (null !== (chunk = stream.read())) {
                chunk.toString().should.equal("AAA");
                done();
            }
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

    nock(baseTestUrl).get(testApiUrl + '/' + planKey + '.json?').matchHeader('Authorization', headerMatch).reply(200, result);

    it("should fail, since require authentication", function() {
        var bamboo = new Bamboo(baseTestUrl);

        bamboo.getLatestSuccessfulBuildNumber(planKey, function(error, result) {
            should.equal(result, null);
        });
    });

    it("returns the latest successful build number", function() {
        var bamboo = new Bamboo(baseTestUrl, username, password);

        bamboo.getLatestSuccessfulBuildNumber(planKey, function(error, result) {
            should.equal(error, null);
            result.should.equal("22");
        });
    });
});

describe("bamboo.getBuildState", function() {
    "use strict";

    it("returns the build State should be Successful", function() {

        nock(baseTestUrl)
            .get(testApiUrl + '/' + testPlanKey + '/422.json')
            .reply(200, JSON.stringify({
                state: "Successful"
            }));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.getBuildState(testPlanKey + '/422', function(error, result) {
            should.equal(error, null);
            result.should.equal("Successful");
        });
    });
});

describe("bamboo.buildPlan", function() {
    "use strict";

    it("fire build execution", function() {
        var responseExpected = {
            triggerReason: "Manual build"
        };

        nock(baseTestUrl)
            .post(testApiQueueUrl + '/' + testPlanKey + '/467.json')
            .reply(200, JSON.stringify(responseExpected));

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.buildPlan(testPlanKey + '/467', function(error, result) {
            should.equal(error, null);
            result.should.equal(JSON.stringify(responseExpected));
        });
    });
});

describe("bamboo.enablePlan", function() {
    "use strict";

    it("changes status of a given plan to enabled", function() {
        var responseExpected = true;

        nock(baseTestUrl)
            .post(testApiPlanUrl + '/' + testPlanKey + '/766/enable.json')
            .reply(200);

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.enablePlan(testPlanKey + '/766', function(error, result) {
            should.equal(error, null);
            result.should.equal(responseExpected);
        });
    });
    
    it("changes status of a given plan to enabled (204)", function() {
        var responseExpected = true;

        nock(baseTestUrl)
            .post(testApiPlanUrl + '/' + testPlanKey + '/766/enable.json')
            .reply(204);

        var bamboo = new Bamboo(baseTestUrl);
        bamboo.enablePlan(testPlanKey + '/766', function(error, result) {
            should.equal(error, null);
            result.should.equal(responseExpected);
        });
    });
});

describe("bamboo.search", function() {
    "use strict";

    it("should do search", function() {
        var responseExpected = ["test version"];

        nock(baseTestUrl)
            .get(testApiSearchUrl + '/versions.json?searchTerm=test')
            .reply(200, JSON.stringify({"searchResults": [{"searchEntity": "test version"}]}));

        var bamboo = new Bamboo(baseTestUrl);

        var urlParams = {searchTerm: "test"};

        bamboo.search('versions', function(error, result) {
            should.equal(error, null);
            JSON.stringify(result).should.equal(JSON.stringify(responseExpected));
        }, urlParams);
    });
});