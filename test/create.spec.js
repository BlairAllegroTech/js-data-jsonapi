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
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(response.jsonApiData));
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
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(response.jsonApiData));
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
                    
                    _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(response.jsonApiData));
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
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(response.jsonApiData));
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
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(response.jsonApiData));
            }, 30);
            
            return dsHttpAdapter.create(Post, { author: 'John', age: 32 }).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);
                
                assert.deepEqual(response.model, data, 'post should have been created#1');
            })
        });
    });
    
    describe('DS Create', function () {
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
            testData.config.Author = ds.defineResource({
                name: 'author',
                idAttribute: 'id',
                relations: {
                    hasMany: {
                        article: {
                            localField: 'articles',
                            foreignKey: 'authorid'
                        }
                    }
                }
            });

            testData.config.Article = ds.defineResource({
                name: 'article',
                idAttribute: 'id',
                relations: {
                    hasOne: {
                        author: {
                            localField: 'author',
                            localKey: 'authorid'
                        }
                    }
                }
            });
        });


        it('Should make a POST request and send relationship data', function () {
            var _this = this;

            setTimeout(function () {

                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                assert.equal(request.url, 'author/3');
                assert.equal(request.method, 'PATCH');
                assert.isDefined(request.requestHeaders, 'Request Contains headers');

                assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(request.requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(request.requestBody, DSUtils.toJson({
                    data: {
                        id: '3', 
                        type: 'author',
                        attributes: { author: 'John', age: 32 },
                        relationships: {
                            articles: {
                                links: {},
                                data: [
                                    { id: '1', type: 'article' },
                                    { id: '2', type: 'article' }
                                ]
                            }
                        },
                       
                    }
                }), 'Json data serialized to jsonApi data correctly, with related data');

                request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, request.requestBody);
            }, 30);



            var article1 = ds.inject('article', { id: '1', name: 'author#1' });
            var article2 = ds.inject('article', { id: '2', name: 'author#2' });
            var author1 = ds.inject('author', { id:'3', author: 'John', age: 32 });


            article1.authorid = 3;
            article2.authorid = 3;

            console.log('Author Changes', author1.DSChanges());
            console.log('Article#1 Changes', article1.DSChanges());

            return testData.config.Author.save(3, {changes:false, jsonApi: { updateRelationships: true } }).then(function (data) {

            })
        });

    });

});
