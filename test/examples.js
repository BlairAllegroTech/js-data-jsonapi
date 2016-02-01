describe('Test Examples', function () {
    
    var ds;
    var example, config;
    
    
    beforeEach(function () {
        ds = new JSData.DS();
        var dsAdapter = new DSJsonApiAdapter.JsonApiAdapter({
            queryTransform: queryTransform
        });
        ds.registerAdapter('jsonApi', dsAdapter, { default: true });
        
        
        example = examples.oneToMany;
        config = example.config(ds);
        
    });
    

    describe('oneToMany Example', function () {
                
        it('Should Deserialize the sample Json', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                
                _this.requests[0].respond(200, { 'Content-Type': 'application/vnd.api+json' }, example.json);
            }, 30);
            
            return config.article.find(1).then(function (data) {
                assert.isDefined(config.article.get(1), 'Article loaded into data store');
                assert.isDefined(config.comment.get(1), 'Article comment exists');
            });

        });
    });
});