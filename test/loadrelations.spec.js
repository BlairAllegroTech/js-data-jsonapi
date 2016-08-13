describe('Resource.loadRelations(id, [relations],[options])', function () {
    describe('WITH belongsTo', function () {
        var ds;
        var testData = { config: {} };

        beforeEach(function () {
            ds = new JSData.DS();
            var http = new DSHttpAdapter({});
            var dsHttpAdapter = new DSJsonApiAdapter.JsonApiAdapter({
                adapter: http,
                queryTransform: queryTransform,
                basePath: 'http://xxx/'
            });

            ds.registerAdapter('jsonApi', dsHttpAdapter, { default: true });

            testData.config.userContainer = ds.defineResource({
                name: 'container',
                idAttribute: 'Id',
                relations: {
                    // hasMany uses "localField" and "localKeys" or "foreignKey"
                    hasMany: {
                        posts: {
                            localField: 'containedposts',
                            foreignKey: 'containerid'
                        }
                    }
                }
            });


            testData.config.Post = ds.defineResource({
                name: 'posts',
                idAttribute: 'Id',
                relations: {
                    belongsTo: {
                        container: {
                            localField: 'Container',
                            localKey: 'containerid',
                            //parent: true
                        }
                    }
                }
            });

        });

        describe('(METHOD#1) loadRelations', function () {
            it('should make a GET request to load related "oneToMany" data', function () {
                var _this = this;

                setTimeout(function () {
                    assert.equal(1, _this.requests.length, "First Call");
                    var request = _this.requests[_this.requests.length - 1];

                    assert.equal(request.url, 'http://xxx/container/1');
                    assert.equal(request.method, 'GET');
                    assert.isDefined(request.requestHeaders);
                    assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');

                    var container = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                        .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('container')
                            .WithId('1')
                            .WithLink('self', '/container/1')
                            .WithRelationship('containedposts',
                            new DSJsonApiAdapter.JsonApi.JsonApiRelationship(true)
                                .WithLink('related', 'container/1/posts')
                                .WithData('posts', '5')
                            ));

                    request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(container));
                }, 30);

                // Load data
                return testData.config.userContainer.find(1).then(function (data) {
                    assert.equal(queryTransform.callCount, 1, 'queryTransform should have been called once');
                    assert.isDefined(data, 'post response recieved');
                    assert.isDefined(data.length, 'post response is array');

                    var parent = data[0];
                    assert.equal(parent.Id, '1', 'post PK 1 should have been found');
                    assert.isDefined(parent[JSONAPIMETATAG].relationships['containedposts'], 'json api relationship for "containedposts", should exist');
                    assert.isDefined(parent[JSONAPIMETATAG].relationships['containedposts']['related'], 'json api relationship for "containedposts", should have related link');

                    var user = testData.config.userContainer.get(1);
                    assert.isDefined(user, 'Should get Container');
                    assert.equal(user.containedposts.length, 1, 'Should have one container.containedpost');
                    assert(user.containedposts[0].IsJsonApiReference, 'Should have post and be a JsonApi reference');


                    setTimeout(function () {
                        assert.equal(2, _this.requests.length, "Second Call");
                        var request = _this.requests[_this.requests.length - 1];

                        assert.equal(request.url, 'http://xxx/container/1/posts', 'Should request related link from "container"resource "containedposts", toMany relationship');
                        assert.equal(request.method, 'GET');

                        var postList = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                            .WithLink('self', '/container/1/posts')
                            .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                                .WithId('5')
                                .WithLink('self', '/container/1/posts/5')
                                .WithAttribute('author', 'John')
                                .WithAttribute('age', 30)
                            )
                            .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                                .WithId('10')
                                .WithLink('self', '/container/1/posts/10')
                                .WithAttribute('author', 'Mark')
                                .WithAttribute('age', 25)
                            );
                        request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(postList));
                    }, 30);


                    // I believe the line below and the subsequent call to Post.findAll are equivelent
                    // However the call below to "loadRelations" is more meaning full in terms of what we are trying to do.
                    // The problem is that js-data is being too smart, we want the parameters passed!! 
                    // e.g.The parent / parentId and the parent relation to load.
                    // However what ends up at the adapter is infomation about the children that would be returned
                    // which means we have to jump through hoops to try to get back this original innformation when 
                    // eventually findAll is called on the data adabter!!
                    // Please review, see  JsonApiAdapter.getPath code inside of if (method === 'findAll') where i am trying to get the 
                    // parent and the relationship info!!!!
                    return testData.config.userContainer.loadRelations(1, ['containedposts']).then(function (data) {
                        assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called twice');

                        var userContainer = testData.config.userContainer;
                        assert.isDefined(userContainer.get(1), 'Container 1 exists');
                        assert.isDefined(userContainer.get(1).containedposts, 'Posts  exist');
                        assert.isDefined(userContainer.get(1).containedposts[0], 'UserContainer 1 has at least 1 child post');
                        assert.isDefined(userContainer.get(1).containedposts[1], 'UserContainer 1 has 2 child posts 10');

                        assert.equal(userContainer.get(1).containedposts[0].Id, 5, 'UserContainer 1 has child post 5');
                        assert.equal(userContainer.get(1).containedposts[1].Id, 10, 'UserContainer 1 has child post 10');
                        assert.equal(userContainer.get(1).containedposts[0].IsJsonApiReference, false, 'Should have post 1 and NOT be a JsonApi reference');
                        assert.equal(userContainer.get(1).containedposts[1].IsJsonApiReference, false, 'Should have post 10 and NOT be a JsonApi reference');

                    });
                });
            });

            it('should make a GET request to load related "parent/belongsTo" relation data', function () {
                var _this = this;

                setTimeout(function () {
                    assert.equal(1, _this.requests.length, "First Call");
                    var request = _this.requests[_this.requests.length - 1];


                    assert.equal(request.url, 'http://xxx/container/1/containedposts');
                    assert.equal(request.method, 'GET');
                    assert.isDefined(request.requestHeaders);
                    assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');

                    var posts = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                        .WithLink('self', '/container/1/posts')
                        .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                            .WithId('5')
                            .WithLink('self', '/container/1/posts/5')
                            .WithAttribute('author', 'John')
                            .WithAttribute('age', 30)
                        );

                    request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(posts));
                }, 30);


                return testData.config.Post.findAll({ containerid: 1 }, { jsonApi: { jsonApiPath: '/container/1/containedposts' } }).then(function (data) {

                    setTimeout(function () {
                        assert.equal(2, _this.requests.length, "Second Call");
                        var request = _this.requests[_this.requests.length - 1];

                        assert.equal(request.url, 'http://xxx/container/1');
                        assert.equal(request.method, 'GET');
                        assert.isDefined(request.requestHeaders);
                        assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');

                        var container = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                            .WithSingleData(new DSJsonApiAdapter.JsonApi.JsonApiData('container')
                                .WithId('1')
                                .WithLink('self', '/container/1')
                                .WithRelationship('containedposts',
                                new DSJsonApiAdapter.JsonApi.JsonApiRelationship(true)
                                    .WithLink('related', 'http://xxx/container/1/posts')
                                    .WithData('posts', '5')
                                ));

                        request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(container));
                    }, 30);

                    return testData.config.Post.loadRelations(5, ['Container']).then(function (data) {

                    });
                });
            });
        });

        describe('(METHOD#2) findAll', function () {
            it('should make a GET request to load related data, using findAll', function () {
                var _this = this;

                setTimeout(function () {
                    assert.equal(1, _this.requests.length, "First Call");
                    var request = _this.requests[_this.requests.length - 1];

                    assert.equal(request.url, 'http://xxx/container/1');
                    assert.equal(request.method, 'GET');
                    assert.isDefined(request.requestHeaders, 'Headers Should be defined');
                    assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');


                    var container = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                        .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('container')
                            .WithId('1')
                            .WithLink('self', '/container/1')
                            .WithRelationship('containedposts',
                            new DSJsonApiAdapter.JsonApi.JsonApiRelationship(true)
                                .WithLink('related', 'http://xxx/container/1/posts')
                                .WithData('posts', '5')
                            ));
                    request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(container));
                }, 30);

                return testData.config.userContainer.find(1).then(function (data) {
                    assert.equal(queryTransform.callCount, 1, 'queryTransform should have been called once');
                    assert.isDefined(data, 'post response recieved');
                    assert.isDefined(data.length, 'post response is array');
                    assert.equal(data[0].Id, '1', 'post PK 1 should have been found');
                    assert.isDefined(data[0][JSONAPIMETATAG].relationships['containedposts'], 'json api relationship for "posts", should exist');


                    setTimeout(function () {
                        assert.equal(2, _this.requests.length, "Second Call");
                        var request = _this.requests[_this.requests.length - 1];

                        assert.equal(request.url, 'http://xxx/container/1/posts');
                        assert.equal(request.method, 'GET');

                        var postList = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                            .WithLink('self', '/container/1/posts')
                            .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                                .WithId('5')
                                .WithLink('self', '/container/1/posts/5')
                                .WithAttribute('author', 'John')
                                .WithAttribute('age', 30)
                            )
                            .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                                .WithId('10')
                                .WithLink('self', '/container/1/posts/10')
                                .WithAttribute('author', 'Mark')
                                .WithAttribute('age', 25)
                            );

                        request.respond(
                            200,
                            { 'Content-Type': 'application/vnd.api+json' },
                            DSUtils.toJson(postList)
                        );
                    }, 30);


                    var parent = data[0];
                    var link = parent[JSONAPIMETATAG].relationships['containedposts']['related'];
                    assert.equal(link.url, 'http://xxx/container/1/posts');

                    // This call has the same effect as the above to load related data
                    return testData.config.Post.findAll({ containerid: parent.Id }, { bypassCache: true, jsonApi: { jsonApiPath: link.url } }).then(function (data) {
                        assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called 2 times, find and findAll');

                        var userContainer = testData.config.userContainer;
                        assert.isDefined(userContainer.get(1), 'Container 1 exists');
                        assert.isDefined(userContainer.get(1).containedposts, 'Container 1, Posts exist');

                        assert.isDefined(userContainer.get(1).containedposts[0], 'UserContainer 1 has at least 1 child post');
                        assert.isDefined(userContainer.get(1).containedposts[1], 'UserContainer 1 has a 2nd child');
                        assert.equal(userContainer.get(1).containedposts.length, 2, 'UserContainer 1 has 2 child');

                        assert.equal(userContainer.get(1).containedposts[0].Id, 5, 'UserContainer 1 has child post 5');
                        assert.equal(userContainer.get(1).containedposts[1].Id, 10, 'UserContainer 1 has child post 10');
                    });
                });
            });
        });

        describe('(METHOD#3) findRelated', function () {
            it('should make a GET request to load related Post data, using findRelated ', function () {
                var _this = this;

                var container = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                    .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('container')
                        .WithId('1')
                        .WithLink('self', '/container/1')
                        .WithRelationship('containedposts',
                        new DSJsonApiAdapter.JsonApi.JsonApiRelationship(true)
                            .WithLink('related', 'http://xxx/container/1/posts')
                            .WithData('posts', '5')
                        ));

                setTimeout(function () {
                    assert.equal(1, _this.requests.length, "First Call");
                    var request = _this.requests[_this.requests.length - 1];

                    assert.equal(request.url, 'http://xxx/container/1');
                    assert.equal(request.method, 'GET');
                    assert.isDefined(request.requestHeaders);
                    assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');

                    request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(container));
                }, 30);

                return testData.config.userContainer.find(1).then(function (data) {
                    assert.equal(queryTransform.callCount, 1, 'queryTransform should have been called once');
                    assert.isDefined(data, 'post response recieved');
                    assert.isDefined(data.length, 'post response is array');
                    assert.equal(data[0].Id, '1', 'post PK 1 should have been found');

                    assert.isDefined(data[0][JSONAPIMETATAG].relationships['containedposts'], 'json api relationship for "posts", should exist');
                    var postList = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                        .WithLink('self', '/container/1/posts')
                        .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                            .WithId('5')
                            .WithLink('self', '/container/1/posts/5')
                            .WithAttribute('author', 'John')
                            .WithAttribute('age', 30)
                        )
                        .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                            .WithId('10')
                            .WithLink('self', '/container/1/posts/10')
                            .WithAttribute('author', 'Mark')
                            .WithAttribute('age', 25)
                        );

                    setTimeout(function () {
                        assert.equal(2, _this.requests.length, 'Second Call. loadRelations');
                        var request = _this.requests[_this.requests.length - 1];

                        assert.equal(request.url, 'http://xxx/container/1/posts');
                        assert.equal(request.method, 'GET');

                        request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(postList));
                    }, 30);

                    var parent = data[0];

                    var link = parent[JSONAPIMETATAG].relationships['containedposts']['related'];
                    assert.equal(link.url, 'http://xxx/container/1/posts')

                    // This call has the same effect as the above to load related data
                    return parent.findRelated('containedposts').then(function (data) {
                        assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called 2 times, find and loadrelations');

                        var userContainer = testData.config.userContainer;
                        assert.isDefined(userContainer.get(1), 'Container 1 exists');
                        assert.isDefined(userContainer.get(1).containedposts, 'Container 1, Posts exist');

                        assert.isDefined(userContainer.get(1).containedposts[0], 'UserContainer 1 has at least 1 child post');
                        assert.isDefined(userContainer.get(1).containedposts[1], 'UserContainer 1 has a 2nd child');
                        assert.equal(userContainer.get(1).containedposts.length, 2, 'UserContainer 1 has 2 child');

                        assert.equal(userContainer.get(1).containedposts[0].Id, 5, 'UserContainer 1 has child post 5');
                        assert.equal(userContainer.get(1).containedposts[1].Id, 10, 'UserContainer 1 has child post 10');
                    });
                });
            });
        });
    });

    describe('**WITHOUT** belongsTo', function () {
        var ds;
        var testData = { config: {} };

        beforeEach('set up relationship without "belongsTo" relation', function () {
            ds = new JSData.DS();
            var http = new DSHttpAdapter({});
            var dsHttpAdapter = new DSJsonApiAdapter.JsonApiAdapter({
                adapter: http,
                queryTransform: queryTransform,
                basePath: 'http://xxx/'
            });

            ds.registerAdapter('jsonApi', dsHttpAdapter, { default: true });
        });

        describe('(METHOD#1) loadRelations', function () {
           

            it('should make a GET request to load related "oneToMany" data', function () {
                var _this = this;

                testData.config.userContainer = ds.defineResource({
                    name: 'container',
                    idAttribute: 'Id',
                    relations: {
                        // hasMany uses "localField" and "localKeys" or "foreignKey"
                        hasMany: {
                            posts: {
                                localField: 'containedposts',
                                foreignKey: 'containerid'
                            }
                        }
                    }
                });
                testData.config.Post = ds.defineResource({
                    name: 'posts',
                    idAttribute: 'Id'
                });

                setTimeout(function () {
                    assert.equal(1, _this.requests.length, "First Call");
                    var request = _this.requests[_this.requests.length - 1];

                    assert.equal(request.url, 'http://xxx/container/1');
                    assert.equal(request.method, 'GET');
                    assert.isDefined(request.requestHeaders);
                    assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');

                    var container = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                        .WithSingleData(new DSJsonApiAdapter.JsonApi.JsonApiData('container')
                            .WithId('1')
                            .WithLink('self', '/container/1')
                            .WithRelationship('containedposts',
                            new DSJsonApiAdapter.JsonApi.JsonApiRelationship(true)
                                .WithLink('related', 'container/1/containedposts')
                                .WithData('posts', '5')
                            ));

                    request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(container));
                }, 30);

                // Load data
                return testData.config.userContainer.find(1).then(function (data) {
                    assert.equal(queryTransform.callCount, 1, 'queryTransform should have been called once');
                    assert.isDefined(data, 'container response recieved');
                    //assert.isDefined(data.length, 'post response is array');

                    var parent = data;
                    assert.equal(parent.Id, '1', 'post PK 1 should have been found');
                    assert.isDefined(parent[JSONAPIMETATAG].relationships['containedposts'], 'json api relationship for "containedposts", should exist');
                    assert.isDefined(parent[JSONAPIMETATAG].relationships['containedposts']['related'], 'json api relationship for "containedposts", should have related link');

                    var user = testData.config.userContainer.get(1);
                    assert.isDefined(user, 'Should get Container');
                    assert.equal(user.containedposts.length, 1, 'Should have one container.containedpost');
                    assert(user.containedposts[0].IsJsonApiReference, 'Should have post and be a JsonApi reference');


                    setTimeout(function () {
                        assert.equal(2, _this.requests.length, "Second Call");
                        var request = _this.requests[_this.requests.length - 1];

                        assert.equal(request.url, 'http://xxx/container/1/containedposts', 'Should request related link from "container"resource "containedposts", toMany relationship');
                        assert.equal(request.method, 'GET');

                        var postList = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                            .WithLink('self', '/container/1/containedposts')
                            .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                                .WithId('5')
                                .WithLink('self', '/container/1/containedposts/5')
                                .WithAttribute('author', 'John')
                                .WithAttribute('age', 30)
                            )
                            .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                                .WithId('10')
                                .WithLink('self', '/container/1/containedposts/10')
                                .WithAttribute('author', 'Mark')
                                .WithAttribute('age', 25)
                            );
                        request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(postList));
                    }, 30);


                    // I believe the line below and the subsequent call to Post.findAll are equivelent
                    // However the call below to "loadRelations" is more meaning full in terms of what we are trying to do.
                    // The problem is that js-data is being too smart, we want the parameters passed!! 
                    // e.g.The parent / parentId and the parent relation to load.
                    // However what ends up at the adapter is infomation about the children that would be returned
                    // which means we have to jump through hoops to try to get back this original innformation when 
                    // eventually findAll is called on the data adabter!!
                    // Please review, see  JsonApiAdapter.getPath code inside of if (method === 'findAll') where i am trying to get the 
                    // parent and the relationship info!!!!
                    return testData.config.userContainer.loadRelations(1, ['containedposts']).then(function (data) {
                        assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called twice');

                        var userContainer = testData.config.userContainer;
                        assert.isDefined(userContainer.get(1), 'Container 1 exists');
                        assert.isDefined(userContainer.get(1).containedposts, 'Posts  exist');
                        assert.isDefined(userContainer.get(1).containedposts[0], 'UserContainer 1 has at least 1 child post');
                        assert.isDefined(userContainer.get(1).containedposts[1], 'UserContainer 1 has 2 child posts 10');

                        assert.equal(userContainer.get(1).containedposts[0].Id, 5, 'UserContainer 1 has child post 5');
                        assert.equal(userContainer.get(1).containedposts[1].Id, 10, 'UserContainer 1 has child post 10');
                        assert.equal(userContainer.get(1).containedposts[0].IsJsonApiReference, false, 'Should have post 1 and NOT be a JsonApi reference');
                        assert.equal(userContainer.get(1).containedposts[1].IsJsonApiReference, false, 'Should have post 10 and NOT be a JsonApi reference');

                    });
                });
            });

            it('should make a GET request to load related "hasOne foreignKey" relation data', function () {
                var _this = this;

                testData.config.userContainer = ds.defineResource({
                    name: 'container',
                    idAttribute: 'Id',
                });


                testData.config.Post = ds.defineResource({
                    name: 'posts',
                    idAttribute: 'Id',
                    relations: {
                        hasOne: {
                            container: {
                                localField: 'mycontainer',
                                foreignKey : 'postid'
                            }
                        }
                    }

                });

                setTimeout(function () {
                    assert.equal(1, _this.requests.length, "First Call");
                    var request = _this.requests[_this.requests.length - 1];


                    assert.equal(request.url, 'http://xxx/posts/5');
                    assert.equal(request.method, 'GET');
                    assert.isDefined(request.requestHeaders);
                    assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');

                    var post = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                        .WithLink('self', '/posts/5')
                        .WithSingleData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                            .WithId('5')
                            .WithLink('self', '/posts/5')
                            .WithAttribute('author', 'John')
                            .WithAttribute('age', 30)
                            .WithRelationship('mycontainer',
                                new DSJsonApiAdapter.JsonApi.JsonApiRelationship(false)
                                    .WithLink('related', '/posts/5/mycontainer')
                            )
                        );

                    request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(post));
                }, 30);

                // Load post
                return testData.config.Post.find(5).then(function (data) {
                    assert.isUndefined(data.mycontainer, 'should NOT have populated container relationship');

                    setTimeout(function () {
                        assert.equal(2, _this.requests.length, "Second Call");
                        var request = _this.requests[_this.requests.length - 1];

                        assert.equal(request.url, 'http://xxx/posts/5/mycontainer');
                        assert.equal(request.method, 'GET');
                        assert.isDefined(request.requestHeaders);
                        assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');

                        var container = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                            .WithSingleData(new DSJsonApiAdapter.JsonApi.JsonApiData('container')
                                .WithId('1')
                                .WithLink('self', '/posts/5/mycontainer/1')
                                .WithAttribute('name', 'This is my container')
                                );

                        request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(container));
                    }, 30);

                    return testData.config.Post.loadRelations(5, ['mycontainer']).then(function (data) {
                        assert.isDefined(data.mycontainer, 'should populate container relationship');
                        assert.equal(data.mycontainer.IsJsonApiReference, false, 'should be full object');
                        assert.equal(data.mycontainer.name, 'This is my container', 'should have data');
                    });
                });
            });

            it('should make a GET request to load related "hasOne localKey" relation data', function () {
                var _this = this;

                testData.config.userContainer = ds.defineResource({
                    name: 'container',
                    idAttribute: 'Id',
                });


                testData.config.Post = ds.defineResource({
                    name: 'posts',
                    idAttribute: 'Id',
                    relations: {
                        hasOne: {
                            container: {
                                localField: 'container',
                                localKey: 'containerid',
                            }
                        }
                    }
                });

                setTimeout(function () {
                    assert.equal(1, _this.requests.length, "First Call");
                    var request = _this.requests[_this.requests.length - 1];


                    assert.equal(request.url, 'http://xxx/posts/5');
                    assert.equal(request.method, 'GET');
                    assert.isDefined(request.requestHeaders);
                    assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');

                    var posts = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                        .WithLink('self', '/posts/5')
                        .WithSingleData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                            .WithId('5')
                            .WithLink('self', '/posts/5')
                            .WithAttribute('author', 'John')
                            .WithAttribute('age', 30)
                            .WithRelationship('container',
                            new DSJsonApiAdapter.JsonApi.JsonApiRelationship(false)
                                .WithLink('related', '/posts/5/container')
                            )
                        );

                    request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(posts));
                }, 30);

                // Load post
                return testData.config.Post.find(5).then(function (data) {
                    assert.isUndefined(data.container, 'should NOT have populated container relationship');

                    setTimeout(function () {
                        assert.equal(2, _this.requests.length, "Second Call");
                        var request = _this.requests[_this.requests.length - 1];

                        assert.equal(request.url, 'http://xxx/posts/5/container');
                        assert.equal(request.method, 'GET');
                        assert.isDefined(request.requestHeaders);
                        assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');

                        var container = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                            .WithSingleData(new DSJsonApiAdapter.JsonApi.JsonApiData('container')
                                .WithId('1')
                                .WithLink('self', '/posts/5/container/1')
                                .WithAttribute('name', 'myContainer')
                            );

                        request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(container));
                    }, 30);

                    return testData.config.Post.loadRelations(5, ['container'], {}).then(function (data) {
                        assert.isDefined(data.container, 'should populate container relationship');
                        assert.equal(data.container.IsJsonApiReference, false, 'should be full object');
                        assert.equal(data.container.name, 'myContainer', 'should have data');
                    });
                });
            });
        });
    });
});