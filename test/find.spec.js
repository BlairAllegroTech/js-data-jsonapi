
describe('find', function () {
    describe('DSJsonAdapter.find(resourceConfig, id, options)', function () {
        
        it('should make a GET request', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/posts/1');
                assert.equal(_this.requests[0].method, 'GET');
                assert.isDefined(_this.requests[0].requestHeaders);
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(p1.jsonApiData));
            }, 30);
            
            
            return dsHttpAdapter.find(Post, 1).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);
                assert.deepEqual(data, p1.model, 'post should have been found#1');
                
                setTimeout(function () {
                    assert.equal(2, _this.requests.length);
                    assert.equal(_this.requests[1].url, 'api2/posts/1');
                    assert.equal(_this.requests[1].method, 'GET');
                    //assert.isDefined(_this.requests[1].requestHeaders);
                    //assert.include(_this.requests[1].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                    
                    _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(p1.jsonApiData));
                }, 30);
                
                return dsHttpAdapter.find(Post, 1, { basePath: 'api2' }).then(function (data) {
                    // We are not testing meta data yet
                    ignoreMetaData(data);
                    
                    assert.deepEqual(data, p1.model, 'post should have been found#2');
                    assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called twice');
                });
            });
        });
        
        it('should allow overriding urlPath', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/foo/bar/beep/boop/1');
                assert.equal(_this.requests[0].method, 'GET');
                //assert.isDefined(_this.requests[0].requestHeaders);
                //assert.include(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(p1.jsonApiData));
            }, 30);
            
            return Post.find(1, { urlPath: '/foo/bar/beep/boop/1' }).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);
                
                assert.equal(data.Id, p1.model.Id, 'post should have been found#3');
                assert.equal(queryTransform.callCount, 1, 'queryTransform should have been called twice');
            });
        });
        
        it('should use default configs', function () {
            var _this = this;
            
            dsHttpAdapter.adapter.defaults.httpConfig.params = { test: 'test' };
            dsHttpAdapter.adapter.defaults.httpConfig.headers = { Authorization: 'test' };
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/posts/1?test=test');
                assert.equal(_this.requests[0].method, 'GET');
                assert.deepEqual({
                    Authorization: 'test',
                    Accept: 'application/vnd.api+json'
                }, _this.requests[0].requestHeaders);
                
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(p1.jsonApiData));
            }, 30);
            
            return dsHttpAdapter.find(Post, 1).then(function (data) {
                
                delete dsHttpAdapter.defaults.httpConfig.params;
                delete dsHttpAdapter.defaults.httpConfig.headers;
                
                // We are not testing meta data yet
                ignoreMetaData(data);
                assert.deepEqual(data, p1.model, 'post should have been found');

            });
        });
        
        it('should log errors', function () {
            var _this = this;
            var loggedError;
            
            dsHttpAdapter.defaults.error = function (err) {
                loggedError = err;
            };
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/posts/1');
                assert.equal(_this.requests[0].method, 'GET');
                _this.requests[0].respond(404, { 'Content-Type': 'text/plain' }, 'Not Found');
            }, 30);
            
            return dsHttpAdapter.find(Post, 1).then(function () {
                throw new Error('Should not have succeeded!');
            }, function () {
                console.log(loggedError);
                assert.isString(loggedError);
                assert.isTrue(loggedError.indexOf('api/posts/1') !== -1, loggedError);
            });
        });
        
        // What was i thinking, this test looks crap?
        //it('should use suffixes', function () {
        //    var _this = this;
            
        //    var Thing = datastore.defineResource({
        //        name: 'thing',
        //        endpoint: 'things',
        //        suffix: '.xml'
        //    });
            
        //    var otherAdapter = new DSHttpAdapter({
        //        suffix: '.json'
        //    });
            
        //    setTimeout(function () {
        //        assert.equal(1, _this.requests.length);
        //        assert.equal(_this.requests[0].url, 'things/1.xml');
        //        assert.equal(_this.requests[0].method, 'GET');
        //        _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson({ id: 1 }));
        //    }, 30);
            
        //    return dsHttpAdapter.find(Thing, 1).then(function () {
                
        //        setTimeout(function () {
        //            assert.equal(2, _this.requests.length);
        //            assert.equal(_this.requests[1].url, 'api/posts/1.json');
        //            assert.equal(_this.requests[1].method, 'GET');
        //            _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson({ id: 1 }));
        //        }, 30);
                
        //        return otherAdapter.find(Post, 1);
        //    });
        //});
        
        
        // Json api specific tests
        it('should make a GET request and correctly deserialize returned included data', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/container/1');
                assert.equal(_this.requests[0].method, 'GET');
                assert.isDefined(_this.requests[0].requestHeaders);
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');

                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(DataWithRelation.jsonApiData));
            }, 30);
            
            
            return dsHttpAdapter.find(UserContainer, 1).then(function (data) {
                console.log("data(actual[0],expected[1]):", [data, DataWithRelation.model]);
                // We are not testing meta data yet
                ignoreMetaData(data);
                ignoreMetaData(data.containedposts[0]);
                assert.deepEqual(data, DataWithRelation.model, 'container should have been found with included data');
            });
        });
        
        it('should make a GET request and correctly process and inject returned included data', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/container/1');
                assert.equal(_this.requests[0].method, 'GET');
                assert.isDefined(_this.requests[0].requestHeaders);
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(DataWithRelation.jsonApiData));
            }, 30);
            
            return UserContainer.find(1, { urlPath: '/container/1' }).then(function (data) {
                assert(UserContainer.get(1), 'should find UserContainer reource 1 in datastore');
                assert(Post.get(5), 'should find Posts reource 5 in datastore');
                
                assert.equal(UserContainer.get(1).containedposts[0], Post.get(5), 'usercontainer first contained post should be post 5');
                assert.equal(Post.get(5).Container, UserContainer.get(1), 'usercontainer first contained post should be post 5');
            });

        });
        
        it('should update data store when data is updated on the server after making a GET request', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/container/1');
                assert.equal(_this.requests[0].method, 'GET');
                assert.isDefined(_this.requests[0].requestHeaders);
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                
                DataWithRelation.jsonApiData.included[0].attributes.country = 'New Zealand';
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(DataWithRelation.jsonApiData));
            }, 30);
            
            return UserContainer.find(1, { urlPath: '/container/1' }).then(function (data) {
                assert.equal(Post.get(5).age, 30, 'should find Posts resource 5 in datastore with age 30');
                assert.equal(Post.get(5).country, 'New Zealand', 'should find Posts resource 5 in datastore with country "New Zealand"');
                
                setTimeout(function () {
                    assert.equal(2, _this.requests.length);
                    assert.equal(_this.requests[1].url, 'api/container/1');
                    assert.equal(_this.requests[1].method, 'GET');
                    assert.isDefined(_this.requests[0].requestHeaders);
                    assert.equal(_this.requests[1].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                    
                    // We want to test that data is merged into the data store not replaced!!
                    delete DataWithRelation.jsonApiData.included[0].attributes.country;
                    DataWithRelation.jsonApiData.included[0].attributes.age = 25;
                    DataWithRelation.jsonApiData.included[0].attributes.height = '1.7m';
                    _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(DataWithRelation.jsonApiData));
                }, 30);
                
                return UserContainer.find(1, { urlPath: '/container/1', bypassCache: true }).then(function (data) {
                    assert.equal(Post.get(5).age, 25, 'should find Posts reource 5 in datastore with age updated to 25');
                    assert.equal(Post.get(5).country, 'New Zealand', 'should find Posts resource 5 in datastore with country still set to "New Zealand", as data expected to be mergedinto data store');
                    assert.equal(Post.get(5).height, '1.7m', 'should find Posts reource 5 in datastore with new height 1.7m, newly added field');
                });
            });
        });
        
        it('should make a GET request and correctly store JsonApi Request links in meta data', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/container/1');
                assert.equal(_this.requests[0].method, 'GET');
                assert.isDefined(_this.requests[0].requestHeaders);
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                
                var request = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
            .WithData(
                    new DSJsonApiAdapter.JsonApi.JsonApiData('container')
                    .WithId('1')
                    .WithLink('self', 'api/container/1')
                    .WithLink('login', 'api/token')
                    .WithRelationship('containedposts', 
                        new DSJsonApiAdapter.JsonApi.JsonApiRelationship(true)
                            .WithData('posts', '5')
                    )
                );
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(request));
            }, 30);
            
            return UserContainer.find(1).then(function (data) {
                var container = UserContainer.get(1);
                var meta = DSJsonApiAdapter.TryGetMetaData(container);
                
                assert.isDefined(meta, 'Should have meta data');
                assert.isDefined(container, 'should find UserContainer reource 1 in datastore');
                
                assert.isFalse(container.IsJsonApiReference, 'Should be full object');
                assert.isDefined(meta.links.login, 'should have LOGIN link');
            });

        });
        
        
        describe('Null Result Handling', function () {
            var ds;
            var test = { config: {} };
            
            beforeEach(function () {
                //Create js-data
                ds = new JSData.DS();
                var dsHttpAdapter = new DSJsonApiAdapter.JsonApiAdapter({
                    queryTransform: queryTransform
                });
                ds.registerAdapter('jsonApi', dsHttpAdapter, { default: true });
                
                // Configure js-data resources
                test.config.Article = ds.defineResource({
                    name: 'article',
                    idAttribute: 'id',
                    relations: {
                        
                        hasOne: {
                            author: {
                                localField: 'myauthor',
                                localKey: 'authorid'
                            }
                        }
                    }
                });
                
                test.config.Author = ds.defineResource({
                    name: 'author',
                    idAttribute: 'id',
                });
            
            //var author = { id: 1, name: 'Bob', articleid: 2 };
            //var article = { id: 2, title: 'js-data' }; //, authorid: 1
            //article.author = author;
            });
            
            it('should break relationshiplink when GET request returns a NULL in respose to a request for a "toOne" related object', function () {
                var _this = this;
                
                setTimeout(function () {
                    var index = _this.requests.length - 1;
                    assert.equal(1, _this.requests.length);
                    //assert.equal(_this.requests[index].url, 'api/article/1');
                    assert.equal(_this.requests[index].method, 'POST');
                    assert.isDefined(_this.requests[index].requestHeaders);
                    assert.equal(_this.requests[index].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                    
                    var request = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                .WithData(
                        new DSJsonApiAdapter.JsonApi.JsonApiData('article')
                        .WithId('1')
                        .WithAttribute('name', 'test article')
                        .WithLink('self', 'api/article/1')
                        .WithRelationship('myauthor',
                            new DSJsonApiAdapter.JsonApi.JsonApiRelationship(false)
                                .WithLink('related', 'api/article/1/author')
                                .WithData('author', '1')
                        )
                    )
                .WithIncluded(
                        new DSJsonApiAdapter.JsonApi.JsonApiData('author')
                        .WithId('1')
                        .WithAttribute('name', 'bob')
                        .WithLink('self', 'api/author/1')
                    //    .WithRelationship('article', 
                    //        new DSJsonApiAdapter.JsonApi.JsonApiRelationship(false)
                    //            .WithLink('related', 'api/author/1/article')
                    //            .WithData('article', '1')
                    //)   
                    );
                    
                    var responseString =  DSUtils.toJson(request);
                    _this.requests[index].respond(200, { 'Content-Type': 'application/vnd.api+json' }, responseString);
                }, 30);
                
                //test.config.Article.inject(article);
                return test.config.Article.create({ name: 'my book' }).then(function () {
                    var article = test.config.Article.get(1);
                    assert.isDefined(article, 'Author should be injected');
                    assert.isDefined(article.myauthor, 'Author should have related Article');
                    
                    setTimeout(function () {
                        var index = _this.requests.length - 1;
                        assert.equal(2, _this.requests.length);
                        assert.equal(_this.requests[index].url, 'api/article/1/author');
                        assert.equal(_this.requests[index].method, 'GET');
                        assert.isDefined(_this.requests[index].requestHeaders);
                        assert.equal(_this.requests[index].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                        
                        var request = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                        .WithLink('self', 'api/article/1/relationships/author')
                        .WithLink('related', 'api/article/1/author');
                        request.data = [];
                        //.WithData(null);
                        
                        var responseString =  DSUtils.toJson(request);
                        _this.requests[index].respond(200, { 'Content-Type': 'application/vnd.api+json' }, responseString);
                    }, 30);
                    
                    return article.findRelated('myauthor', { bypassCache: true }).then(function (data) {
                        //return test.config.Article.loadRelations(1, ['myauthor'], { bypassCache: true }).then(function (data) {
                        
                        var article = test.config.Article.get(1);
                        var author = test.config.Author.get(1);
                        
                        var meta = DSJsonApiAdapter.TryGetMetaData(author);
                        assert.isDefined(meta, 'Should have meta data');
                        
                        assert.isDefined(article, 'should find Article 1');
                        assert.isDefined(author, 'should still find Author in store');
                    
                    // TODO Relates to #10
                    //assert.isUndefined(article.myauthor, 'article link should have been removed / un linked');
                    });
 

                }); //end: it
            });
      
        });
    
    });
    
    describe('DS#find', function () {
        
        var ds;
        var testData = { config: {} };
        
        beforeEach(function () {
            //Create js-data
            ds = new JSData.DS();
            var dsHttpAdapter = new DSJsonApiAdapter.JsonApiAdapter({
                queryTransform: queryTransform
            });
            
            ds.registerAdapter('jsonApi', dsHttpAdapter, { default: true });
            
            // Configure js-data resources
            testData.config.Article = ds.defineResource({
                name: 'article',
                idAttribute: 'id',
            });
        });
        
        it('should find data using adapter and CACHE', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                
                assert.equal(_this.requests[0].method, 'GET');
                
                var response = { data: { id: '1', type: 'article', attributes: { name: 'My Book' } } };
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(response));
            }, 30);
            
            return testData.config.Article.find('1', { cacheResponse: true }).then(function (data) {
                var article = testData.config.Article.get(1);
                assert.isDefined(article, 'Article should have been stored to DS');
                
                assert.isDefined(data, 'Should receive response');
                assert(!DSUtils.isArray(data), 'Data should be a single instance');
            });
        });

        it('should find data using adapter and NOT CACHE', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);

                assert.equal(_this.requests[0].method, 'GET');
                
                var response = { data: { id: '1', type: 'article', attributes: { name: 'My Book' } } };
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(response));
            }, 30);
            
            return testData.config.Article.find('1', { cacheResponse: false}).then(function (data) {
                var article = testData.config.Article.get(1);
                assert.isUndefined(article, 'Article should not have been stored to DS');
                
                assert.isDefined(data, 'Should receive response');
                assert(!DSUtils.isArray(data), 'Data should be a single instance');
                
            });
        });
        
    });
});