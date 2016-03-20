// Setup global test variables
var JSData, DSUtils;
var realXMLHttpRequest;

var dsHttpAdapter, UserContainer, User, Post, datastore, queryTransform;
var p1, p11;
var p2, p3, p4, p5;
var examples = {};
//var ignoreMetaData, loadJSON;
var JSONAPIMETATAG = '$_JSONAPIMETA_';


// Helper globals
var fail = function (msg) {
    if (msg instanceof Error) {
        console.log(msg.stack);
    } else {
        assert.equal('should not reach this!: ' + msg, 'failure');
    }
};

function loadJSON(file) {
    
    
    return new DSUtils.Promise(function (resolve, reject) {
        
        var xhr = new realXMLHttpRequest();

        xhr.open('GET', file);
        xhr.timeout = 500;
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
};

var ignoreMetaData = function (data) {
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


  

//Setup

before(function () {
    if (!window && typeof module !== 'undefined' && module.exports) {
        JSData = require('js-data');
    } else {
        JSData = window.JSData;
    }
    
    DSUtils = JSData.DSUtils;
    
    realXMLHttpRequest = XMLHttpRequest;             
});

// Setup before each test
beforeEach(function () {
                
    queryTransform = function (resourceName, query) {
        queryTransform.callCount += 1;
        return query;
    };
    
    
    datastore = new JSData.DS();

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

            //Experimental mechanisum for loading  jsonApi related/relationships data
            findRelatePosts : function () {
                var hasReferenceData = false;
                var link = DSUtils.get(this, JSONAPIMETATAG + '.relationships.containedposts.related');

                if (this.containedposts) {
                    DSUtils.forEach(this.containedposts, function (item) {
                        if(DSUtils.get(item, JSONAPIMETATAG + '.isJsonApiReference')){
                            hasReferenceData = true;
                            // Exit the for loop early
                            return false;
                        }
                    });
                }
                
                if (hasReferenceData === true && link) {
                    return Post.findAll({ containerid: this.Id }, { bypassCache: true, jsonApi: { jsonApiPath: link } });
                } else {
                    DSUtils.Promise.resolve(this.containedposts);
                }
            },


            //Experimental mechanisum for loading  jsonApi related/relationships data
            __findRelated : function (relationName) {
                var hasReferenceData = false;
                
                if (DSUtils.get(item, JSONAPIMETATAG + '.isJsonApiReference') === false) {                    
                    
                    if (this[relationName]) {
                        DSUtils.forEach(this[relationName], function (item) {
                            if (DSUtils.get(item, JSONAPIMETATAG + '.isJsonApiReference')) {
                                hasReferenceData = true;
                                // Exit the for loop early
                                return false;
                            }
                        });
                    } else {
                        throw new Error('findRelated failed, Relationship name:' + relationName + ' does not exist.')
                    }
                    
                    if (hasReferenceData === true || this[relationName] == undefined) {
                        // Get relted link for relationship
                        var relationshipUrl = DSUtils.get(this, [JSONAPIMETATAG, 'relationships', relationName, 'related'].join('.'));
                        
                        if (relationshipUrl) {
                            return Post.findAll({ containerid: this.Id }, { bypassCache: true, jsonApi: { jsonApiPath: relationshipUrl } });
                        }
                    }
                    
                    return DSUtils.Promise.resolve(this[relationName]);                
                } else {
                    // This is it self a model reference and so we should get the self link first.
                    // NOTE : We could load self link and then relationship transparently but not sure that this would be what a developer would want.
                    // probably still better to jut throw an error for now!
                    throw Error("findRelated failed, this is a mode reference load via self link instead.")
                }
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
                .WithRelationship('containedposts', 
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