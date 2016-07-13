describe('DSJsonApiAdapter.create(resourceConfig, attrs, options)', function () {
    
    describe('Adapter CREATE', function () {
        var response = {};
        
        beforeEach(function () {
            response.model = [{ Id: '5', age: 32, author: 'John', type: 'person' }];
            response.jsonApiData = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
        .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
            .WithId('5')
            .WithAttribute('author', 'John')
            .WithAttribute('age', 32)
            .WithAttribute('type', 'person')
            //.WithLink('self', '/container/1/posts/5')
            );
        });
        
        it('should make a POST request, and NOT include id when not specified by client', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/posts');
                assert.equal(_this.requests[0].method, 'POST');
                assert.isDefined(_this.requests[0].requestHeaders, 'Request Contains headers');
                
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                
                var request = JSON.parse(_this.requests[0].requestBody);
                var expectedData = {
                    //id:'100', Do not set..
                    type: 'posts', 
                    attributes: { author: 'John', age: 32 }
                    //links: {}, 
                    //relationships: {}
                };
                
                assert.deepEqual(request.data, expectedData, 'Json data serialized to jsonApi data correctly, without client id');
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(response.jsonApiData));
            }, 30);
            
            return dsHttpAdapter.create(Post, { author: 'John', age: 32 }).then(function (data) {
                ignoreMetaData(data);
                assert.deepEqual(data[0], response.model[0], 'post should have been created when no id supplied by client');
            });
        });
        
        it('should make a POST request, and INCLUDE client id when specified by client', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/posts');
                assert.equal(_this.requests[0].method, 'POST');
                assert.isDefined(_this.requests[0].requestHeaders, 'Request Contains headers');
                
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[0].requestBody, DSUtils.toJson({
                    data: {
                        id: '5',
                        type: 'posts', 
                        attributes: { author: 'John', age: 32 }
                    //links: {}, 
                    //relationships: {}
                    }
                }), 'Json data serialized to jsonApi data correctly, with client id');
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(response.jsonApiData));
            }, 30);
            
            return dsHttpAdapter.create(Post, { Id: '5', author: 'John', age: 32 }).then(function (data) {
                ignoreMetaData(data);
                assert.deepEqual(data[0], response.model[0], 'post should have been created when no id supplied by client');
            });
        });
        
        it('should make a POST request, to create single object', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/posts');
                assert.equal(_this.requests[0].method, 'POST');
                assert.isDefined(_this.requests[0].requestHeaders, 'Request Contains headers');
                
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[0].requestBody, DSUtils.toJson({
                    data: {
                        //id: '', 
                        type: 'posts', 
                        attributes: { author: 'John', age: 32 }
                    //links: {}, 
                    //relationships: {}
                    }
                }), 'Json data serialized to jsonApi data correctly');
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(response.jsonApiData));
            }, 30);
            
            return dsHttpAdapter.create(Post, { author: 'John', age: 32 }).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);
                assert.deepEqual(data, response.model, 'post should have been created#1');
                
                setTimeout(function () {
                    assert.equal(2, _this.requests.length);
                    assert.equal(_this.requests[1].url, 'api2/posts');
                    assert.isDefined(_this.requests[1].requestHeaders);
                    assert.equal(_this.requests[1].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                    assert.include(_this.requests[1].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                    assert.equal(_this.requests[1].requestBody, DSUtils.toJson({
                        data: {
                            //id: '',
                            type: 'posts', 
                            attributes: { author: 'John', age: 32 }
                        //links: {}, 
                        //relationships: {}
                        }
                    }));
                    
                    _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(response.jsonApiData));
                }, 30);
                
                return dsHttpAdapter.create(Post, { author: 'John', age: 32 }, { basePath: 'api2' }).then(function (data) {
                    ignoreMetaData(data);
                    assert.deepEqual(data, response.model, 'post should have been created#2');
                    assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called twice');
                });
            });
        });
        
        it('should make a POST request, to create single object and NOT cache response', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/posts');
                assert.equal(_this.requests[0].method, 'POST');
                assert.isDefined(_this.requests[0].requestHeaders, 'Request Contains headers');
                
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[0].requestBody, DSUtils.toJson({
                    data: {
                        //id: '', 
                        type: 'posts', 
                        attributes: { author: 'John', age: 32 }
                    //links: {}, 
                    //relationships: {}
                    }
                }), 'Json data serialized to jsonApi data correctly');
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(response.jsonApiData));
            }, 30);
            
            return dsHttpAdapter.create(Post, { author: 'John', age: 32 }, { cacheResponse: false }).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);
                assert.deepEqual(data, response.model, 'post should have been created#1');

            });
        });
        
        it('should make a POST request, to create multiple data objects', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/posts');
                assert.equal(_this.requests[0].method, 'POST');
                assert.isDefined(_this.requests[0].requestHeaders, 'Request Contains headers');
                
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[0].requestBody, DSUtils.toJson({
                    data: {
                            //id: '', 
                            type: 'posts', 
                            attributes: { author: 'John', age: 32 }
                        //links: {}, 
                        //relationships: {}
                        }
                }), 'Json data serialized to jsonApi data correctly');
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(response.jsonApiData));
            }, 30);
            
            return dsHttpAdapter.create(Post, { author: 'John', age: 32 }).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);
                
                assert.deepEqual(response.model, data, 'post should have been created#1');
            })
        });
    });
    
    describe('DS Create', function () {});

});
