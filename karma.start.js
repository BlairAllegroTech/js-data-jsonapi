// Setup global test variables
var dsHttpAdapter, UserContainer, User, Post, datastore, DSUtils, queryTransform;
var p1, p11;
var p2, p3, p4, p5;
var ignoreMetaData;
var JSONAPIMETATAG = '$_JSONAPIMETA_';


// Helper globals
var fail = function (msg) {
    if (msg instanceof Error) {
        console.log(msg.stack);
    } else {
        assert.equal('should not reach this!: ' + msg, 'failure');
    }
};
var TYPES_EXCEPT_STRING = [123, 123.123, null, undefined, {}, [], true, false, function () {
    }];
var TYPES_EXCEPT_STRING_OR_ARRAY = [123, 123.123, null, undefined, {}, true, false, function () {
    }];
var TYPES_EXCEPT_STRING_OR_OBJECT = [123, 123.123, null, undefined, [], true, false, function () {
    }];
var TYPES_EXCEPT_STRING_OR_NUMBER_OBJECT = [null, undefined, [], true, false, function () {
    }];
var TYPES_EXCEPT_ARRAY = ['string', 123, 123.123, null, undefined, {}, true, false, function () {
    }];
var TYPES_EXCEPT_STRING_OR_NUMBER = [null, undefined, {}, [], true, false, function () {
    }];
var TYPES_EXCEPT_STRING_OR_ARRAY_OR_NUMBER = [null, undefined, {}, true, false, function () {
    }];
var TYPES_EXCEPT_NUMBER = ['string', null, undefined, {}, [], true, false, function () {
    }];
var TYPES_EXCEPT_OBJECT = ['string', 123, 123.123, null, undefined, true, false, function () {
    }];
var TYPES_EXCEPT_BOOLEAN = ['string', 123, 123.123, null, undefined, {}, [], function () {
    }];
var TYPES_EXCEPT_FUNCTION = ['string', 123, 123.123, null, undefined, {}, [], true, false];

// Setup before each test
beforeEach(function () {
    var JSData;
    if (!window && typeof module !== 'undefined' && module.exports) {
        JSData = require('js-data');
    } else {
        JSData = window.JSData;
    }
    
    queryTransform = function (resourceName, query) {
        queryTransform.callCount += 1;
        return query;
    };
    
    DSUtils = JSData.DSUtils;
    datastore = new JSData.DS();
    
    ignoreMetaData = function (data) {
        if (data) {
            if (DSUtils.isArray(data)) {
                DSUtils.forEach(data, function (item) {
                    // We are not testing meta data yet
                    assert.isDefined(item[JSONAPIMETATAG], 'should have json Api meta tag');
                    delete item[JSONAPIMETATAG];
                    
                    for (var prop in item) {
                        if (DSUtils.isArray(item[prop])) {
                            ignoreMetaData(item[prop]);
                        }
                    }
                });
            } else {
                // We are not testing meta data yet
                assert.isDefined(data[JSONAPIMETATAG], 'should have json Api meta tag');
                delete data[JSONAPIMETATAG];
            }

        }
    };
    
    UserContainer = datastore.defineResource({
        name: 'container',
        basePath : 'api',
        idAttribute: 'Id',
        relations: {
            // hasMany uses "localField" and "localKeys" or "foreignKey"
            hasMany: {
                posts: {
                    localField: 'containedposts',
                    foreignKey: 'containerid'
                }
            }
        },
        
        methods: {
            loadPosts : function () {
                var hasReferenceData = false;
                var link = this[JSONAPIMETATAG].relationships['posts'];

                if (this.containedposts) {
                    DSUtils.forEach(this.containedposts, function (item) {
                        if (item && item[JSONAPIMETATAG] && item[JSONAPIMETATAG].isJsonApiReference === true) {
                            hasReferenceData = true;
                        }
                    });
                }


                if (hasReferenceData === true && this[JSONAPIMETATAG] && this[JSONAPIMETATAG].relationships['posts']) {
                    return Post.findAll({ containerid: this.Id, urlPath: link, bypassCache: true });
                } else {
                    DSUtils.Promise.resolve(this.containedposts);
                }

                //return Post.findAll({ containerid: this.Id, urlPath: link, bypassCache: false}).then(function (data) {
                //    if (data && DSUtils.isArray(data)) {
                //        DSUtils.forEach(data, function (item) {
                //            if (item && item[JSONAPIMETATAG] && item[JSONAPIMETATAG].isJsonApiReference === true) {
                //                hasReferenceData = true;
                //            }
                //        });
                //    }
                //}).then(function (data) {
                //    if (hasReferenceData === true) {
                //        return Post.findAll({ containerid: this.Id, urlPath: link, bypassCache: true });
                //    }
                //});
            }
        }
    });

    User = datastore.defineResource({
        name: 'user', 
        idAttribute: 'Id'
    });

    Post = datastore.defineResource({
        name: 'posts',
        basePath: 'api',
        idAttribute: 'Id',
        relations: {
            belongsTo: {
                container: {
                    localField: 'Container',
                    localKey: 'containerid',
                    parent: true
                }
            }
        }
    });

    dsHttpAdapter = new DSJsonApiAdapter.JsonApiAdapter({
        queryTransform: queryTransform
    });

    datastore.registerAdapter('jsonApi', dsHttpAdapter, { default: true });
        
    queryTransform.callCount = 0;
    
    p1 = {};
    p1.jsonApiData = new DSJsonApiAdapter.JsonApi.JsonApiRequest();
    p1.jsonApiData.WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('5', 'posts')
        .WithAttribute('author', 'John')
        .WithAttribute('age', 30));
    p1.model = [{ Id: '5', age: 30, author: 'John', }]; //ISMODEL: true, type: 'posts'
    
    p11 = {};
    p11.jsonApiData = new DSJsonApiAdapter.JsonApi.JsonApiRequest();
    p11.jsonApiData.WithData(new DSJsonApiAdapter.JsonApi.JsonApiData('5', 'posts')
        .WithLink('self', '/container/1/posts/5')
        .WithAttribute('author', 'John')
        .WithAttribute('age', 30));
    p11.model = [{ Id: '5',  age: 30, author: 'John', containerid: '1' }]; //ISMODEL: true, type: 'posts',
    
    DataWithRelation = {};
    DataWithRelation.jsonApiData = new DSJsonApiAdapter.JsonApi.JsonApiRequest();
    DataWithRelation.jsonApiData
        .WithData(
            new DSJsonApiAdapter.JsonApi.JsonApiData('1', 'container')
                .WithLink('self', '/container/1')
                .WithRelationship('posts', 
                    new DSJsonApiAdapter.JsonApi.JsonApiRelationship()
                        .WithData('posts', '5')
            )
        )
        .WithIncluded(p11.jsonApiData.data[0]);

    DataWithRelation.model = [{ Id:'1', containedposts: p11.model}]; //ISMODEL: true, type:'container, PostsIds:['5']'


    p2 = { author: 'Sally', age: 31, id: 6 };
    p3 = { author: 'Mike', age: 32, id: 7 };
    p4 = { author: 'Adam', age: 33, id: 8 };
    p5 = { author: 'Adam', age: 33, id: 9 };
    
    try {
        this.xhr = sinon.useFakeXMLHttpRequest();
        // Create an array to store requests
        var requests = this.requests = [];
        // Keep references to created requests
        this.xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
    } catch (err) {
        console.error(err);
    }
});

afterEach(function () {
    // Restore the global timer functions to their native implementations
    try {
        if (this.xhr) {
            this.xhr.restore();
        }
    } catch (err) {
        console.error(err);
    }
});