
describe('Update Tests', function () {
    describe('DSJsonAdapter.update(resourceConfig, id, attrs, options)', function () {
        it('should make a PATCH request', function () {
            var _this = this;

            setTimeout(function () {
                assert.equal(1, _this.requests.length, 'Should be 1st request');
                assert.equal(_this.requests[0].url, 'api/posts/1');
                assert.equal(_this.requests[0].method, 'PATCH');
                assert.isDefined(_this.requests[0].requestHeaders);
                assert.include(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[0].requestBody,  DSUtils.toJson({
                    data: {
                        id: '1',
                        type: 'posts',
                        attributes: { author: 'John', age: 30 }
                    }
                }));


                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(p1.jsonApiData));
            }, 30);

            return dsHttpAdapter.update(Post, 1, { author: 'John', age: 30 }, {changes:false}).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);

                assert.deepEqual(data, p1.model, 'post 1 should have been updated#1');

                setTimeout(function () {
                    assert.equal(2, _this.requests.length, 'Should be 2nd request');
                    assert.equal(_this.requests[1].url, 'api2/posts/1');
                    assert.equal(_this.requests[1].method, 'PATCH');
                    assert.isDefined(_this.requests[1].requestHeaders);
                    assert.include(_this.requests[1].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                    assert.equal(_this.requests[1].requestBody, DSUtils.toJson({ data: { id: "1", type: 'posts', attributes: { author: 'John', age: 30 } } }));

                    _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(p1.jsonApiData));

                }, 30);

                return dsHttpAdapter.update(Post, 1, { author: 'John', age: 30 }, { basePath: 'api2', changes:false }).then(function (data) {
                    // We are not testing meta data yet
                    ignoreMetaData(data);

                    assert.deepEqual(data, p1.model, 'post 1 should have been updated#2');
                    assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called twice');
                });
            });
        });

        it('should make a PUT request', function () {
            var _this = this;

            setTimeout(function () {
                assert.equal(1, _this.requests.length, 'Should be 1st request');
                assert.equal(_this.requests[0].url, 'api/posts/1');
                assert.equal(_this.requests[0].method, 'PUT');
                assert.isDefined(_this.requests[0].requestHeaders);
                assert.include(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[0].requestBody, DSUtils.toJson(
                    { data: { id: '1', type: 'posts', attributes: { author: 'John', age: 30 } } })
                );


                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(p1.jsonApiData));
            }, 30);

            return dsHttpAdapter.update(Post, 1, { author: 'John', age: 30 }, { jsonApi: { usePATCH: false } }).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);

                assert.deepEqual(data, p1.model, 'post 1 should have been updated#1');

                setTimeout(function () {
                    assert.equal(2, _this.requests.length, 'Should be 2nd request');
                    assert.equal(_this.requests[1].url, 'api2/posts/1');
                    assert.equal(_this.requests[1].method, 'PATCH');
                    assert.isDefined(_this.requests[1].requestHeaders);
                    assert.include(_this.requests[1].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                    assert.equal(_this.requests[1].requestBody, DSUtils.toJson(
                        { data: { id: "1", type: 'posts', attributes: { author: 'John', age: 30 } } })
                    );

                    _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(p1.jsonApiData));

                }, 30);

                return dsHttpAdapter.update(Post, 1, { author: 'John', age: 30 }, { basePath: 'api2', changes:false }).then(function (data) {
                    // We are not testing meta data yet
                    ignoreMetaData(data);

                    assert.deepEqual(data, p1.model, 'post 1 should have been updated#2');
                    assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called twice');
                });
            });
        });

        it('should handle server 204 NoContent reponse correctly when PUT (update) data is stored with out any changes on the server. So servers may chose to return no content', function () {
            var _this = this;

            setTimeout(function () {
                assert.equal(1, _this.requests.length, 'Should be first request');
                assert.equal(_this.requests[0].url, 'api/posts/1');
                assert.equal(_this.requests[0].method, 'PUT');
                assert.isDefined(_this.requests[0].requestHeaders);
                assert.include(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[0].requestBody,  DSUtils.toJson({ data: { id: "1", type: 'posts', attributes: { author: 'John', age: 30, type: 'person' } } }));

                p1.model.Id = '1';
                _this.requests[0].respond(204);//{ 'Content-Type': 'application/vnd.api+json' }
            }, 30);

            return dsHttpAdapter.update(Post, 1, { author: 'John', age: 30, type: 'person' }, {jsonApi: {usePATCH:false}}).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);

                assert.deepEqual(data, p1.model, 'post 1 should have been updated and data returned to datastore even though server returned no content');
            });
        });

        it('should handle server 204 NoContent reponse correctly when PATCH (update) data is stored with out any changes on the server. So servers may chose to return no content', function () {
            var _this = this;

            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/posts/1');
                assert.equal(_this.requests[0].method, 'PATCH');
                assert.isDefined(_this.requests[0].requestHeaders);
                assert.include(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[0].requestBody,  DSUtils.toJson({ data: { id: "1", type: 'posts', attributes: { author: 'John', age: 30, type: 'person' } } }));

                p1.model.Id = '1';
                _this.requests[0].respond(204);//{ 'Content-Type': 'application/vnd.api+json' }
            }, 30);

            return dsHttpAdapter.update(Post, 1, { author: 'John', age: 30, type: 'person' }, {changes:false}).then(function (data) {
                // We are not testing meta data yet
                ignoreMetaData(data);

                assert.deepEqual(data, p1.model, 'post 1 should have been updated and data returned to datastore even though server returned no content');
            });
        });


        it('should fail update when supplied id and object primary key differ', function () {

            assert.throw(
                function () { dsHttpAdapter.update(Post, 1, { Id: 2, author: 'John', age: 30 }); },
            Error
            );
        });
    });

    describe('DS#Save', function () {
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

        it('should save data to adapter, WITHOUT relationships', function () {
            var _this = this;

            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'author');
                assert.equal(_this.requests[0].method, 'GET');

                var response = { data: [{ id: '1', type: 'author', attributes: { name: 'Bob', age: 30 } }] };
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(response));
            }, 30);

            return testData.config.Author.findAll().then(function (data) {
                setTimeout(function () {
                    assert.equal(2, _this.requests.length);
                    assert.equal(_this.requests[1].url, 'author/1');
                    assert.equal(_this.requests[1].method, 'PATCH');

                    _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' }, _this.requests[1].requestBody);
                }, 30);


                var author = testData.config.Author.get(1);
                assert.isDefined(author, 'Author should be in DS');
                author.name = 'New Author';
                return ds.save('author', author.id).then(function (data) {
                    assert.isDefined(data, 'Result Sould exists');
                    assert.equal(data.name, 'New Author');
                });
            });
        });

        it('should save data to adapter, WITH relationships', function () {
            var _this = this;
            var response = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                .WithData(
                new DSJsonApiAdapter.JsonApi.JsonApiData('author')
                        .WithId('1')
                        .WithAttribute('name', 'Bob')
                        .WithAttribute('age', 30)
                        .WithLink('self', 'api/author/1')
                        .WithRelationship('articles',
                            new DSJsonApiAdapter.JsonApi.JsonApiRelationship(false)
                                .WithLink('related', 'api/author/1/articles')
                                .WithData('article', '1')
                )
            )
                .WithIncluded(
                new DSJsonApiAdapter.JsonApi.JsonApiData('article')
                        .WithId('1')
                        .WithAttribute('name', 'my book')
                        .WithLink('self', 'api/article/1')
            );

            setTimeout(function () {
                var index = _this.requests.length-1;
                assert.equal(index+1, _this.requests.length);
                assert.equal(_this.requests[index].url, 'author');
                assert.equal(_this.requests[index].method, 'GET');

                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(response));
            }, 30);

            return testData.config.Author.findAll().then(function (data) {

                setTimeout(function () {
                    var index = _this.requests.length - 1;
                    assert.equal(2, _this.requests.length);
                    assert.equal(_this.requests[index].url, 'api/author/1');
                    assert.equal(_this.requests[index].method, 'PATCH');

                    var request = DSUtils.fromJson(_this.requests[1].requestBody);
                    assert.isDefined(request.data.relationships, 'Relationships should be defined');
                    assert.isDefined(request.data.relationships.articles, 'Relationships data should contain "articel"');
                    assert.deepEqual(request.data.relationships.articles.data, [{id:'1', type:'article'}],  'Relationships should have been sent');

                    _this.requests[index].respond(200, { 'Content-Type': 'application/vnd.api+json' }, _this.requests[index].requestBody);
                }, 30);


                var author = testData.config.Author.get(1);
                assert.isDefined(author, 'Author should be in DS');
                author.name = 'New Author';
                return ds.save('author', author.id, {changes:false, jsonApi: { updateRelationships: true }}).then(function (data) {
                    assert.isDefined(data, 'Result Should exists');
                    assert.equal(data.name, 'New Author');

                    setTimeout(function () {
                        var index = _this.requests.length - 1;
                        assert.equal(3, _this.requests.length);
                        assert.equal(_this.requests[index].url, 'author/1'); //This reverted backto default as we didn't supply a self link in the response
                        assert.equal(_this.requests[index].method, 'PATCH');

                        var request = DSUtils.fromJson(_this.requests[index].requestBody);
                        assert.isUndefined(request.data.relationships, 'Relationships should NOT defined');

                        _this.requests[index].respond(200, { 'Content-Type': 'application/vnd.api+json' }, _this.requests[1].requestBody);
                    }, 30);

                    return ds.save('author', author.id, { jsonApi: { updateRelationships: false } });
                });
            });
        });
    });

    describe('DS#updateAll (Create Multiple)', function () {
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
        });

        it('should make a POST request with an array', function () {
            // Support for http://jsonapi-rc3.herokuapp.com/extensions/bulk/#creating-multiple-resources
            // In js-data there is currently no method "create" which allows to make multiple
            // objects. For this purpose it is suggested to use the operation "updateAll" and
            // force the POST method.
            var _this = this;

            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'author');
                assert.equal(_this.requests[0].method, 'POST');
                assert.isDefined(_this.requests[0].requestHeaders);

                var response = { data: [
                    { type: 'author', attributes: { name: 'Rob', age: 36 } },
                    { type: 'author', attributes: { name: 'Bob', age: 63 } }]
                };
                assert.equal(_this.requests[0].requestBody,  DSUtils.toJson(response));

                response.data[0].id = '10';
                response.data[1].id = '11';

                _this.requests[0].respond(201, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(response));
            }, 30);

            return ds.updateAll('author', [{ name: 'Rob', age: 36 }, { name: 'Bob', age: 63 }], {}, {method:'POST', jsonApi: { usePATCH : false} }).then(function (data) {
                assert.isDefined(data, 'Result Should exist');
                assert.isArray(data, 'Result should be a list');
                assert.equal(data[0].name, 'Rob');
                assert.equal(data[1].name, 'Bob');

                var rob_author = testData.config.Author.get(10);
                assert.isDefined(rob_author, 'Author Rob should be in DS');
                assert.equal(rob_author.name, data[0].name);

                var bob_author = testData.config.Author.get(11);
                assert.isDefined(bob_author, 'Author Bob should be in DS');
                assert.equal(bob_author.name, data[1].name);
            });

        });

        it('should make a PATCH an empty array', function () {
            var _this = this;

            setTimeout(function () {
                assert.equal(1, _this.requests.length, 'requests length');
                assert.equal(_this.requests[0].url, 'author');
                assert.equal(_this.requests[0].method, 'PATCH');
                assert.isDefined(_this.requests[0].requestHeaders);

                var request = JSON.parse(_this.requests[0].requestBody);
                assert.isArray(request.data, 'request data should be a list');
                assert.lengthOf(request.data, 0);

                _this.requests[0].respond(201, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(request));
            }, 30);

            return ds.updateAll('author', []).then(function (data) {
                assert.isDefined(data, 'Result Should exist');
                assert.isArray(data, 'Result should be a list');
                assert.lengthOf(data, 0);
            });

        });
    });
});
