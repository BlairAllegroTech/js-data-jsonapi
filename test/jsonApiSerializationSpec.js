describe('jsonAPI Serialization, ', function () {

    describe('Primay Keys', function () {
        var testData = {};

        beforeEach(function () {
            testData.jsonApiData = new DSJsonApiAdapter.JsonApi.JsonApiRequest();
            testData.jsonApiData.WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('testuser')
            .WithId('2')
            .WithAttribute('author', 'John')
            .WithAttribute('age', 31));
            testData.model = [{ Id: '2', author: 'John', age: 31}]; //ISMODEL: true, type: 'testuser'
        });
        

        it('should use a default primary key of "id" when deserializing model, when not specifed in datastore configuration', function () {
            var _this = this;
            var TestUser = datastore.defineResource({
                name: 'testuser'
                //idAttribute: 'Id', intentionally not set 
            });
            
            
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/testuser');
                assert.equal(_this.requests[0].method, 'POST');
                assert.isDefined(_this.requests[0].requestHeaders, 'Request Contains headers');
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[0].requestBody, DSUtils.toJson({
                    data: {
                        //id: '', 
                        type: 'testuser', 
                        attributes: { author: 'John', age: 31 }, 
                        links: {}, 
                        relationships: {}
                    }
                }), 'Json data serialized to jsonApi data correctly');
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(testData.jsonApiData));
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
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[0].url, 'api/testuser');
                assert.equal(_this.requests[0].method, 'POST');
                assert.isDefined(_this.requests[0].requestHeaders, 'Request Contains headers');
                assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api accept required header');
                assert.include(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[0].requestBody, DSUtils.toJson({
                    data: {
                        //id: '', 
                        type: 'testuser', 
                        attributes: { author: 'John', age: 32 }, 
                        links: {}, 
                        relationships: {}
                    }
                }), 'Json data serialized to jsonApi data correctly');
                
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(testData.jsonApiData));
            }, 30);
            
            return dsHttpAdapter.create(TestUser, { author: 'John', age: 32 }, { basePath: 'api' }).then(function (data) {
                assert.equal(data.TestPK, testData.model.id, 'post should have extracted primary key from response and placed in property "TestPK"');

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
                        //id: '',
                        type: 'posts',
                        attributes: { author: 'John', age: 31 },
                        links: {},
                        relationships: {}
                    }
                }), 'Json data serialized to jsonApi data correctly');
                
                // Newly created object should have a server generated id set
                // Include json api self link, as required by Jsonapi spec
                testData.jsonApiData.data[0].WithLink('self', '/container/1/post/2');
                testData.model[0]['containerid'] = '1';
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(testData.jsonApiData));
            }, 30);
            
            return dsHttpAdapter.create(Post, { author: 'John', age: 31 }).then(function (data) {
                //console.log('Should Equal:(data,expected)', [data, testData.model]);
                
                // We are not testing meta data yet
                ignoreMetaData(data);
                assert.deepEqual(data[0], testData.model[0], 'post should have been created with parent id set to "1"');
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
                _this.requests[0].respond(500, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(errorResponse));
            }, 30);
            
            return dsHttpAdapter.create(Post, { author: 'John', age: 30 })
                .then(
                function (data) {
                    assert(false, 'internal server error response should NOT have succeed');
                }, 
                function (error) {
                    console.warn('Error:', error);
                    assert.deepEqual(error, errorResponse, 'returned server error response');
                }
            );
            
        });
    });

});