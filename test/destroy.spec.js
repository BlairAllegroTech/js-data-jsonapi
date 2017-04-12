describe('DSJsonApiAdapter.destroy(resourceConfig, id, options)', function () {

    it('should make a DELETE request, with 200 OK response, see : http://jsonapi.org/format/#crud-deleting', function () {
        var _this = this;

        setTimeout(function () {
            assert.equal(1, _this.requests.length);
            assert.equal(_this.requests[0].url, 'api/posts/1');
            assert.equal(_this.requests[0].method, 'DELETE');
            assert.isDefined(_this.requests[0].requestHeaders);
            assert.notInclude(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');

            // see : http://jsonapi.org/format/#crud-deleting deleting and returning a 200 result!
            var responseData = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                .WithMeta('Destroy', 'Ok');
            delete responseData.data;

            var response =  DSUtils.toJson(responseData);
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, response);
        }, 30);

        return dsHttpAdapter.destroy(Post, 1).then(function (data) {
            assert.equal(data, null, 'post should have been deleted');
        });
    });

    it('should make a DELETE request, with 204 OK NoContent response', function () {
        var _this = this;

        setTimeout(function () {
            assert.equal(1, _this.requests.length);
            assert.equal(_this.requests[0].url, 'api2/posts/1');
            assert.equal(_this.requests[0].method, 'DELETE');
            assert.isDefined(_this.requests[0].requestHeaders);
            assert.notInclude(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Contains json api content-type header');

            _this.requests[0].respond(204, { 'Content-Type': 'application/vnd.api+json' });
        }, 30);

        return dsHttpAdapter.destroy(Post, 1, { basePath: 'api2' }).then(function (data) {
            assert.equal(data, null, 'post should have been deleted, correct response when server returns "Ok NoContent(204)" response');
        });
    });

    // Shamefully copied from update.spec.js tests DS#Save
    describe('DS#Destroy', function () {
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
            });
        });

        it('should destroy data to adapter', function () {
            var _this = this;
            var response = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                .WithData(
                new DSJsonApiAdapter.JsonApi.JsonApiData('author')
                    .WithId('1')
                    .WithAttribute('name', 'Bob')
                    .WithAttribute('age', 30)
                    .WithLink('self', 'api/author/1')
                );

            setTimeout(function () {
                var index = _this.requests.length-1;
                assert.equal(1, _this.requests.length);
                assert.equal(_this.requests[index].url, 'author');
                assert.equal(_this.requests[index].method, 'GET');

                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, DSUtils.toJson(response));
            }, 30);

            return testData.config.Author.findAll().then(function (data) {
                setTimeout(function () {
                    var index = _this.requests.length - 1;
                    assert.equal(2, _this.requests.length);
                    assert.equal(_this.requests[index].url, 'api/author/1', "destroy should use self url");
                    assert.equal(_this.requests[index].method, 'DELETE');

                    _this.requests[index].respond(204, {'Content-Type': 'application/vnd.api+json'});
                }, 30);

                var author = testData.config.Author.get(1);
                assert.isDefined(author, 'Author should be in DS');
                return ds.destroy('author', author.id).then(function (data) {
                    // Rob expects data to be equal to null like 'with 204 OK NoContent response' above
                    // However I haven't really figured out the magic where karma creates these responses
                    // However the important bit is "destroy should use self url" assertion
                    assert.equal(data, 1, 'author should have been deleted');
                });
            });
        });
    });

});
