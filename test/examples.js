describe('Test Examples', function () {
    
    var ds;
    var example = {};
    
    
    beforeEach(function () {
        ds = new JSData.DS();
        var dsAdapter = new DSJsonApiAdapter.JsonApiAdapter({
            queryTransform: queryTransform
        });
        ds.registerAdapter('jsonApi', dsAdapter, { default: true });        
    });
    

    describe('oneToMany Example', function () {
                
        // Load onetomany example
        beforeEach(function () {
            
            // Configure
            example.config = examples.oneToMany.config(ds);
                        
            return loadJSON('/base/examples/oneToMany/oneToMany.json').then(function (json) {
                example.json = json;                
            });
        });
        

        it('Should Deserialize the sample oneToMany Json', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                
                _this.requests[_this.requests.length-1].respond(200, { 'Content-Type': 'application/vnd.api+json' }, example.json);
            }, 30);
            
            return example.config.article.find(1).then(function (data) {
                assert.isDefined(example.config.article.get(1), 'Expect article#1 to exist');
                assert.isDefined(example.config.comment.get(1), 'Expect comment#1 to exist');
                assert.isDefined(example.config.comment.get(2), 'Expect comment#2 to exist');
                assert.isDefined(example.config.author.get(9), 'Expect author#9 to exist');
                
                var article = example.config.article.get(1);
                var author = example.config.author.get(9);
                var comment1 = example.config.comment.get(1);
                var comment2 = example.config.comment.get(2);


                assert.equal(false, article.IsJsonApiReference, 'Expect article to be fully populated');                
                assert.equal(false, comment1.IsJsonApiReference, 'Expect comment#1 to be fully populated');
                assert.equal(false, comment2.IsJsonApiReference, 'Expect comment#2 to be fully populated');

                assert.equal(true, author.IsJsonApiReference, 'Expect author to be a refrence object only');
            });

        });
    });


    describe('manyToMany Example', function () {
        
        // Load manytomany example
        beforeEach(function () {
            
            // Configure
            example.config = examples.manyToMany.config(ds);
            
            return loadJSON('/base/examples/manyToMany/manyToMany.json').then(function (json) {
                example.json = json;
            });
        });

        it('Should Deserialize the sample manyToMany Json', function () {
            var _this = this;
            
            setTimeout(function () {
                assert.equal(1, _this.requests.length);
                
                _this.requests[_this.requests.length - 1].respond(200, { 'Content-Type': 'application/vnd.api+json' }, example.json);
            }, 30);
            
            return example.config.article.find(1).then(function (data) {
                assert.isDefined(example.config.article.get(1), 'Expect article#1 to exist');
                
                assert.isDefined(example.config.person.get(1), 'Expect person#1 to exist');
                assert.isDefined(example.config.person.get(2), 'Expect person#2 to exist');
                
                //assert.isDefined(example.config.author.get(9), 'Expect author#9 to exist');
                
                var article = example.config.article.get(1);
                var person1 = example.config.person.get(1);
                var person2 = example.config.person.get(2);
                
                assert.equal(false, article.IsJsonApiReference, 'Expect article to be fully populated');
                assert.equal(false, person1.IsJsonApiReference, 'Expect person#1 to be fully populated');
                assert.equal(false, person2.IsJsonApiReference, 'Expect person#2 to be fully populated');
                                
            });

        });
    });
});