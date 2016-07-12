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
            
            var response = JSON.stringify(responseData);
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
  
});