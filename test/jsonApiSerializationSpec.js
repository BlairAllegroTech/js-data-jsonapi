﻿describe('jsonAPI Serialization, ', function () {

    describe('Primay Keys', function () {
        var testData = {};

        beforeEach(function () {
            testData.jsonApiData = new DSJsonApiAdapter.JsonApi.JsonApiRequest();
            testData.jsonApiData.WithData(
                new DSJsonApiAdapter.JsonApi.JsonApiData('testuser')
                    .WithId('2')
                    .WithAttribute('author', 'John')
                    .WithAttribute('age', 31));

            testData.model = [{ Id: '2', author: 'John', age: 31 }]; //ISMODEL: true, type: 'testuser'
        });


        it('should use a default primary key of "id" when deserializing model, when not specifed in datastore configuration', function () {
            var _this = this;
            var TestUser = datastore.defineResource({
                name: 'testuser'
                //idAttribute: 'Id', intentionally not set 
            });



            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                assert.equal(request.url, 'api/testuser');
                assert.equal(request.method, 'POST');
                assert.isDefined(request.requestHeaders, 'Request Contains headers');
                assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(request.requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(request.requestBody, DSUtils.toJson({
                    data: {
                        //id: '', 
                        type: 'testuser',
                        attributes: { author: 'John', age: 31 }
                        //links: {}, 
                        //relationships: {}
                    }
                }), 'Json data serialized to jsonApi data correctly');

                request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(testData.jsonApiData));
            }, 30);

            return dsHttpAdapter.create(TestUser, { author: 'John', age: 31 }, { basePath: 'api' }).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);

                assert.equal(data.id, testData.model.id, 'post should have extracted primary key from response and placed in model property, id');
            });

        });

        it('should use a "Named" primary key when specifed in datastore configuration', function () {
            var _this = this;
            var TestUser = datastore.defineResource({
                name: 'testuser',
                idAttribute: 'TestPK'
            });


            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                assert.equal(request.url, 'api/testuser');
                assert.equal(request.method, 'POST');
                assert.isDefined(request.requestHeaders, 'Request Contains headers');
                assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(request.requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(request.requestBody, DSUtils.toJson({
                    data: {
                        //id: '', 
                        type: 'testuser',
                        attributes: { author: 'John', age: 32 }
                        //links: {}, 
                        //relationships: {}
                    }
                }), 'Json data serialized to jsonApi data correctly');


                request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(testData.jsonApiData));
            }, 30);

            return dsHttpAdapter.create(TestUser, { author: 'John', age: 32 }, { basePath: 'api' }).then(function (data) {
                assert.equal(data.TestPK, testData.model.id, 'post should have extracted primary key from response and placed in property "TestPK"');

            });

        });
    });

    describe('Parent Keys', function () {
        var ds, dsJsonApiAdapter;
        var test = { config: {} };

        beforeEach(function () {
            ds = new JSData.DS();

            dsJsonApiAdapter = new DSJsonApiAdapter.JsonApiAdapter({ queryTransform: queryTransform });
            ds.registerAdapter('jsonApi', dsJsonApiAdapter, { default: true });

            test.config.UserContainer = ds.defineResource({
                name: 'container',
                basePath: 'api',
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

            test.config.Post = ds.defineResource({
                name: 'posts',
                basePath: 'api',
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

        it('should extract and set ParentId from JsonApi self link and set js-data belongsTo relationship local key', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                assert.equal(request.url, 'api/posts');
                assert.equal(request.method, 'POST');
                assert.isDefined(request.requestHeaders, 'Request Contains headers');
                assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(request.requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');

                var expectedRequestData = {
                    data: {
                        //id: '',
                        type: 'posts',
                        attributes: { author: 'John', age: 31 }
                        //links: {},
                        //relationships: {}
                    }
                };

                assert.equal(request.requestBody, DSUtils.toJson(expectedRequestData), 'Json data serialized to jsonApi data correctly');
                // Newly created object should have a server generated id set
                // Include json api self link, as required by Jsonapi spec

                expectedRequestData.data.id = '2';
                expectedRequestData.data.links = { 'self': '/container/1/post/2' };

                request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(expectedRequestData));
            }, 30);

            return test.config.Post.create({ author: 'John', age: 31 }).then(function (data) {
                assert.isDefined(data, 'Should receive valid response');
                assert.isDefined(data.containerid, 'Should have LocalKey on child');
                assert.equal(data.containerid, 1, 'Should have set LocalKey to correct Parent Id');
            });
        });

        it('should extract and set ParentId from JsonApi self link and set js-data belongsTo relationship local key, when resource endpoint configured', function () {
            var _this = this;

            test.config.UserContainer.endpoint = 'container-endpoint';

            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                assert.equal(request.url, 'api/posts');
                assert.equal(request.method, 'POST');
                assert.isDefined(request.requestHeaders, 'Request Contains headers');
                assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(request.requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');

                var expectedRequestData = {
                    data: {
                        //id: '',
                        type: 'posts',
                        attributes: { author: 'John', age: 31 }
                        //links: {},
                        //relationships: {}
                    }
                };

                assert.equal(request.requestBody, DSUtils.toJson(expectedRequestData), 'Json data serialized to jsonApi data correctly');
                // Newly created object should have a server generated id set
                // Include json api self link, as required by Jsonapi spec

                expectedRequestData.data.id = '2';
                expectedRequestData.data.links = { 'self': '/container-endpoint/1/post/2' };

                request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(expectedRequestData));
            }, 30);

            return test.config.Post.create({ author: 'John', age: 31 }).then(function (data) {
                assert.isDefined(data, 'Should receive valid response');
                assert.isDefined(data.containerid, 'Should have LocalKey on child');
                assert.equal(data.containerid, 1, 'Should have set LocalKey to correct Parent Id');
            });
        });
    });

    describe('Error Response', function () {
        it('should deserialize Json ErrorResponse', function () {
            var _this = this;
            
            var error = new DSJsonApiAdapter.JsonApi.JsonApiError();
            error.id = 'xxx';
            error.status = 500;
            error.code = 501;
            error.title = 'TestError';
            error.detail = 'Test Error Detailed Message';

            //error.Source = {};
            var errorResponse = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
            .WithError(error);
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];
                request.respond(500, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(errorResponse));
            }, 30);
            
            return dsHttpAdapter.create(Post, { author: 'John', age: 30 })
                .then(
                function (data) {
                    assert(false, 'internal server error response should NOT have succeed');
                }, 
                function (error) {
                    console.log('Expected Error:', error);
                    assert.deepEqual(error, errorResponse, 'returned server error response');
                }
            );
            
        });
    });

    describe('Attributes Values', function () {

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

        it('should deserialize Json Data when attributes contain null values', function () {
            var _this = this;

            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];


                assert.equal(request.method, 'POST');
                assert.isDefined(request.requestHeaders, 'Request Contains headers');
                assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(request.requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(request.requestBody, DSUtils.toJson({
                    data: {
                        //id: '', 
                        type: 'author', 
                        attributes: { name: 'John', age: 32 }
                        //links: {}, 
                        //relationships: {}
                    }
                }), 'Json data serialized to jsonApi data correctly');

                var response = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                    .WithData(
                    new DSJsonApiAdapter.JsonApi.JsonApiData('author')
                        .WithId('2')
                        .WithAttribute('name', 'John')
                        .WithAttribute('age', 31)
                        .WithAttribute('NullValue', null)
                    );

                request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(response));
            }, 30);
            
            return dsHttpAdapter.create(testData.config.Author, { name: 'John', age: 32 }).then(function (data) {

                assert.isDefined(data, 'Data should be returned');
                assert.isDefined(data[0], 'Data should be returned in first index of array')

                assert.isDefined(data[0].NullValue, 'NullValue deserialised');
                assert.equal(data[0].NullValue, null, 'Null value set to null');
            });
        });

        it('sould not serialize js-data localKey or LocalKeys into attribute values', function () {
            var _this = this;
            var author = testData.config.Author.inject({ id: 1, name: 'Bob' });

            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];


                assert.equal(request.method, 'POST');
                assert.isDefined(request.requestHeaders, 'Request Contains headers');
                assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(request.requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');

                var req = JSON.parse(request.requestBody);
                assert.equal(req.data.attributes.title, 'js-data', 'normal attributes should be sent');
                assert.isUndefined(req.data.attributes.authorid, 'Article localKey "authorid" should not be serialized');

                // Simulate server saving and asigning an id
                req.data.id = 1;
                request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(req));
            }, 30);

            return testData.config.Article.create({ title: 'js-data', authorid: 1 });
        });
    });

    describe('Attribute Changes', function () {
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

        it('should serialize changes to Data correctly include; Updated, Added attributes and removed attributes with a value of null', function () {
            var _this = this;

            setTimeout(function () {

                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                assert.equal(request.url, 'author');
                assert.equal(request.method, 'POST');
                assert.isDefined(request.requestHeaders, 'Request Contains headers');

                assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(request.requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');

                var req = JSON.parse(request.requestBody);
                req.data.id = '3';

                request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(req));
            }, 30);


            // Save to adapter, so that ds resets change tracking
            return testData.config.Author.create({ name: 'John', age: 32, test: 'unchanged' }).then(function () {

                setTimeout(function () {

                    assert.equal(2, _this.requests.length, "Second Call");
                    var request = _this.requests[_this.requests.length - 1];

                    assert.equal(request.url, 'author/3');
                    assert.equal(request.method, 'PATCH');
                    assert.isDefined(request.requestHeaders, 'Request Contains headers');

                    assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                    assert.include(request.requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');


                    var req = JSON.parse(request.requestBody);
                    assert.equal(req.data.attributes.gender, 'M', 'Should add "gender" attribute');
                    assert.equal(req.data.attributes.name, 'Bob', 'Should update "author" attribute');
                    assert.equal(req.data.attributes.age, null, 'Should update "age" to null as removed');
                    assert.isUndefined(req.data.attributes.test, 'Should NOT update un chnaged "test" attribute');

                    request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, request.requestBody);
                }, 30);

                var author = testData.config.Author.get(3);
                author.gender = 'M';    //Add
                author.name = 'Bob';    // Update
                delete author.age;      //Delete

                // console.log('Author Changes', author.DSChanges());

                return testData.config.Author.save(3);
            });
        });
    });

    describe('To Many Relationships:', function () {
        var ds;
        var testData = { config: {} };
        
        beforeEach(function () {
            //Create js-data
            ds = new JSData.DS();
            
            // Configure js-data resources
            testData.config.Article = ds.defineResource({
                name: 'article',
                idAttribute: 'id',
                relations: {
                    
                    hasOne: {
                        author: {
                            localField: 'author',
                            foreignKey: 'articleid'
                        }
                    }
                }
            });
            
            testData.config.Author = ds.defineResource({
                name: 'author',
                idAttribute: 'id',
                relations: {
                    belongsTo: {
                        article: {
                            localField: 'article',
                            localKey: 'articleid'
                        }
                    }
                }
            });
            
            var author = { id: 1, name: 'Bob', articleid: 2 };
            var article = { id: 2, title: 'js-data' }; //, authorid: 1
            article.author = author;
            
            testData.config.Article.inject(article);
        });
        

        it('should deserialize empty to many relationships and js-data should update to remove previous existing relationship', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                assert.equal(request.url, 'api/author/1');
                assert.equal(request.method, 'PATCH');
                
                // NOTE the 
                var req = new DSJsonApiAdapter.JsonApi.JsonApiRequest();
                var articleToOneRelation = new DSJsonApiAdapter.JsonApi.JsonApiRelationship(true)
                    .WithLink('related', 'api/author/1/article');
                
                req.WithData(
                    new DSJsonApiAdapter.JsonApi.JsonApiData('author')
                        .WithId('1')
                        .WithRelationship("article", articleToOneRelation)
                );
                
                request.respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(req));
            }, 30);
            
            return dsHttpAdapter.update(testData.config.Author, '1', { id: '1', name: 'John' }, { basePath: 'api' }).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);
                
                assert.equal(data[0].id, 1, 'check id');
                
                // TODO : In the future we need to break any existing relationship within js-data
                assert.isUndefined(data[0].article, 'The empty relationship should exist');
            });  
        });
    });

    // see : http://jsonapi.org/format/#fetching-relationships
    describe('To One Relationships:', function () {
        var ds;
        var testData = { config: {} };

        beforeEach(function () {
            //Create js-data
            ds = new JSData.DS();
            var dsJsonApiAdapter = new DSJsonApiAdapter.JsonApiAdapter({
                queryTransform: queryTransform
            });
            ds.registerAdapter('jsonApi', dsJsonApiAdapter, { default: true });

            // Configure js-data resources
            testData.config.Article = ds.defineResource({
                name: 'article',
                idAttribute: 'id',
                relations: {

                    hasOne: {
                        author: {
                            localField: 'author',
                            foreignKey: 'articleid'
                        }
                    }
                }
            });
            
            testData.config.Author = ds.defineResource({
                name: 'author',
                idAttribute: 'id',
                relations: {
                    belongsTo: {
                        article: {
                            localField: 'article',
                            localKey: 'articleid'
                        }
                    }
                }
            });

            var article = { id: 1, title: 'js-data' };
            var author = { id: 2, name: 'Bob', articleid: 1 };
            article.author = author;
            
            testData.config.Article.inject(article);
        });

        it('should break js-data existing relationship, (desired behaviour)', function () {
            var article = testData.config.Article.get(1);
            var author = testData.config.Author.get(2);

            assert.isDefined(article, 'Article should be in DS');
            assert.isDefined(author, 'Author should be in DS');

            assert.equal(article.author, author, 'article.author same as author');
            assert.equal(author.article, article, 'author.article same as article');

            author.articleid = null;

            assert.isUndefined(article.author, 'article.author undefined');
            assert.isUndefined(author.article, 'author.article undefined');
        });

        it.skip('should deserialize empty(null) to one relationships and js-data should update to remove previous existing relationship (TODO Issue #10)', function () {
            var _this = this;

            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                assert.equal(request.url, 'article/1');
                assert.equal(request.method, 'PATCH');
                
                // NOTE here we are not returning any data in the relationship 
                var req = new DSJsonApiAdapter.JsonApi.JsonApiRequest();
                var articleToOneRelation = new DSJsonApiAdapter.JsonApi.JsonApiRelationship(false)
                    .WithLink('related', 'article/1/author')
                    // Explicitly return an empty relationship
                    //.WithData(null)
                    ;

                req.WithData(
                    new DSJsonApiAdapter.JsonApi.JsonApiData('article')
                        .WithId('1')
                        .WithRelationship("author", articleToOneRelation)
                );

                request.respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(req));
            }, 30);

            // Update author response will return null for 
            return testData.config.Article.update('1', {title: 'js-data V3'}).then(function (data) {

                assert.equal(data[0].id, 1, 'check id');

                // TODO : In the future we need to break any existing relationship within js-data
                assert.isUndefined(data[0].author, 'The empty relationship should not exist');

                var article = testData.config.Article(1);
                assert.isUndefined(article.author, 'Articles Author relationship should have been removed');
            });  

        });
    });

    describe('Meta Data:', function () {
        var ds;
        var test = { config: {} };
        
        beforeEach(function () {
            ds = new JSData.DS();

            var dsJsonApiAdapter = new DSJsonApiAdapter.JsonApiAdapter({
                queryTransform: queryTransform
            });
            ds.registerAdapter('jsonApi', dsJsonApiAdapter, { default: true });

            test.config.User = ds.defineResource({
                name: 'user',
                idAttribute: 'id'
            });
            
            test.jsonApiData = new DSJsonApiAdapter.JsonApi.JsonApiRequest();
            test.jsonApiData.WithData(
                new DSJsonApiAdapter.JsonApi.JsonApiData('user')
                    .WithId('2')
                    .WithAttribute('author', 'John')
                    .WithAttribute('age', 31));
            
            test.model = [{ Id: '2', author: 'John', age: 31 }]; //ISMODEL: true, type: 'testuser'
        });
        
        it('should not serialize meta data', function () {
            var _this = this;

            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                request.respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(test.jsonApiData));
            }, 30);
            
            return test.config.User.create({ author: 'John', age: 32 }).then(function (data) {
                var user = test.config.User.get(2);
                var meta = DSJsonApiAdapter.TryGetMetaData(user);
                assert.isDefined(user, 'user should be in the store');
                assert.isDefined(meta, 'user should have meta data in the store');

                setTimeout(function () {
                    assert.equal(2, _this.requests.length, 'should make second request');
                    var request = _this.requests[_this.requests.length - 1];
                    
                    var reqData = JSON.parse(request.requestBody);
                    assert.isUndefined(reqData.data.attributes['$_JSONAPIMETA_'], 'should not send meta data');

                    request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, request.requestBody);
                }, 30);

                user.name = 'bob';
                return test.config.User.save(user.id);
            });
        });
    });

    describe('Fallback behaviour when not JsonApi', function () {
        var ds;
        var test = { config: {} };

        beforeEach(function () {
            ds = new JSData.DS();
            var dsHttpAdapter = new DSHttpAdapter();
            var dsJsonApiAdapter = new DSJsonApiAdapter.JsonApiAdapter({
                queryTransform: queryTransform,
                adapter: dsHttpAdapter
            });
            
            ds.registerAdapter('jsonApi', dsJsonApiAdapter, { default: true }); 
            ds.registerAdapter('http', dsHttpAdapter, { default: false });
        });

        it('should fall back to Non-JsonApi serialization when no Json Api content type detected, "Content-Type:application/vnd.api + json"', function () {
            var _this = this;
            
            test.config.User = ds.defineResource({
                name: 'user',
                idAttribute: 'id',
                adapter: 'http'
            });

            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                assert.equal(request.url, 'user');
                assert.equal(request.method, 'POST');
                assert.isDefined(request.requestHeaders, 'Request Contains headers');
                assert.notEqual(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Should not contains json api accept required header');
                assert.notInclude(request.requestHeaders['Content-Type'], 'application/vnd.api+json', 'Should not ontains json api content-type header');
                
                var reqData = JSON.parse(request.requestBody);
                reqData.id = 1;

                request.respond(200, { 'Content-Type': 'application/json' }, DSUtils.toJson(reqData));
            }, 30);
            
            return test.config.User.create({ author: 'John', age: 32 }).then(function (data) {
                var user = test.config.User.get(1);
                var meta = DSJsonApiAdapter.TryGetMetaData(user);
                assert.isDefined(user, 'user deserialized and injected');
                assert.isUndefined(meta, 'should not have JsonApi meta data');
            });
        });

        it('should still use Json Api adapter when, "Content-Type:application/vnd.api + json"', function () {
            var _this = this;
            
            test.config.User = ds.defineResource({
                name: 'user',
                idAttribute: 'id',
            });
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                assert.equal(request.method, 'POST');
                assert.isDefined(request.requestHeaders, 'Request Contains headers');
                assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Should contains json api accept required header');
                assert.include(request.requestHeaders['Content-Type'], 'application/vnd.api+json', 'Should contains json api content-type header');
                
                var reqData = JSON.parse(request.requestBody);
                reqData.data.id = 1;
                
                request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(reqData));
            }, 30);
            
            return test.config.User.create({ author: 'John', age: 32 }).then(function (data) {
                var user = test.config.User.get(1);
                var meta = DSJsonApiAdapter.TryGetMetaData(user);
                assert.isDefined(user, 'user deserialized and injected');
                assert.isDefined(meta, 'should not have JsonApi meta data');
            });
        });
    });

    describe('Relationships Identified correctly when types contain mixed case and/or no standard java names', function () {
        var ds;
        var test = { config: {} };

        beforeEach(function () {
            ds = new JSData.DS();

            var dsJsonApiAdapter = new DSJsonApiAdapter.JsonApiAdapter({queryTransform: queryTransform});
            ds.registerAdapter('jsonApi', dsJsonApiAdapter, { default: true });

            test.config.CourseCategoryResource = datastore.defineResource({
                name: 'Course-Category',
                relations: {
                    hasMany: {
                        'Course-Competency': {
                            foreignKey: 'categoryId',
                            localField: 'competencies'
                        }
                    }
                }
            })

            test.config.CourseCompetencyResource = datastore.defineResource({
                name: 'Course-Competency',
                relations: {
                    belongsTo: {
                        'Course-Category': {
                            localField: 'category',
                            localKey: 'categoryId'
                            //parent: true
                        }
                    }
                }
            })
        });

        it('Should identify and load types that contain nonstandard java characters', function () {
            var _this = this;
            setTimeout(function () {
                assert.equal(1, _this.requests.length, "First Call");
                var request = _this.requests[_this.requests.length - 1];

                assert.equal(request.method, 'GET');
                assert.isDefined(request.requestHeaders, 'Request Contains headers');
                assert.equal(request.requestHeaders['Accept'], 'application/vnd.api+json', 'Should contains json api accept required header');

                var responseData = {
                    data: [
                        {
                            type: 'Course-Category',
                            id: '1',
                            attributes: {
                                title: 'Course Test',
                            },
                            relationships: {
                                competencies: {
                                    data: [
                                        { id:'10', type:'Course-Competency' },
                                        { id:'11', type:'Course-Competency' }
                                    ]
                                }
                            }
                        }
                    ],
                    included: [
                        { id:'10', type:'Course-Competency', attributes: { name:'Course-Competency10'} },
                        { id:'11', type:'Course-Competency', attributes: { name:'Course-Competency11' } }
                    ]
                }

                request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(responseData));
            }, 30);

            return test.config.CourseCategoryResource.findAll().then(function (categories) {
                assert.isDefined(categories, 'data deserialized');
                assert.equal(categories.length, 1, 'Should contain 1 "Course-Category"');
                assert.isDefined(categories[0].competencies, 'Should have "competencies" realtionship defined');
                assert.equal(categories[0].competencies.length, 2, 'Should have 2 child "competencies" ');

                assert.equal(test.config.CourseCategoryResource.class, 'CourseCategory', 'Js-Data removes non standard java characters in type names');
                assert.equal(test.config.CourseCategoryResource.endpoint, 'Course-Category', 'Js-Data uses endpoint when type contains non-java characters');

                categories[0].title = 'Course Test(Updated)';
                setTimeout(function () {
                    assert.equal(2, _this.requests.length, "Second Call");
                    var request = _this.requests[_this.requests.length - 1];

                    assert.equal(request.requestBody, DSUtils.toJson({
                        data: {
                            id: '1',
                            type: 'Course-Category',
                            attributes: { title: 'Course Test(Updated)' }
                        }
                    }), 'Non standard type name serialized correctly as json request');

                    // Just respond back with anything, initial request will do..
                    request.respond(200, { 'Content-Type': 'application/vnd.api+json' }, request.requestBody);
                }, 30);

                return test.config.CourseCategoryResource.save(categories[0].id);
            }).then(function () { });
        });


    });
});