describe('DSJsonAdapter.find(resourceConfig, id, options)', function () {
    
    
    it('should make a GET request', function () {
        var _this = this;
        
        setTimeout(function () {
            assert.equal(1, _this.requests.length);
            assert.equal(_this.requests[0].url, 'api/posts/1');
            assert.equal(_this.requests[0].method, 'GET');
            assert.isDefined(_this.requests[0].requestHeaders);
            assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                       
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(p1.jsonApiData));
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
                                
                _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(p1.jsonApiData));
            }, 30);
            
            return dsHttpAdapter.find(Post, 1, { basePath: 'api2' });
        }).then(function (data) {
            // We are not testing meta data yet
            ignoreMetaData(data);

            assert.deepEqual(data, p1.model, 'post should have been found#2');
            assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called twice');
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
                        
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(p1.jsonApiData));
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
            
            
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(p1.jsonApiData));
        }, 30);
        
        return dsHttpAdapter.find(Post, 1).then(function (data) {
            // We are not testing meta data yet
            ignoreMetaData(data);
            assert.deepEqual(data, p1.model, 'post should have been found');
            
            delete dsHttpAdapter.defaults.httpConfig.params;
            delete dsHttpAdapter.defaults.httpConfig.headers;
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
    
    it('should use suffixes', function () {
        var _this = this;
        
        var Thing = datastore.defineResource({
            name: 'thing',
            endpoint: 'things',
            suffix: '.xml'
        });
        
        var otherAdapter = new DSHttpAdapter({
            suffix: '.json'
        });
        
        setTimeout(function () {
            assert.equal(1, _this.requests.length);
            assert.equal(_this.requests[0].url, 'things/1.xml');
            assert.equal(_this.requests[0].method, 'GET');
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify({ id: 1 }));
        }, 30);
        
        return dsHttpAdapter.find(Thing, 1).then(function () {
            
            setTimeout(function () {
                assert.equal(2, _this.requests.length);
                assert.equal(_this.requests[1].url, 'api/posts/1.json');
                assert.equal(_this.requests[1].method, 'GET');
                _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify({ id: 1 }));
            }, 30);
            
            return otherAdapter.find(Post, 1);
        });
    });


    // Json api specific tests
    it('should make a GET request and correctly deserialize returned included data', function () {
        var _this = this;

        setTimeout(function () {
            assert.equal(1, _this.requests.length);
            assert.equal(_this.requests[0].url, 'api/container/1');
            assert.equal(_this.requests[0].method, 'GET');
            assert.isDefined(_this.requests[0].requestHeaders);
            assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
            
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(DataWithRelation.jsonApiData));
        }, 30);
        

        return dsHttpAdapter.find(UserContainer, 1).then(function (data) {
            console.log("data(actual[0],expected[1]):", [data, DataWithRelation.model]);
            // We are not testing meta data yet
            ignoreMetaData(data);
            
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
            
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(DataWithRelation.jsonApiData));
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
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(DataWithRelation.jsonApiData));
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
                _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(DataWithRelation.jsonApiData));
            }, 30);
        
            return UserContainer.find(1, { urlPath: '/container/1', bypassCache:true }).then(function (data) {
                assert.equal(Post.get(5).age, 25, 'should find Posts reource 5 in datastore with age updated to 25');
                assert.equal(Post.get(5).country, 'New Zealand', 'should find Posts resource 5 in datastore with country still set to "New Zealand", as data expected to be mergedinto data store');
                assert.equal(Post.get(5).height, '1.7m', 'should find Posts reource 5 in datastore with new height 1.7m, newly added field');
            });
        });
    });
});