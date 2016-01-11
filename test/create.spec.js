describe('DSJsonApiAdapter.create(resourceConfig, attrs, options)', function () {
    
    it('should make a POST request, simple data', function () {
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
                    id: '', 
                    type: 'posts', 
                    attributes: { author: 'John', age: 30 }, 
                    links: { }, 
                    relationships: {}
                }
            }), 'Json data serialized to jsonApi data correctly');
            
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(p1.jsonApiData) );
        }, 30);
        
        return dsHttpAdapter.create(Post, { author: 'John', age: 30 }).then(function (data) {
            assert.deepEqual(data, p1.model, 'post should have been created#1');
            
            setTimeout(function () {
                assert.equal(2, _this.requests.length);
                assert.equal(_this.requests[1].url, 'api2/posts');
                assert.isDefined(_this.requests[1].requestHeaders);
                assert.equal(_this.requests[1].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(_this.requests[1].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[1].requestBody, DSUtils.toJson({
                    data: {
                        id: '', 
                        type: 'posts', 
                        attributes: { author: 'John', age: 30 }, 
                        links: {}, 
                        relationships: {}
                    }
                }));

                _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(p1.jsonApiData));
            }, 30);
            
            return dsHttpAdapter.create(Post, { author: 'John', age: 30 }, { basePath: 'api2' });
        }).then(function (data) {
            assert.deepEqual(data, p1.model, 'post should have been created#2');
            assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called twice');
        });
    });
    
    it('should make a POST request, array of data', function () {
        var _this = this;
        
        setTimeout(function () {
            assert.equal(1, _this.requests.length);
            assert.equal(_this.requests[0].url, 'api/posts');
            assert.equal(_this.requests[0].method, 'POST');
            assert.isDefined(_this.requests[0].requestHeaders, 'Request Contains headers');
            
            assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
            assert.include(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
            assert.equal(_this.requests[0].requestBody, DSUtils.toJson({
                data: [{
                    id: '', 
                    type: 'posts', 
                    attributes: { author: 'John', age: 30 }, 
                    links: {}, 
                    relationships: {}
                }]
            }), 'Json data serialized to jsonApi data correctly');
            
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(p1.jsonApiData));
        }, 30);
        
        return dsHttpAdapter.create(Post, [{ author: 'John', age: 30 }]).then(function (data) {
            assert.deepEqual(data, p1.model, 'post should have been created#1');
        })
     });    
    
    
             
    it('should use a default primary key of "id" when not specifed in datastore configuration', function () {
        var _this = this;
        var TestUser = datastore.defineResource({
            name: 'testuser'
            //idAttribute: 'Id', intentionally not set 
        });
        
        var testData = {};
        testData.jsonApiData = new DSJsonApiAdapter.JsonApi.JsonApiRequest();
        testData.jsonApiData.WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('2', 'testduser')
            .WithAttribute('author', 'John')
            .WithAttribute('age', 30));
        testData.model = [{ id: '2', age: 30, author: 'John', }]; //ISMODEL: true, type: 'testuser'
        
        
        setTimeout(function () {
            assert.equal(1, _this.requests.length);
            assert.equal(_this.requests[0].url, 'api/testuser');
            assert.equal(_this.requests[0].method, 'POST');
            assert.isDefined(_this.requests[0].requestHeaders, 'Request Contains headers');
            assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
            assert.include(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
            assert.equal(_this.requests[0].requestBody, DSUtils.toJson({
                data: {
                    id: '', 
                    type: 'testuser', 
                    attributes: { author: 'John', age: 30 }, 
                    links: {}, 
                    relationships: {}
                }
            }), 'Json data serialized to jsonApi data correctly');
            
            
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(testData.jsonApiData));
        }, 30);
            
        return dsHttpAdapter.create(TestUser, { author: 'John', age: 30 }, { basePath: 'api' }).then(function (data) {
            assert.deepEqual(data.id, testData.model.id, 'post should have extracted primary key from response');
            assert.deepEqual(data, testData.model, 'post should have been created#3');
        });

    });
    
    it('should use a "Named" primary key when specifed in datastore configuration', function () {
        var _this = this;
        var TestUser = datastore.defineResource({
            name: 'testuser',
            idAttribute: 'TestPK'
        });
        
        var testData = {};
        testData.jsonApiData = new DSJsonApiAdapter.JsonApi.JsonApiRequest();
        testData.jsonApiData.WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('2', 'testduser')
            .WithAttribute('author', 'John')
            .WithAttribute('age', 30));
        testData.model = [{ TestPK: '2', age: 30, author: 'John', }]; //ISMODEL: true, type: 'testuser'
        
        
        setTimeout(function () {
            assert.equal(1, _this.requests.length);
            assert.equal(_this.requests[0].url, 'api/testuser');
            assert.equal(_this.requests[0].method, 'POST');
            assert.isDefined(_this.requests[0].requestHeaders, 'Request Contains headers');
            assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
            assert.include(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
            assert.equal(_this.requests[0].requestBody, DSUtils.toJson({
                data: {
                    id: '', 
                    type: 'testuser', 
                    attributes: { author: 'John', age: 30 }, 
                    links: {}, 
                    relationships: {}
                }
            }), 'Json data serialized to jsonApi data correctly');
            
            
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(testData.jsonApiData));
        }, 30);
        
        return dsHttpAdapter.create(TestUser, { author: 'John', age: 30 }, { basePath: 'api' }).then(function (data) {
            assert.deepEqual(data.TestPK, testData.model.TestPK, 'post should have extracted primary key from response');
            assert.deepEqual(data, testData.model, 'post should have been created#3');
        });

    });

    it('should extract and set ParentId from JsonApi self link and set jsdata belongsTo relationship local key', function () {
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
                    id: '', 
                    type: 'posts', 
                    attributes: { author: 'John', age: 30 }, 
                    links: {}, 
                    relationships: {}
                }
            }), 'Json data serialized to jsonApi data correctly');
            
            // New created object should have a server generated id set
            // Include json api self link, as required by Jsonapi spec
            p1.jsonApiData.data[0].id = '5';
            p1.jsonApiData.data[0].WithLink('self', '/container/1/post/5');
            p1.model[0].Id = '5';
            p1.model[0]['containerid'] = '1';
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(p1.jsonApiData));
        }, 30);
        
        return dsHttpAdapter.create(Post, { author: 'John', age: 30 }).then(function (data) {
            console.log('Should Equal:(data,expected)', [data, p1.model]);
            assert.deepEqual(data[0], p1.model[0], 'post should have been created with parent id set#1');
        });  
    });

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
            .WithError( error );

        setTimeout(function () {                   
            _this.requests[0].respond(500, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(errorResponse));
        }, 30);
        
        return dsHttpAdapter.create(Post, { author: 'John', age: 30 })
                .then(
                        function (data) {
                        assert(false, 'internal server error response should NOT have succeed');
                    }, 
                    function (error) {
                        console.error('Error:', error);
                        assert.deepEqual(error, errorResponse, 'returned server error response');
                    }
        );
            
    });

    //it('should return Json ErrorResponse when no response from server, timeout', function () {
    //    var _this = this;
        
    //    var error = new DSJsonApiAdapter.JsonApi.JsonApiError();
    //    error.id = 'xxx';
    //    error.status = 500;
    //    error.code = 501;
    //    error.title = 'TestError';
    //    error.detail = 'Test Error Detailed Message';
    //    //error.Source = {};
    //    var errorResponse = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
    //        .WithError(error);
        
    //    setTimeout(function () {
    //        _this.requests[0].respond();
    //    }, 30);
        
    //    return dsHttpAdapter.create(Post, { author: 'John', age: 30 })
    //            .then(
    //        function (data) {
    //            assert(false, 'internal server error response should NOT have succeed');
    //        }, 
    //                function (error) {
    //            console.error('Error:', error);
    //            assert.deepEqual(error, errorResponse, 'returned server error response');
    //        }
    //    );
            
    //});
});

