describe('DSJsonApiAdapter.destroy(resourceConfig, id, options)', function () {
    
    it('should make a DELETE request', function () {
        var _this = this;
        
        setTimeout(function () {
            assert.equal(1, _this.requests.length);
            assert.equal(_this.requests[0].url, 'api/posts/1');
            assert.equal(_this.requests[0].method, 'DELETE');
            assert.isDefined(_this.requests[0].requestHeaders);
            assert.notInclude(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Client library remove this header when there is no form data, and lets the browser set it!!');

            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, '1');
        }, 30);
        
        return dsHttpAdapter.destroy(Post, 1).then(function (data) {
            assert.deepEqual(data, 1, 'post should have been deleted');
            
            setTimeout(function () {
                assert.equal(2, _this.requests.length);
                assert.equal(_this.requests[1].url, 'api2/posts/1');
                assert.equal(_this.requests[1].method, 'DELETE');
                assert.isDefined(_this.requests[0].requestHeaders);
                assert.notInclude(_this.requests[0].requestHeaders['Content-Type'], 'application/vnd.api+json', 'Client library remove this header when there is no form data, and lets the browser set it!!');
                _this.requests[1].respond(204, { 'Content-Type': 'application/vnd.api+json' }, '1');
            }, 30);
            
            return dsHttpAdapter.destroy(Post, 1, { basePath: 'api2' });
        }).then(function (data) {
            assert.deepEqual(data, 1, 'post should have been deleted, correct response when server returns "OkNoContent(204)" response');
            assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called twice');
        });
    });
});