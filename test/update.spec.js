describe('DSJsonAdapter.update(resourceConfig, id, attrs, options)', function () {
    
    it('should make a PUT request', function () {
        var _this = this;
        
        setTimeout(function () {
            assert.equal(1, _this.requests.length);
            assert.equal(_this.requests[0].url, 'api/posts/1');
            assert.equal(_this.requests[0].method, 'PUT');
            assert.isDefined(_this.requests[0].requestHeaders);
            assert.include(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
            assert.equal(_this.requests[0].requestBody, JSON.stringify({ data: { id: "1", type: 'posts', attributes: { author: 'John', age: 30 }, links: {}, relationships: {} } }));
            
        
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(p1.jsonApiData));
        }, 30);
        
        return dsHttpAdapter.update(Post, 1, { author: 'John', age: 30 }).then(function (data) {
            // We are not testing meta data yet
            ignoreMetaData(data);

            assert.deepEqual(data, p1.model, 'post 1 should have been updated#1');
            
            setTimeout(function () {
                assert.equal(2, _this.requests.length);
                assert.equal(_this.requests[1].url, 'api2/posts/1');
                assert.equal(_this.requests[1].method, 'PUT');
                assert.isDefined(_this.requests[1].requestHeaders);
                assert.include(_this.requests[1].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
                assert.equal(_this.requests[1].requestBody, JSON.stringify({ data: { id: "1", type: 'posts', attributes: { author: 'John', age: 30 }, links: {}, relationships: {} } }));

                 _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' }, JSON.stringify(p1.jsonApiData));

            }, 30);
            
            return dsHttpAdapter.update(Post, 1, { author: 'John', age: 30 }, { basePath: 'api2' });
        }).then(function (data) {
            // We are not testing meta data yet
            ignoreMetaData(data);

            assert.deepEqual(data, p1.model, 'post 1 should have been updated#2');
            assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called twice');
        });
    });
    
    it('should handle server 204 NoContent reponse correctly when PUT (update) data is stored with out any changes on the server. So servers may chose to return no content', function () {
        var _this = this;
        
        setTimeout(function () {
            assert.equal(1, _this.requests.length);
            assert.equal(_this.requests[0].url, 'api/posts/1');
            assert.equal(_this.requests[0].method, 'PUT');
            assert.isDefined(_this.requests[0].requestHeaders);
            assert.include(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
            assert.equal(_this.requests[0].requestBody, JSON.stringify({ data: { id: "1", type: 'posts', attributes: { author: 'John', age: 30, type:'person' }, links: {}, relationships: {} } }));
            
            p1.model[0].Id = '1';
            _this.requests[0].respond(204);//{ 'Content-Type': 'application/vnd.api+json' }
        }, 30);
        
        return dsHttpAdapter.update(Post, 1, { author: 'John', age: 30, type:'person' }).then(function (data) {
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