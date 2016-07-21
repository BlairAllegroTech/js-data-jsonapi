describe('Resource.loadRelations(id, [relations],[options])', function () {
    
    describe('(METHOD#1) loadRelations', function () { 
        it('should make a GET request to load related data, using loadRelations (METHOD#1)', function () {
        var _this = this;

        var container = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
            .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('container')
                .WithId('1')
                .WithLink('self', '/container/1')
                .WithRelationship('containedposts', 
                    new DSJsonApiAdapter.JsonApi.JsonApiRelationship(true)
                        .WithLink('related', 'http://xxx/container/1/posts')
                        .WithData('posts', '5')
        ));


        setTimeout(function () {
            assert.equal(1, _this.requests.length, "First Call");
            assert.equal(_this.requests[0].url, 'api/container/1');
            assert.equal(_this.requests[0].method, 'GET');
            assert.isDefined(_this.requests[0].requestHeaders);
            assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');

            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(container));
        }, 30);

        return UserContainer.find(1).then(function (data) {
            assert.equal(queryTransform.callCount, 1, 'queryTransform should have been called once');
            assert.isDefined(data, 'post response recieved');
            assert.isDefined(data.length, 'post response is array');
            assert.equal(data[0].Id, '1', 'post PK 1 should have been found');

            assert.isDefined(data[0][JSONAPIMETATAG].relationships['containedposts'], 'json api relationship for "posts", should exist');
            var postList = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                .WithLink('self', '/container/1/posts')
                .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                    .WithId('5')
                    .WithLink('self', '/container/1/posts/5')
                    .WithAttribute('author', 'John')
                    .WithAttribute('age', 30)
                )
                .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                    .WithId('10')
                    .WithLink('self', '/container/1/posts/10')
                    .WithAttribute('author', 'Mark')
                    .WithAttribute('age', 25)
                );

            setTimeout(function () {
                assert.equal(2, _this.requests.length);
                assert.equal(_this.requests[1].url, 'http://xxx/container/1/posts');
                assert.equal(_this.requests[1].method, 'GET');
                
                _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(postList));
            }, 30);

            var parent = data[0];
            var link = parent[JSONAPIMETATAG].relationships['containedposts']['related'];
            assert.equal(link.url, 'http://xxx/container/1/posts')

            // I believe the line below and the subsequent call to Post.findAll are equivelent
            // However the call below to "loadRelations" is more meaning full in terms of what we are trying to do.
            // The problem is that js-data is being too smart, we want the parameters passed!! 
            // e.g.The parent / parentId and the parent relation to load.
            // However what ends up at the adapter is infomation about the children that would be returned
            // which means we have to jump through hoops to try to get back this original innformation when 
            // eventually findAll is called on the data adabter!!
            // Please review, see  JsonApiAdapter.getPath code inside of  if (method === 'findAll') where i am trying to get the 
            // parent and the relationship info!!!!
            return UserContainer.loadRelations(1, ['containedposts']).then(function (data) {
                assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called twice');

                assert.isDefined(UserContainer.get(1), 'Container 1 exists');
                assert.isDefined(UserContainer.get(1).containedposts, 'Posts  exist');
                assert.isDefined(UserContainer.get(1).containedposts[0], 'UserContainer 1 has at least 1 child post');
                assert.isDefined(UserContainer.get(1).containedposts[1], 'UserContainer 1 has 2 child posts 10');

                assert.equal(UserContainer.get(1).containedposts[0].Id, 5, 'UserContainer 1 has child post 5');
                assert.equal(UserContainer.get(1).containedposts[1].Id, 10, 'UserContainer 1 has child post 10');

                Post.ejectAll();
                assert.isUndefined(UserContainer.get(1).containedposts[0], 'UserContainer 1 has child post 5, ejected');
                
                //setTimeout(function () {
                //    assert.equal(3, _this.requests.length, 'Should be 3rd Call');
                //    assert.equal(_this.requests[2].url, 'http://xxx/container/1/posts');
                //    assert.equal(_this.requests[2].method, 'GET');

                //    _this.requests[2].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(postList));
                //}, 60);

                //return Post.findAll({ containerid: parent.Id }).then(function (data) {
                //    assert.equal(queryTransform.callCount, 3, 'queryTransform should have been called 3 times');

                //    assert.isDefined(UserContainer.get(1), 'Container 1 exists');
                //    assert.isDefined(UserContainer.get(1).containedposts, 'Posts 1 exist');

                //    assert.isDefined(UserContainer.get(1).containedposts[0], 'UserContainer 1 has at least 1 child post');
                //    assert.isDefined(UserContainer.get(1).containedposts[1], 'UserContainer 1 has 2 child posts 10');
                    
                //    assert.equal(UserContainer.get(1).containedposts[0].Id, 5, 'UserContainer 1 has child post 5');
                //    assert.equal(UserContainer.get(1).containedposts[1].Id, 10, 'UserContainer 1 has child post 10');

                //});
            });
        });
    });
    });
    
    describe('(METHOD#2) findAll', function () {
        it('should make a GET request to load related data, using findAll (METHOD#2)', function () {
        var _this = this;

        setTimeout(function () {
            assert.equal(1, _this.requests.length, 'First Call');
            assert.equal(_this.requests[0].url, 'api/container/1');
            assert.equal(_this.requests[0].method, 'GET');
            assert.isDefined(_this.requests[0].requestHeaders, 'Headers Should be defined');
            assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
            
            var container = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('container')
                    .WithId('1')
                    .WithLink('self', '/container/1')
                    .WithRelationship('containedposts', 
                        new DSJsonApiAdapter.JsonApi.JsonApiRelationship(true)
                            .WithLink('related', 'http://xxx/container/1/posts')
                            .WithData('posts', '5')
                ));
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(container));
        }, 30);
        
        return UserContainer.find(1).then(function (data) {
            assert.equal(queryTransform.callCount, 1, 'queryTransform should have been called once');
            assert.isDefined(data, 'post response recieved');
            assert.isDefined(data.length, 'post response is array');
            assert.equal(data[0].Id, '1', 'post PK 1 should have been found');
            assert.isDefined(data[0][JSONAPIMETATAG].relationships['containedposts'], 'json api relationship for "posts", should exist');


            setTimeout(function () {
                assert.equal(2, _this.requests.length, 'Second call');
                assert.equal(_this.requests[1].url, 'http://xxx/container/1/posts');
                assert.equal(_this.requests[1].method, 'GET');
                
                var postList = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                    .WithLink('self', '/container/1/posts')
                    .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                        .WithId('5')
                        .WithLink('self', '/container/1/posts/5')
                        .WithAttribute('author', 'John')
                        .WithAttribute('age', 30)
                    )
                    .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                        .WithId('10')
                        .WithLink('self', '/container/1/posts/10')
                        .WithAttribute('author', 'Mark')
                        .WithAttribute('age', 25)
                );

                _this.requests[1].respond(
                    200, 
                    { 'Content-Type': 'application/vnd.api+json' }, 
                    DSUtils.toJson(postList)
                );
            }, 30);
            

            var parent = data[0];
            var link = parent[JSONAPIMETATAG].relationships['containedposts']['related'];
            assert.equal(link.url, 'http://xxx/container/1/posts');

            // This call has the same effect as the above to load related data
            return Post.findAll({ containerid: parent.Id }, { bypassCache: true, jsonApi: { jsonApiPath: link.url }}).then(function (data) {
                assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called 2 times, find and findAll');

                assert.isDefined(UserContainer.get(1), 'Container 1 exists');
                assert.isDefined(UserContainer.get(1).containedposts, 'Container 1, Posts exist');

                assert.isDefined(UserContainer.get(1).containedposts[0], 'UserContainer 1 has at least 1 child post');
                assert.isDefined(UserContainer.get(1).containedposts[1], 'UserContainer 1 has a 2nd child');
                assert.equal(UserContainer.get(1).containedposts.length,2 , 'UserContainer 1 has 2 child');

                assert.equal(UserContainer.get(1).containedposts[0].Id, 5, 'UserContainer 1 has child post 5');
                assert.equal(UserContainer.get(1).containedposts[1].Id, 10, 'UserContainer 1 has child post 10');
            });
        });
    });
    });
    
    describe('(METHOD#3) findRelated', function () {
        it('should make a GET request to load related Post data, using findRelated ', function () {
        var _this = this;

        var container = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
            .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('container')
                .WithId('1')
                .WithLink('self', '/container/1')
                .WithRelationship('containedposts', 
                    new DSJsonApiAdapter.JsonApi.JsonApiRelationship(true)
                        .WithLink('related', 'http://xxx/container/1/posts')
                        .WithData('posts', '5')
        ));
        
        setTimeout(function () {
            assert.equal(1, _this.requests.length, 'First Call');
            assert.equal(_this.requests[0].url, 'api/container/1');
            assert.equal(_this.requests[0].method, 'GET');
            assert.isDefined(_this.requests[0].requestHeaders);
            assert.equal(_this.requests[0].requestHeaders['Accept'], 'application/vnd.api+json', 'Contains json api content-type header');
            
            _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(container));
        }, 30);
        
        return UserContainer.find(1).then(function (data) {
            assert.equal(queryTransform.callCount, 1, 'queryTransform should have been called once');
            assert.isDefined(data, 'post response recieved');
            assert.isDefined(data.length, 'post response is array');
            assert.equal(data[0].Id, '1', 'post PK 1 should have been found');
            
            assert.isDefined(data[0][JSONAPIMETATAG].relationships['containedposts'], 'json api relationship for "posts", should exist');
            var postList = new DSJsonApiAdapter.JsonApi.JsonApiRequest()
                .WithLink('self', '/container/1/posts')
                .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                    .WithId('5')
                    .WithLink('self', '/container/1/posts/5')
                    .WithAttribute('author', 'John')
                    .WithAttribute('age', 30)
            )
                .WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('posts')
                    .WithId('10')
                    .WithLink('self', '/container/1/posts/10')
                    .WithAttribute('author', 'Mark')
                    .WithAttribute('age', 25)
            );
            
            setTimeout(function () {
                assert.equal(2, _this.requests.length, 'loadRelations 1 call expected only');
                assert.equal(_this.requests[1].url, 'http://xxx/container/1/posts');
                assert.equal(_this.requests[1].method, 'GET');
                
                _this.requests[1].respond(200, { 'Content-Type': 'application/vnd.api+json' },  DSUtils.toJson(postList));
            }, 30);
            
          
            var parent = data[0];
            
            var link = parent[JSONAPIMETATAG].relationships['containedposts']['related'];
            assert.equal(link.url, 'http://xxx/container/1/posts')
            
            // This call has the same effect as the above to load related data
            return parent.findRelated('containedposts').then(function (data) {
                assert.equal(queryTransform.callCount, 2, 'queryTransform should have been called 2 times, find and loadrelations');

                assert.isDefined(UserContainer.get(1), 'Container 1 exists');
                assert.isDefined(UserContainer.get(1).containedposts, 'Container 1, Posts exist');

                assert.isDefined(UserContainer.get(1).containedposts[0], 'UserContainer 1 has at least 1 child post');
                assert.isDefined(UserContainer.get(1).containedposts[1], 'UserContainer 1 has a 2nd child');
                assert.equal(UserContainer.get(1).containedposts.length, 2 , 'UserContainer 1 has 2 child');

                assert.equal(UserContainer.get(1).containedposts[0].Id, 5, 'UserContainer 1 has child post 5');
                assert.equal(UserContainer.get(1).containedposts[1].Id, 10, 'UserContainer 1 has child post 10');
            });
        });
    });
    });
});