/*!
* js-data-jsonapi
* @version 0.0.0-alpha.20 - Homepage <https://github.com/BlairAllegroTech/js-data-jsonapi>
* @author Blair Jacobs
* @copyright (c) 2016-2017 Blair Jacobs
* @license MIT <https://github.com/BlairAllegroTech/js-data-jsonapi/blob/master/LICENSE>
*
* @overview JsonApi adapter for js-data.
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("js-data"), require("js-data-http"));
	else if(typeof define === 'function' && define.amd)
		define(["js-data", "js-data-http"], factory);
	else if(typeof exports === 'object')
		exports["DSJsonApiAdapter"] = factory(require("js-data"), require("js-data-http"));
	else
		root["DSJsonApiAdapter"] = factory(root["JSData"], root["DSHttpAdapter"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_2__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var JSDataLib = __webpack_require__(1);
	var JSDataHttp = __webpack_require__(2);
	var Helper = __webpack_require__(3);
	exports.JsonApi = __webpack_require__(4);
	var HttpNoContent = 204;
	var JsonApiAdapter = (function () {
	    function JsonApiAdapter(options) {
	        var _this = this;
	        this.DSUtils = JSDataLib['DSUtils'];
	        this.serialize = this.SerializeJsonResponse;
	        this.deserialize = this.DeSerializeJsonResponse;
	        if (options && options.adapter) {
	            this.adapter = (options.adapter);
	            this.DSUtils.deepMixIn(this.defaults, options);
	        }
	        else {
	            var httpAdapter = JSDataHttp;
	            this.adapter = (new httpAdapter(options));
	        }
	        this.defaults.jsonApi = options.jsonApi || {};
	        this.DSUtils.deepMixIn(this.defaults.jsonApi, { usePATCH: true, updateRelationships: false });
	        this.DSUtils.deepMixIn(this.defaults.jsonApi, options.jsonApi);
	        this.adapterGetPath = this.adapter.getPath;
	        this.adapterHTTP = this.adapter.HTTP;
	        this.adapter.getPath = function (method, resourceConfig, id, options) {
	            return _this.getPath(method, resourceConfig, id, options);
	        };
	        this.adapter.HTTP = function (options) {
	            return _this.HTTP(options);
	        };
	    }
	    Object.defineProperty(JsonApiAdapter.prototype, "defaults", {
	        get: function () {
	            return this.adapter.defaults;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    JsonApiAdapter.prototype.SerializeJsonResponse = function (resourceConfig, attrs, config) {
	        var serializationOptions = new Helper.SerializationOptions(resourceConfig);
	        return Helper.JsonApiHelper.Serialize(serializationOptions, attrs, config);
	    };
	    JsonApiAdapter.prototype.DeSerializeJsonResponse = function (resourceConfig, response) {
	        var _this = this;
	        if (Helper.JsonApiHelper.ContainsJsonApiContentTypeHeader(response.headers)) {
	            if (response.data.errors) {
	                response.data = Helper.JsonApiHelper.FromJsonApiError(response.data);
	            }
	            else {
	                if (response.status !== HttpNoContent && response.data.data) {
	                    if (this.DSUtils.isArray(response.data.data)) {
	                        this.DSUtils.forEach(response.data.data, function (item) {
	                            if (item.type !== resourceConfig.name && _this.defaults.log) {
	                                _this.defaults.log('Warning: Json Api resource name missmatch, ' +
	                                    'JsonApi:' + (item.type || 'missing') +
	                                    ', js-data:', [resourceConfig.name]);
	                                item.type = resourceConfig.name;
	                            }
	                        });
	                    }
	                    else {
	                        var data = response.data.data;
	                        if (data.type !== resourceConfig.name && this.defaults.log) {
	                            this.defaults.log('Warning: Json Api resource name missmatch, ' +
	                                'JsonApi:' + (response.data.data['type'] || 'missing') +
	                                ', js-data:', resourceConfig.name);
	                            data.type = resourceConfig.name;
	                        }
	                    }
	                }
	                var obj = Helper.JsonApiHelper.DeSerialize(new Helper.SerializationOptions(resourceConfig), response.data);
	                response.data = obj.data;
	            }
	        }
	        return response;
	    };
	    JsonApiAdapter.prototype.HandleError = function (config, options, error) {
	        return options.deserialize(config, error);
	    };
	    JsonApiAdapter.prototype.getPath = function (method, resourceConfig, id, options) {
	        if (Helper.JsonApiHelper.ContainsJsonApiContentTypeHeader(this.DSUtils.get(options, 'headers'))) {
	            var item;
	            if (this.DSUtils._sn(id)) {
	                item = resourceConfig.get(id);
	            }
	            else if (this.DSUtils._o(id)) {
	                item = id;
	            }
	            var jsonApiPath = this.DSUtils.get(options, 'jsonApi.jsonApiPath');
	            if (jsonApiPath) {
	                if (options.params.__jsDataJsonapi) {
	                    delete options.params.__jsDataJsonapi;
	                }
	            }
	            else {
	                if (method === 'update' || method === 'destroy') {
	                    var metaData = Helper.MetaData.TryGetMetaData(item);
	                    if (metaData && metaData.selfLink) {
	                        jsonApiPath = metaData.selfLink;
	                    }
	                }
	            }
	            var basePath = options.basePath || this.defaults['basePath'] || resourceConfig.basePath;
	            if (jsonApiPath) {
	                if (basePath && jsonApiPath.substr(0, basePath.length) === basePath) {
	                    return jsonApiPath;
	                }
	                else {
	                    return this.DSUtils.makePath(basePath, jsonApiPath);
	                }
	            }
	            else {
	                return this.adapterGetPath.apply(this.adapter, [method, resourceConfig, id, options]);
	            }
	        }
	        else {
	            return this.adapterGetPath.apply(this.adapter, [method, resourceConfig, id, options]);
	        }
	    };
	    JsonApiAdapter.prototype.configureSerializers = function (options, locals) {
	        var _this = this;
	        var callOptions = {};
	        this.DSUtils.deepMixIn(callOptions, this.DSUtils.copy(this.defaults));
	        this.DSUtils.deepMixIn(callOptions, locals);
	        this.DSUtils.deepMixIn(callOptions, options);
	        callOptions['headers'] = callOptions['headers'] || {};
	        Helper.JsonApiHelper.AddJsonApiAcceptHeader(callOptions['headers']);
	        Helper.JsonApiHelper.AddJsonApiContentTypeHeader(callOptions['headers']);
	        var serialize = callOptions['serialize'] || this.defaults.serialize;
	        if (serialize) {
	            callOptions['serialize'] = function (resourceConfig, attrs) {
	                return serialize(resourceConfig, _this.serialize(resourceConfig, attrs, callOptions));
	            };
	        }
	        else {
	            callOptions['serialize'] = function (resourceConfig, attrs) {
	                return _this.serialize(resourceConfig, attrs, callOptions);
	            };
	        }
	        var deserialize = callOptions['deserialize'] || this.defaults.deserialize;
	        if (deserialize) {
	            callOptions['deserialize'] = function (resourceConfig, data) {
	                return deserialize(resourceConfig, _this.deserialize(resourceConfig, data));
	            };
	        }
	        else {
	            callOptions['deserialize'] = function (resourceConfig, data) {
	                return _this.deserialize(resourceConfig, data);
	            };
	        }
	        return callOptions;
	    };
	    JsonApiAdapter.prototype.HTTP = function (options) {
	        var _this = this;
	        return this.adapterHTTP.apply(this.adapter, [options])
	            .then(function (response) {
	            if (Helper.JsonApiHelper.ContainsJsonApiContentTypeHeader(_this.DSUtils.get(options, 'headers'))) {
	                if (response.status === HttpNoContent && options['method'] && (options['method'] === 'put' || options['method'] === 'patch')) {
	                    if (options['data']) {
	                        response.status = 200;
	                        response['statusText'] = 'Ok';
	                        response.headers = response.headers || {};
	                        Helper.JsonApiHelper.AddJsonApiContentTypeHeader(response.headers);
	                        response.data = options['data'];
	                    }
	                }
	            }
	            return response;
	        });
	    };
	    JsonApiAdapter.prototype.create = function (config, attrs, options) {
	        var _this = this;
	        var localOptions = this.configureSerializers(options);
	        if (attrs[config.idAttribute]) {
	            attrs[config.idAttribute] = attrs[config.idAttribute].toString();
	        }
	        return this.adapter.create(config, attrs, localOptions).then(null, function (error) {
	            if (_this.defaults.log) {
	                _this.defaults.log('create Failure', error);
	            }
	            return _this.DSUtils.Promise.reject(_this.HandleError(config, localOptions, error));
	        });
	    };
	    JsonApiAdapter.prototype.destroy = function (config, id, options) {
	        var _this = this;
	        var idString = id.toString();
	        var localOptions = this.configureSerializers(options);
	        return this.adapter.destroy(config, idString, localOptions).then(null, function (error) {
	            return _this.DSUtils.Promise.reject(_this.HandleError(config, localOptions, error));
	        });
	    };
	    JsonApiAdapter.prototype.destroyAll = function (config, params, options) {
	        var _this = this;
	        var localOptions = this.configureSerializers(options);
	        return this.adapter.destroyAll(config, params, localOptions).then(null, function (error) {
	            return _this.DSUtils.Promise.reject(_this.HandleError(config, localOptions, error));
	        });
	    };
	    JsonApiAdapter.prototype.find = function (config, id, options) {
	        var _this = this;
	        var idString = id.toString();
	        var localOptions = this.configureSerializers(options);
	        return this.adapter.find(config, idString, localOptions).then(null, function (error) {
	            return _this.DSUtils.Promise.reject(_this.HandleError(config, localOptions, error));
	        });
	    };
	    JsonApiAdapter.prototype.findAll = function (config, params, options) {
	        var _this = this;
	        var localOptions = this.configureSerializers(options);
	        return this.adapter.findAll(config, params, localOptions).then(null, function (error) {
	            return _this.DSUtils.Promise.reject(_this.HandleError(config, localOptions, error));
	        });
	    };
	    JsonApiAdapter.prototype.update = function (config, id, attrs, options) {
	        var _this = this;
	        var idString = id.toString();
	        if (attrs[config.idAttribute]) {
	            if (attrs[config.idAttribute].toString() !== idString) {
	                throw new Error('Json Api update expected supplied id and the primary key attribute "' + config.idAttribute +
	                    '" to be the same, you may have called update on the wrong id?');
	            }
	        }
	        else {
	            attrs[config.idAttribute] = idString;
	        }
	        var localOptions = this.configureSerializers(options);
	        if (localOptions.jsonApi.usePATCH === false) {
	            localOptions.jsonApi.updateRelationships = (localOptions.jsonApi.updateRelationships === undefined) ? true : localOptions.jsonApi.updateRelationships;
	        }
	        else {
	            localOptions.method = localOptions.method || 'patch';
	            localOptions.changes = (localOptions.changes === undefined) ? true : localOptions.changes;
	        }
	        return this.adapter.update(config, idString, attrs, localOptions).then(null, function (error) {
	            return _this.DSUtils.Promise.reject(_this.HandleError(config, localOptions, error));
	        });
	    };
	    JsonApiAdapter.prototype.updateAll = function (config, attrs, params, options) {
	        var _this = this;
	        var localOptions = this.configureSerializers(options);
	        if (localOptions.jsonApi.usePATCH === false) {
	            localOptions.jsonApi.updateRelationships = (localOptions.jsonApi.updateRelationships === undefined) ? true : localOptions.jsonApi.updateRelationships;
	        }
	        else {
	            localOptions.method = localOptions.method || 'patch';
	            localOptions.changes = (localOptions.changes === undefined) ? true : localOptions.changes;
	        }
	        return this.adapter.updateAll(config, attrs, params, localOptions).then(null, function (error) {
	            return _this.DSUtils.Promise.reject(_this.HandleError(config, localOptions, error));
	        });
	    };
	    return JsonApiAdapter;
	}());
	exports.JsonApiAdapter = JsonApiAdapter;
	function TryGetMetaData(obj) {
	    return Helper.MetaData.TryGetMetaData(obj);
	}
	exports.TryGetMetaData = TryGetMetaData;
	;
	exports.version = {
	    full: '0.0.0-alpha.20',
	    major: parseInt('0', 10),
	    minor: parseInt('0', 10),
	    patch: parseInt('0', 10),
	    alpha:  true ? '20' : false,
	    beta:  true ? 'false' : false
	};
	//# sourceMappingURL=JsonApiAdapter.js.map

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var JSDataLib = __webpack_require__(1);
	var JsonApi = __webpack_require__(4);
	exports.JSONAPI_META = '$_JSONAPIMETA_';
	var jsonApiContentType = 'application/vnd.api+json';
	exports.JSONAPI_RELATED_LINK = 'related';
	exports.JSONAPI_PARENT_LINK = 'parent';
	var jsDataBelongsTo = 'belongsTo';
	var jsDataHasMany = 'hasMany';
	var jsDataHasOne = 'hasOne';
	var DSUTILS = JSDataLib['DSUtils'];
	var MetaLinkDataImp = (function () {
	    function MetaLinkDataImp(type, url) {
	        this.type = type;
	        this.url = url;
	    }
	    return MetaLinkDataImp;
	}());
	var MetaData = (function () {
	    function MetaData(type) {
	        this.selfType = type;
	        this.selfLink = null;
	        this.isJsonApiReference = true;
	        this.relationships = {};
	        this.links = {};
	        this.referenceCount = 0;
	    }
	    MetaData.prototype.WithRelationshipLink = function (relationName, linkType, dataType, url) {
	        this.relationships[relationName] = this.relationships[relationName] || {};
	        this.relationships[relationName][linkType] = new MetaLinkDataImp(dataType, url);
	        return this;
	    };
	    MetaData.prototype.WithLink = function (linkName, url, meta) {
	        var link = new MetaLinkDataImp(linkName, url);
	        link.meta = meta;
	        this.links[linkName] = link;
	        return this;
	    };
	    MetaData.prototype.getLinks = function (linkName) {
	        return this.links[linkName];
	    };
	    MetaData.prototype.incrementReferenceCount = function () {
	        this.referenceCount++;
	        return this.referenceCount;
	    };
	    MetaData.prototype.getRelationshipLink = function (relationName, linkType) {
	        if (this.relationships[relationName]) {
	            return this.relationships[relationName][linkType];
	        }
	        else {
	            return undefined;
	        }
	    };
	    MetaData.TryGetMetaData = function (obj) {
	        if (obj) {
	            return DSUTILS.get(obj, exports.JSONAPI_META);
	        }
	        else {
	            return undefined;
	        }
	    };
	    return MetaData;
	}());
	exports.MetaData = MetaData;
	var ModelPlaceHolder = (function () {
	    function ModelPlaceHolder(type, id) {
	        this.type = type;
	        this.id = id;
	        if (!type || !id) {
	            throw new Error('Type or Id missing');
	        }
	    }
	    ModelPlaceHolder.prototype.WithForeignKey = function (keyName, keyValue, keyType) {
	        this.keyName = keyName;
	        this.keyValue = keyValue;
	        this.keyType = keyType;
	        return this;
	    };
	    return ModelPlaceHolder;
	}());
	var SerializationOptions = (function () {
	    function SerializationOptions(def) {
	        this.resourceDef = def;
	    }
	    Object.defineProperty(SerializationOptions.prototype, "type", {
	        get: function () { return this.resourceDef.name; },
	        enumerable: true,
	        configurable: true
	    });
	    ;
	    Object.defineProperty(SerializationOptions.prototype, "idAttribute", {
	        get: function () { return this.resourceDef.idAttribute; },
	        enumerable: true,
	        configurable: true
	    });
	    ;
	    SerializationOptions.prototype.relationType = function () { return this.resourceDef['type']; };
	    ;
	    SerializationOptions.prototype.def = function () {
	        return this.resourceDef;
	    };
	    SerializationOptions.prototype.getResource = function (resourceName) {
	        var resource = this.resourceDef.getResource(resourceName);
	        return resource ? new SerializationOptions(resource) : null;
	    };
	    SerializationOptions.prototype.getBelongsToRelation = function (parentType, relationName) {
	        if (this.resourceDef.relations && this.resourceDef.relations.belongsTo) {
	            if (relationName) {
	                return this.resourceDef.relations.belongsTo[parentType];
	            }
	            else {
	                return this.resourceDef.relations.belongsTo[parentType];
	            }
	        }
	        return null;
	    };
	    SerializationOptions.prototype.getParentRelationByLocalKey = function (localKey) {
	        var match = null;
	        if (this.resourceDef.relations && this.resourceDef.relations.belongsTo) {
	            for (var r in this.resourceDef.relations.belongsTo) {
	                if (this.resourceDef.relations.belongsTo[r]) {
	                    DSUTILS.forEach(this.resourceDef.relations.belongsTo[r], function (relation) {
	                        if (relation.localKey === localKey) {
	                            match = relation;
	                            return false;
	                        }
	                    });
	                }
	            }
	        }
	        return match;
	    };
	    SerializationOptions.prototype.getParentRelationByLocalField = function (localField) {
	        var match = null;
	        if (this.resourceDef.relations && this.resourceDef.relations.belongsTo) {
	            for (var r in this.resourceDef.relations.belongsTo) {
	                if (this.resourceDef.relations.belongsTo[r]) {
	                    DSUTILS.forEach(this.resourceDef.relations.belongsTo[r], function (relation) {
	                        if (relation.localField === localField) {
	                            match = relation;
	                            return false;
	                        }
	                    });
	                }
	            }
	        }
	        return match;
	    };
	    SerializationOptions.prototype.getChildRelation = function (relationType) {
	        var relation = this.getChildRelations(relationType);
	        return (relation && relation[0]) ? relation[0] : null;
	    };
	    SerializationOptions.prototype.getChildRelationWithLocalField = function (relationType, localFieldName) {
	        relationType = relationType.toLowerCase();
	        localFieldName = localFieldName.toLowerCase();
	        var relations = this.getChildRelations(relationType);
	        var match = null;
	        DSUTILS.forEach(relations, function (relation) {
	            if (relation.localField === localFieldName) {
	                match = relation;
	                return false;
	            }
	        });
	        return match;
	    };
	    SerializationOptions.prototype.getChildRelationWithForeignKey = function (relationType, foreignKeyName) {
	        relationType = relationType.toLowerCase();
	        foreignKeyName = foreignKeyName.toLowerCase();
	        var relations = this.getChildRelations(relationType);
	        var match = null;
	        DSUTILS.forEach(relations, function (relation) {
	            if (relation.foreignKey === foreignKeyName) {
	                match = relation;
	                return false;
	            }
	        });
	        return match;
	    };
	    SerializationOptions.prototype.enumerateAllChildRelations = function (callback) {
	        DSUTILS.forEach(this.resourceDef.relationList, function (relation, index, source) {
	            if (relation.type === jsDataHasMany || relation.type === jsDataHasOne) {
	                return callback(relation, index, source);
	            }
	        });
	    };
	    SerializationOptions.prototype.enumerateAllParentRelations = function (callback) {
	        DSUTILS.forEach(this.resourceDef.relationList, function (relation, index, source) {
	            if (relation.type === jsDataBelongsTo) {
	                return callback(relation, index, source);
	            }
	        });
	    };
	    SerializationOptions.prototype.enumerateRelations = function (callback) {
	        DSUTILS.forEach(this.resourceDef.relationList, function (relation, index, source) {
	            return callback(relation, index, source);
	        });
	    };
	    SerializationOptions.prototype.getChildRelations = function (relationType) {
	        relationType = relationType.toLowerCase();
	        if (this.resourceDef.relations) {
	            var matches_1 = [];
	            if (this.resourceDef.relations.hasOne) {
	                if (this.resourceDef.relations.hasOne[relationType]) {
	                    matches_1 = matches_1.concat(this.resourceDef.relations.hasOne[relationType]);
	                }
	            }
	            if (this.resourceDef.relations.hasMany) {
	                if (this.resourceDef.relations.hasMany[relationType]) {
	                    matches_1 = matches_1.concat(this.resourceDef.relations.hasMany[relationType]);
	                }
	            }
	            if (matches_1.length) {
	                return matches_1;
	            }
	            var relationlower_1 = relationType.toLowerCase();
	            var relationList = this.resourceDef.relationList;
	            DSUTILS.forEach(relationList, function (relation) {
	                if (relation.type === jsDataHasMany || relation.type === jsDataHasOne) {
	                    if (relationlower_1 === relation.relation) {
	                        matches_1.push(relation);
	                    }
	                }
	            });
	            LogInfo('Relation Case Insensitive match made of ' + relationType, matches_1);
	            return matches_1;
	        }
	        return null;
	    };
	    SerializationOptions.prototype.getRelationByLocalField = function (relationName) {
	        var relationlower = relationName.toLowerCase();
	        var relationList = this.resourceDef.relationList;
	        var match = null;
	        DSUTILS.forEach(relationList, function (relation) {
	            if (relation.localField === relationlower) {
	                match = relation;
	                return false;
	            }
	        });
	        return match;
	    };
	    return SerializationOptions;
	}());
	exports.SerializationOptions = SerializationOptions;
	var DeSerializeResult = (function () {
	    function DeSerializeResult(data, response) {
	        this.data = data;
	        this.response = response;
	    }
	    return DeSerializeResult;
	}());
	function LogInfo(message, data) {
	    if (console) {
	        console.log(message, data);
	    }
	}
	function LogWarning(message, data) {
	    if (console) {
	        console.warn(message, data);
	    }
	}
	var JsonApiHelper = (function () {
	    function JsonApiHelper() {
	    }
	    JsonApiHelper.MergeMetaData = function (res, data) {
	        if (res) {
	            var dataMeta = MetaData.TryGetMetaData(data);
	            if (!dataMeta) {
	                throw new Error('MergeMetaData failed, target object missing meta data Type:' + res.name);
	            }
	            else {
	                var id = data[res.idAttribute];
	                var exiting = res.get(id);
	                if (exiting) {
	                    var existingMeta = MetaData.TryGetMetaData(exiting);
	                    if (existingMeta) {
	                        dataMeta.isJsonApiReference = dataMeta.isJsonApiReference || existingMeta.isJsonApiReference;
	                    }
	                }
	            }
	        }
	    };
	    JsonApiHelper.ContainsHeader = function (headers, header, value) {
	        if (headers) {
	            for (var key in headers) {
	                if (key.toLocaleLowerCase() === header.toLocaleLowerCase()) {
	                    var h = headers[key];
	                    if (h.toLocaleLowerCase().indexOf(value) > -1) {
	                        return true;
	                    }
	                }
	            }
	        }
	        return false;
	    };
	    JsonApiHelper.ContainsJsonApiContentTypeHeader = function (headers) {
	        return JsonApiHelper.ContainsHeader(headers, 'Content-Type', jsonApiContentType);
	    };
	    JsonApiHelper.AddJsonApiContentTypeHeader = function (headers) {
	        headers['Content-Type'] = jsonApiContentType;
	    };
	    JsonApiHelper.AddJsonApiAcceptHeader = function (headers) {
	        headers['Accept'] = jsonApiContentType;
	    };
	    JsonApiHelper.FromJsonApiError = function (response) {
	        var responseObj;
	        if (response.errors) {
	            responseObj = new JsonApi.JsonApiRequest();
	            if (DSUTILS.isArray(response.errors)) {
	                DSUTILS.forEach(response.errors, function (item) {
	                    responseObj.WithError(DSUTILS.deepMixIn(new JsonApi.JsonApiError(), item));
	                });
	            }
	            else {
	                responseObj.WithError(DSUTILS.deepMixIn(new JsonApi.JsonApiError(), response.errors));
	            }
	        }
	        else {
	            responseObj = JsonApiHelper.CreateInvalidResponseError(response);
	        }
	        return responseObj;
	    };
	    JsonApiHelper.Serialize = function (options, attrs, config) {
	        var _this = this;
	        var result = new JsonApi.JsonApiRequest();
	        if (DSUTILS.isArray(attrs)) {
	            DSUTILS.forEach(attrs, function (item) {
	                result.WithData(_this.ObjectToJsonApiData(options, item, config));
	            });
	        }
	        else {
	            result.data = this.ObjectToJsonApiData(options, attrs, config);
	        }
	        return result;
	    };
	    JsonApiHelper.DeSerialize = function (options, response) {
	        var _this = this;
	        if (response.data === null) {
	            return new DeSerializeResult(null, null);
	        }
	        if (DSUTILS.isArray(response.data)) {
	            if (response.data.length === 0) {
	                return new DeSerializeResult([], null);
	            }
	        }
	        var newResponse = new JsonApi.JsonApiRequest();
	        if (response.data) {
	            if (DSUTILS.isArray(response.included)) {
	                DSUTILS.forEach(response.included, function (item) {
	                    _this.NormaliseLinkFormat(item.links);
	                    for (var relation in item.relationships) {
	                        if (item.relationships[relation]) {
	                            _this.NormaliseLinkFormat(item.relationships[relation].links);
	                            var isArray = DSUTILS.isArray(item.relationships[relation].data);
	                            item.relationships[relation] = DSUTILS.deepMixIn(new JsonApi.JsonApiRelationship(isArray), item.relationships[relation]);
	                        }
	                    }
	                    newResponse.WithIncluded(DSUTILS.deepMixIn(new JsonApi.JsonApiData('unknown'), item));
	                });
	            }
	            if (DSUTILS.isArray(response.data)) {
	                DSUTILS.forEach(response.data, function (item) {
	                    _this.NormaliseLinkFormat(item.links);
	                    for (var relation in item.relationships) {
	                        if (item.relationships[relation]) {
	                            _this.NormaliseLinkFormat(item.relationships[relation].links);
	                            var isArray = DSUTILS.isArray(item.relationships[relation].data);
	                            item.relationships[relation] = DSUTILS.deepMixIn(new JsonApi.JsonApiRelationship(isArray), item.relationships[relation]);
	                        }
	                    }
	                    newResponse.WithData(DSUTILS.deepMixIn(new JsonApi.JsonApiData(''), item));
	                });
	            }
	            else {
	                var item_1 = response.data;
	                this.NormaliseLinkFormat(item_1.links);
	                for (var relation in item_1.relationships) {
	                    if (item_1.relationships[relation]) {
	                        this.NormaliseLinkFormat(item_1.relationships[relation].links);
	                        var isArray = DSUTILS.isArray(item_1.relationships[relation].data);
	                        item_1.relationships[relation] = DSUTILS.deepMixIn(new JsonApi.JsonApiRelationship(isArray), item_1.relationships[relation]);
	                    }
	                }
	                newResponse.WithSingleData(DSUTILS.deepMixIn(new JsonApi.JsonApiData(''), response.data));
	            }
	        }
	        if (response.links) {
	            this.NormaliseLinkFormat(response.links);
	            for (var link in response.links) {
	                if (response.links[link]) {
	                    newResponse.AddLink(link, response.links[link]);
	                }
	            }
	        }
	        var data = {};
	        var included = {};
	        var jsDataJoiningTables = {};
	        if (DSUTILS.isArray(newResponse.data)) {
	            DSUTILS.forEach(newResponse.data, function (item) {
	                data[item.type] = data[item.type] || {};
	                data[item.type][item.id] = _this.DeserializeJsonApiData(options, item, jsDataJoiningTables);
	                var metaData = MetaData.TryGetMetaData(data[item.type][item.id]);
	                metaData.incrementReferenceCount();
	            });
	        }
	        else {
	            var item_2 = newResponse.data;
	            if (item_2) {
	                data[item_2.type] = data[item_2.type] || {};
	                data[item_2.type][item_2.id] = this.DeserializeJsonApiData(options, item_2, jsDataJoiningTables);
	                var metaData = MetaData.TryGetMetaData(data[item_2.type][item_2.id]);
	                metaData.incrementReferenceCount();
	            }
	        }
	        JsonApiHelper.AssignLifeTimeEvents(options.def());
	        DSUTILS.forEach(newResponse.included, function (item) {
	            var includedDef = options.getResource(item.type);
	            included[item.type] = included[item.type] || {};
	            included[item.type][item.id] = _this.DeserializeJsonApiData(includedDef, item, jsDataJoiningTables);
	            JsonApiHelper.AssignLifeTimeEvents(includedDef.def());
	        });
	        var itemSelector = function (item) {
	            var newItem = included[item.type] ? included[item.type][item.id] :
	                (data[item.type] ? data[item.type][item.id] :
	                    (jsDataJoiningTables[item.type] ? jsDataJoiningTables[item.type][item.id] : null));
	            return newItem;
	        };
	        var toManyPlaceHolderVisitor = function (data) {
	            if (data.constructor === ModelPlaceHolder) {
	                var itemPlaceHolder = data;
	                var newItem = itemSelector(itemPlaceHolder);
	                if (newItem) {
	                    if (itemPlaceHolder.keyName) {
	                        newItem[itemPlaceHolder.keyName] = itemPlaceHolder.keyValue;
	                    }
	                    var meta = MetaData.TryGetMetaData(newItem);
	                    if (meta.incrementReferenceCount() === 1) {
	                        return newItem;
	                    }
	                    else {
	                        return undefined;
	                    }
	                }
	                else {
	                    var newItem_1 = {};
	                    if (itemPlaceHolder.keyName) {
	                        newItem_1[itemPlaceHolder.keyName] = itemPlaceHolder.keyValue;
	                    }
	                    var itemOptions = options.getResource(itemPlaceHolder.type);
	                    var metaData_1 = new MetaData(itemPlaceHolder.type);
	                    metaData_1.isJsonApiReference = true;
	                    newItem_1[exports.JSONAPI_META] = metaData_1;
	                    newItem_1[itemOptions.idAttribute] = itemPlaceHolder.id;
	                    JsonApiHelper.AssignLifeTimeEvents(itemOptions.def());
	                    return newItem_1;
	                }
	            }
	            return data;
	        };
	        var toOnePlaceHolderVisitor = function (data, localField, opt) {
	            var val = data[localField];
	            if (val && val.constructor === ModelPlaceHolder) {
	                var itemPlaceHolder = val;
	                var newItem = itemSelector(itemPlaceHolder);
	                if (newItem) {
	                    var meta = MetaData.TryGetMetaData(newItem);
	                    if (meta.incrementReferenceCount() === 1) {
	                        return newItem;
	                    }
	                    else {
	                        if (itemPlaceHolder.keyName) {
	                            newItem[itemPlaceHolder.keyName] = itemPlaceHolder.keyValue;
	                        }
	                        else {
	                            var relation = opt.getParentRelationByLocalField(localField);
	                            if (relation && relation.type === jsDataBelongsTo) {
	                                data[relation.localKey] = itemPlaceHolder.id;
	                            }
	                        }
	                        return undefined;
	                    }
	                }
	                else {
	                    newItem = {};
	                    var itemOptions = options.getResource(itemPlaceHolder.type);
	                    if (itemPlaceHolder.keyName) {
	                        newItem[itemPlaceHolder.keyName] = itemPlaceHolder.keyValue;
	                    }
	                    var metaData_2 = new MetaData(itemPlaceHolder.type);
	                    metaData_2.isJsonApiReference = true;
	                    newItem[exports.JSONAPI_META] = metaData_2;
	                    newItem[itemOptions.idAttribute] = itemPlaceHolder.id;
	                    JsonApiHelper.AssignLifeTimeEvents(itemOptions.def());
	                    return newItem;
	                }
	            }
	            return data[localField];
	        };
	        this.RelationshipVisitor(data, options, toManyPlaceHolderVisitor, toOnePlaceHolderVisitor);
	        this.RelationshipVisitor(included, options, toManyPlaceHolderVisitor, toOnePlaceHolderVisitor);
	        this.RelationshipVisitor(jsDataJoiningTables, options, toManyPlaceHolderVisitor, toOnePlaceHolderVisitor);
	        var registration = function (type) {
	            var typeOptions = options.getResource(type);
	            if (typeOptions) {
	                JsonApiHelper.AssignLifeTimeEvents(typeOptions.def());
	            }
	            else {
	                throw new Error('Unknow type:' + type);
	            }
	        };
	        this.DataTypeVisitor(data, registration);
	        this.DataTypeVisitor(included, registration);
	        this.DataTypeVisitor(jsDataJoiningTables, registration);
	        if (data) {
	            var jsDataArray = [];
	            if (DSUTILS.isArray(newResponse.data)) {
	                DSUTILS.forEach(newResponse.data, function (item) {
	                    if (data[item.type] && data[item.type][item.id]) {
	                        jsDataArray.push(data[item.type][item.id]);
	                    }
	                });
	                return new DeSerializeResult(jsDataArray, newResponse);
	            }
	            else {
	                if (newResponse.data) {
	                    var item = newResponse.data;
	                    if (data[item.type] && data[item.type][item.id]) {
	                        return new DeSerializeResult(data[item.type][item.id], newResponse);
	                    }
	                }
	                else {
	                    return new DeSerializeResult(null, newResponse);
	                }
	            }
	        }
	    };
	    JsonApiHelper.RelationshipVisitor = function (data, options, toManyVisitor, toOneVisitor) {
	        if (data) {
	            for (var dataType in data) {
	                if (data[dataType]) {
	                    for (var dataId in data[dataType]) {
	                        if (data[dataType][dataId]) {
	                            var dataObject = data[dataType][dataId];
	                            for (var prop in dataObject) {
	                                if (DSUTILS.isArray(dataObject[prop])) {
	                                    DSUTILS.forEach(dataObject[prop], function (item, index, source) {
	                                        var result = toManyVisitor(item);
	                                        source[index] = result;
	                                    });
	                                    for (var i = dataObject[prop].length; i >= 0; i--) {
	                                        if (!dataObject[prop][i]) {
	                                            dataObject[prop].splice(i, 1);
	                                        }
	                                    }
	                                    if (dataObject[prop].length === 0) {
	                                        delete dataObject[prop];
	                                    }
	                                }
	                                else {
	                                    var opt = options.getResource(dataType);
	                                    var result = toOneVisitor(dataObject, prop, opt);
	                                    if (result !== undefined) {
	                                        dataObject[prop] = result;
	                                    }
	                                    else {
	                                        delete dataObject[prop];
	                                    }
	                                }
	                            }
	                        }
	                    }
	                }
	            }
	        }
	    };
	    JsonApiHelper.DataTypeVisitor = function (data, visitor) {
	        for (var dataType in data) {
	            if (dataType) {
	                visitor(dataType);
	            }
	        }
	    };
	    JsonApiHelper.CreateInvalidResponseError = function (response) {
	        var responseObj = new JsonApi.JsonApiRequest();
	        var e = new JsonApi.JsonApiError();
	        e.title = 'Invalid response';
	        e.detail = 'Response is incorrectly formed: ' + JSON.stringify(response);
	        responseObj.WithError(e);
	        return responseObj;
	    };
	    JsonApiHelper.ObjectToJsonApiData = function (options, attrs, config) {
	        if (!options.type) {
	            throw new Error('Type required within options');
	        }
	        var data = new JsonApi.JsonApiData(options.type);
	        if (attrs[options.idAttribute]) {
	            data.WithId(attrs[options.idAttribute]);
	        }
	        if (config.changes && attrs[options.idAttribute]) {
	            var id = attrs[options.idAttribute];
	            if (options.def().hasChanges(id)) {
	                var changes = options.def().changes(id);
	                DSUTILS.forOwn(changes['added'], function (value, prop) {
	                    if (prop !== options.idAttribute && prop !== exports.JSONAPI_META && prop.indexOf('$') < 0) {
	                        data.WithAttribute(prop, value);
	                    }
	                });
	                DSUTILS.forOwn(changes['changed'], function (value, prop) {
	                    if (prop !== options.idAttribute && prop !== exports.JSONAPI_META && prop.indexOf('$') < 0) {
	                        data.WithAttribute(prop, value);
	                    }
	                });
	                DSUTILS.forOwn(changes['removed'], function (value, prop) {
	                    if (prop !== options.idAttribute && prop !== exports.JSONAPI_META && prop.indexOf('$') < 0) {
	                        data.WithAttribute(prop, null);
	                    }
	                });
	            }
	        }
	        else {
	            DSUTILS.forOwn(attrs, function (value, prop) {
	                if (prop !== options.idAttribute && prop !== exports.JSONAPI_META && prop.indexOf('$') < 0) {
	                    data.WithAttribute(prop, value);
	                }
	            });
	        }
	        if (config.jsonApi.updateRelationships === true) {
	            options.enumerateAllChildRelations(function (relation) {
	                var relatedDef = options.getResource(relation.relation);
	                if (relation.type === jsDataHasMany) {
	                    var relationship = new JsonApi.JsonApiRelationship(true);
	                    var relatedObjects = DSUTILS.get(attrs, relation.localField);
	                    if (relatedObjects) {
	                        DSUTILS.forEach(relatedObjects, function (item) {
	                            relationship.WithData(relation.relation, item[relatedDef.idAttribute]);
	                        });
	                    }
	                    data.WithRelationship(relation.localField, relationship);
	                }
	                if (relation.type === jsDataHasOne) {
	                    var relationship = null;
	                    var relatedObject = DSUTILS.get(attrs, relation.localField);
	                    if (relatedObject) {
	                        relationship = new JsonApi.JsonApiRelationship(false)
	                            .WithData(relation.relation, relatedObject[relatedDef.idAttribute]);
	                    }
	                    data.WithRelationship(relation.localField, relationship);
	                }
	                return true;
	            });
	        }
	        if (data.attributes) {
	            options.enumerateRelations(function (relation) {
	                var localKeys = relation.localKey || relation.localKeys;
	                if (localKeys) {
	                    if (DSUTILS.get(data.attributes, localKeys)) {
	                        delete data.attributes[localKeys];
	                    }
	                }
	                return true;
	            });
	        }
	        return data;
	    };
	    JsonApiHelper.DeserializeJsonApiData = function (options, data, joinData) {
	        if (!options) {
	            throw new Error('Missing Serialization Options, indicates possible missing jsData resource: ' + data.type);
	        }
	        var fields = DSUTILS.copy(data.attributes || {});
	        var metaData = new MetaData(data.type);
	        metaData.isJsonApiReference = false;
	        metaData.selfLink = data.GetSelfLink();
	        if (data.id) {
	            fields[options.idAttribute] = data.id.toString();
	        }
	        else {
	            throw new Error('Missing required "id" property in JsonApi response');
	        }
	        if (data.type) {
	        }
	        else {
	            throw new Error('Missing required "type" property in JsonApi response');
	        }
	        JsonApiHelper.setParentIds(options, data, fields, metaData);
	        for (var relationName in data.relationships) {
	            if (data.relationships[relationName]) {
	                var relationship = data.relationships[relationName];
	                var relationshipDef = options.getRelationByLocalField(relationName);
	                if (relationshipDef) {
	                    if (relationshipDef.type === jsDataHasMany || relationshipDef.type === jsDataHasOne) {
	                        metaData.WithRelationshipLink(relationshipDef.localField, exports.JSONAPI_RELATED_LINK, relationshipDef.relation, relationship.FindLinkType(exports.JSONAPI_RELATED_LINK));
	                        var hasData = (relationship.data && (!DSUTILS.isArray(relationship.data) ||
	                            (DSUTILS.isArray(relationship.data) && relationship.data.length > 0)));
	                        if (hasData) {
	                            var joinTableFactory = null;
	                            var childRelationType = DSUTILS.isArray(relationship.data) ? relationship.data[0].type : relationship.data.type;
	                            relationshipDef = options.getChildRelationWithLocalField(childRelationType, relationName);
	                            if (!relationshipDef) {
	                                if (options.def().meta && options.def().meta[relationName]) {
	                                    var joinMetaData = options.def().meta[relationName];
	                                    var joiningTypeResourceDef = options.getResource(joinMetaData.joinType);
	                                    relationshipDef = options.getChildRelationWithLocalField(joinMetaData.joinType, relationName);
	                                    if (relationshipDef.type !== jsDataHasMany) {
	                                        throw new Error('Expected relationship Named:' + relationName + 'on type:' + options.type +
	                                            ' with many-to-many meta data to be a to many relationship.');
	                                    }
	                                    var joiningTableChildRelation = joiningTypeResourceDef.getBelongsToRelation(joinMetaData.type);
	                                    if (!joiningTableChildRelation || !joiningTableChildRelation[0]) {
	                                        throw new Error('Expected Many-To-Many Joining table to have a "belongsTo" relation of type:' + joinMetaData.type +
	                                            ' as defined in meta data of type:' + data.type);
	                                    }
	                                    var joinState = {
	                                        idAttribute: joiningTypeResourceDef.idAttribute,
	                                        type: joiningTypeResourceDef.type,
	                                        dataLocalField: relationshipDef.localField,
	                                        dataForeignKey: relationshipDef.foreignKey,
	                                        joinTypeDef: joiningTypeResourceDef
	                                    };
	                                    joinTableFactory = function (foreignRecord, relationshipLink) {
	                                        var pk = (data.type > foreignRecord.type) ? data.id + foreignRecord.id : foreignRecord.id + data.id;
	                                        joinData[joinState.type] = (joinData[joinState.type] || {});
	                                        var joinTableRelation = joinState.joinTypeDef.getParentRelationByLocalKey(joinState.dataForeignKey);
	                                        if (!joinTableRelation) {
	                                            throw new Error('No "BelongsTo" relationship found on joining table ' + joinState.joinTypeDef.type + ' with field name:' + joinState.dataForeignKey);
	                                        }
	                                        if (!joinData[joinState.type][pk]) {
	                                            var metaData = new MetaData(joinState.type);
	                                            metaData.isJsonApiReference = false;
	                                            var fields_1 = {};
	                                            fields_1[joinState.idAttribute] = pk;
	                                            fields_1[joinTableRelation.localKey] = data.id;
	                                            fields_1[joinTableRelation.localField] = new ModelPlaceHolder(data.type, data.id);
	                                            metaData.selfLink = relationshipLink + '/' + pk;
	                                            fields_1[exports.JSONAPI_META] = metaData;
	                                            joinData[joinState.type][pk] = fields_1;
	                                        }
	                                        else {
	                                            var join = joinData[joinState.type][pk];
	                                            join[joinTableRelation.localKey] = data.id;
	                                            join[joinTableRelation.localField] = new ModelPlaceHolder(data.type, data.id);
	                                        }
	                                        return new ModelPlaceHolder(joinState.type, pk)
	                                            .WithForeignKey(joinState.dataForeignKey, data.id, data.type);
	                                    };
	                                }
	                            }
	                            if (relationshipDef) {
	                                metaData.WithRelationshipLink(relationshipDef.localField, exports.JSONAPI_RELATED_LINK, relationshipDef.relation, relationship.FindLinkType(exports.JSONAPI_RELATED_LINK));
	                            }
	                            else {
	                                throw new Error('MISSING: Relationship definition on js-data resource, Name:' + options.type +
	                                    ', failed to load relationship named: ' + relationName +
	                                    '. Your js-data store configuration does not match your jsonapi data structure');
	                            }
	                            var localField = relationshipDef.localField;
	                            var foreignKey = relationshipDef.foreignKey;
	                            var relationType = relationshipDef.type;
	                            if (!localField) {
	                                throw new Error('ERROR: Incorrect js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + relationshipDef.relation +
	                                    'relationship requires "localField" parameter to be configured');
	                            }
	                            if (relationType === jsDataHasMany) {
	                                if (!(foreignKey || relationshipDef.localKeys)) {
	                                    throw new Error('ERROR: Incorrect js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + relationshipDef.relation +
	                                        'A "hasMany" relationship requires either "foreignKey" or "localKeys" to be configured');
	                                }
	                                if (foreignKey && relationshipDef.localKeys) {
	                                    throw new Error('ERROR: Ambiguous js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + relationshipDef.relation +
	                                        'A "hasMany" relationship has both localKeys and foreignKeys configured, use either "foreignKey" or "localKeys" but not BOTH');
	                                }
	                            }
	                            else {
	                                if (!(foreignKey || relationshipDef.localKey)) {
	                                    throw new Error('ERROR: Incorrect js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + relationshipDef.relation +
	                                        'A "hasOne" relationship requires either "foreignKey" or "localKey" to be configured');
	                                }
	                                if (foreignKey && relationshipDef.localKey) {
	                                    throw new Error('ERROR: Ambiguous js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + relationshipDef.relation +
	                                        'A "hasOne" relationship has both localKey and foreignKey configured, use either "foreignKey" or "localKey" but not BOTH');
	                                }
	                            }
	                            if (DSUTILS.isArray(relationship.data)) {
	                                var localKeysList = new Array();
	                                var relatedItems = new Array();
	                                DSUTILS.forEach(relationship.data, function (item) {
	                                    if (joinTableFactory == null) {
	                                        var id = item.id;
	                                        var type = item.type;
	                                        var relatedItem = new ModelPlaceHolder(type, id);
	                                        if (relationshipDef.foreignKey) {
	                                            relatedItem.WithForeignKey(relationshipDef.foreignKey, data.id, data.type);
	                                        }
	                                        else {
	                                            localKeysList.push(id);
	                                        }
	                                        relatedItems.push(relatedItem);
	                                    }
	                                    else {
	                                        var relatedItem = joinTableFactory(item, relationship.FindLinkType('self'));
	                                        localKeysList.push(id);
	                                        relatedItems.push(relatedItem);
	                                    }
	                                });
	                                if (relationshipDef.localKeys) {
	                                    fields[relationshipDef.localKeys] = localKeysList;
	                                }
	                                fields[localField] = relatedItems;
	                            }
	                            else {
	                                var item = relationship.data;
	                                var id = item.id;
	                                var type = item.type;
	                                var relatedItem = new ModelPlaceHolder(type, id);
	                                if (relationshipDef.foreignKey) {
	                                    relatedItem.WithForeignKey(relationshipDef.foreignKey, data.id, data.type);
	                                }
	                                else {
	                                    fields[relationshipDef.localKey] = id;
	                                }
	                                fields[localField] = relatedItem;
	                            }
	                        }
	                        else {
	                        }
	                    }
	                    else {
	                    }
	                }
	                else {
	                    throw new Error('MISSING: Relationship definition on js-data resource, Name:' + options.type +
	                        ', failed to load relationship named: ' + relationName +
	                        '. Your js-data store configuration does not match your jsonapi data structure');
	                }
	            }
	        }
	        if (data.links) {
	            this.NormaliseLinkFormat(data.links);
	            for (var linkName in data.links) {
	                if (data.links[linkName]) {
	                    var link = data.links[linkName];
	                    metaData.WithLink(linkName, link.href, link.meta);
	                }
	            }
	        }
	        fields[exports.JSONAPI_META] = metaData;
	        return fields;
	    };
	    JsonApiHelper.setParentIds = function (options, data, fields, metaData) {
	        if (data.type && data.GetSelfLink && data.GetSelfLink()) {
	            var selfLinkArray = data.GetSelfLink().split('/');
	            options.enumerateAllParentRelations(function (rel) {
	                var parentResourceIndex = selfLinkArray.lastIndexOf(rel.relation);
	                if (parentResourceIndex >= 0 && rel.localKey) {
	                    fields[rel.localKey] = selfLinkArray[parentResourceIndex + 1];
	                    var parentLink = selfLinkArray.slice(0, parentResourceIndex + 2).join('/');
	                    metaData.WithRelationshipLink(rel.localField, exports.JSONAPI_PARENT_LINK, rel.relation, parentLink);
	                    return false;
	                }
	                return true;
	            });
	        }
	    };
	    JsonApiHelper.NormaliseLinkFormat = function (links) {
	        if (links) {
	            for (var link in links) {
	                if (links[link]) {
	                    var src = links[link];
	                    var newLink = new JsonApi.MetaLink(src.href || src.toString());
	                    newLink.meta = DSUTILS.deepMixIn(new JsonApi.Meta(), src.meta);
	                    links[link] = newLink;
	                }
	            }
	        }
	    };
	    JsonApiHelper.onInjectJsonApiData = function (resource, items) {
	        if (items) {
	            var def = new SerializationOptions(resource);
	            def.enumerateRelations(function (relationDef) {
	                if (typeof relationDef.load !== 'function') {
	                    relationDef.load = function (Resource, relationDef, instance, optionsOrig) {
	                        var meta = MetaData.TryGetMetaData(instance);
	                        if (meta) {
	                            var relatedLink = meta.getRelationshipLink(relationDef.localField, (relationDef.type === jsDataBelongsTo) ? exports.JSONAPI_PARENT_LINK : exports.JSONAPI_RELATED_LINK);
	                            if (relatedLink) {
	                                var options = DSUTILS.copy(optionsOrig);
	                                options.jsonApi = options.jsonApi || {};
	                                options.jsonApi.jsonApiPath = options.jsonApi.jsonApiPath || relatedLink.url;
	                                options.bypassCache = options.bypassCache || true;
	                                var childResourceDef = Resource.getResource(relationDef.relation);
	                                if (relationDef.type === jsDataBelongsTo || relationDef.type === jsDataHasOne) {
	                                    var relationId = options.jsonApi.jsonApiPath;
	                                    return childResourceDef.find(relationId, options).then(function (data) {
	                                        if (DSUTILS.isArray(data)) {
	                                            throw new Error('DSJsonApiAdapter, Load Relations expected non array');
	                                        }
	                                        if (relationDef.localKey) {
	                                            instance[relationDef.localKey] = DSUTILS.resolveId(childResourceDef, data);
	                                        }
	                                        else if (relationDef.foreignKey) {
	                                            data[relationDef.foreignKey] = DSUTILS.resolveId(childResourceDef, instance);
	                                        }
	                                        else if (options.error) {
	                                            options.error('DSJsonApiAdapter, load relations, relation does not have a key correctly defined', [relationDef]);
	                                        }
	                                    });
	                                }
	                                else {
	                                    var relationParam = { __jsDataJsonapi: options.jsonApi.jsonApiPath };
	                                    return childResourceDef.findAll(relationParam, options).then(function (data) {
	                                        if (!DSUTILS.isArray(data)) {
	                                            throw new Error('DSJsonApiAdapter, Load Relations expected array');
	                                        }
	                                        if (relationDef.localKeys) {
	                                            var localKeys = [];
	                                            DSUTILS.forEach(data, function (item) {
	                                                localKeys.push(DSUTILS.resolveId(childResourceDef, item));
	                                            });
	                                            instance[relationDef.localKeys] = localKeys;
	                                        }
	                                        else if (relationDef.foreignKey) {
	                                            var parentId = DSUTILS.resolveId(Resource, instance);
	                                            DSUTILS.forEach(data, function (item) {
	                                                item[relationDef.foreignKey] = parentId;
	                                            });
	                                        }
	                                        else if (options.error) {
	                                            options.error('DSJsonApiAdapter, load relations, onToMany relation does not have a keys correctly defined', [relationDef]);
	                                        }
	                                    });
	                                }
	                            }
	                        }
	                        else {
	                            return Promise.reject('DSJsonApiAdapter, Failed to load Relationship, no meta data');
	                        }
	                        throw new Error('Failed to load Relationship, relationship does not exist. ' +
	                            'Check your call to loadRelations that the relationship name is correct, or that your resource configuration matches your jsonApi data');
	                    };
	                    return true;
	                }
	            });
	            var dataList = DSUTILS.isArray(items) ? items : [items];
	            DSUTILS.forEach(dataList, function (data) {
	                JsonApiHelper.MergeMetaData(resource, data);
	                if (data['IsJsonApiReference'] === undefined) {
	                    var descriptor = {
	                        enumerable: false,
	                        writeable: false,
	                        get: function () {
	                            var meta = MetaData.TryGetMetaData(this);
	                            if (meta) {
	                                return meta.isJsonApiReference;
	                            }
	                            else {
	                                return null;
	                            }
	                        }
	                    };
	                    Object.defineProperty(data, 'IsJsonApiReference', descriptor);
	                }
	                if (data['findRelated'] === undefined) {
	                    var findRelatedFunction = function (relationName, options) {
	                        var containsReferences = false;
	                        var meta = MetaData.TryGetMetaData(this);
	                        if (meta && meta.isJsonApiReference === false) {
	                            if (this[relationName]) {
	                                if (DSUTILS.isArray(this[relationName])) {
	                                    DSUTILS.forEach(this[relationName], function (item) {
	                                        var relationItemMeta = MetaData.TryGetMetaData(item);
	                                        if (relationItemMeta.isJsonApiReference === true) {
	                                            containsReferences = true;
	                                            return false;
	                                        }
	                                    });
	                                }
	                                else {
	                                    var item = this[relationName];
	                                    var relationItemMeta = MetaData.TryGetMetaData(item);
	                                    if (relationItemMeta.isJsonApiReference === true) {
	                                        containsReferences = true;
	                                    }
	                                }
	                            }
	                            else {
	                                throw new Error('findRelated failed, Relationship name:' + relationName + ' does not exist.');
	                            }
	                            if (containsReferences === true || this[relationName] === undefined || (options && options.bypassCache === true)) {
	                                var relationshipMeta = meta.getRelationshipLink(relationName, exports.JSONAPI_RELATED_LINK);
	                                if (relationshipMeta) {
	                                    var parentResourceType = new SerializationOptions(resource);
	                                    var relation = parentResourceType.getChildRelationWithLocalField(relationshipMeta.type, relationName);
	                                    var childResource = parentResourceType.getResource(relation.relation);
	                                    var params = {};
	                                    var operationConfig = {
	                                        bypassCache: true,
	                                        jsonApi: { jsonApiPath: relationshipMeta.url }
	                                    };
	                                    return childResource.def().findAll(params, operationConfig);
	                                }
	                            }
	                            else {
	                                return DSUTILS.Promise.resolve(this[relationName]);
	                            }
	                        }
	                        else {
	                            throw Error('findRelated failed, this is a mode reference load via self link instead.');
	                        }
	                    };
	                    data['findRelated'] = findRelatedFunction;
	                }
	            });
	        }
	    };
	    ;
	    JsonApiHelper.beforeUpdateJsonApiData = function (resource, items, cb) {
	        var dataList = DSUTILS.isArray(items) ? items : [items];
	        DSUTILS.forEach(dataList, function (data) {
	            JsonApiHelper.MergeMetaData(resource, data);
	        });
	        if (cb) {
	            cb(null, items);
	        }
	        else {
	            return items;
	        }
	    };
	    ;
	    JsonApiHelper.afterLoadRelations = function (resource, items, cb) {
	        if (cb) {
	            cb(null, items);
	        }
	        else {
	            return items;
	        }
	    };
	    JsonApiHelper.AssignLifeTimeEvents = function (resource) {
	        resource.afterInject = JsonApiHelper.onInjectJsonApiData;
	        resource.beforeUpdate = JsonApiHelper.beforeUpdateJsonApiData;
	    };
	    return JsonApiHelper;
	}());
	exports.JsonApiHelper = JsonApiHelper;
	//# sourceMappingURL=JsonApiSerializer.js.map

/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";
	var JsonApiRequest = (function () {
	    function JsonApiRequest() {
	    }
	    JsonApiRequest.prototype.WithError = function (error) {
	        this.errors = this.errors || new Array();
	        this.errors.push(error);
	        return this;
	    };
	    JsonApiRequest.prototype.WithData = function (data) {
	        var d = this.data || new Array();
	        d.push(data);
	        this.data = d;
	        return this;
	    };
	    JsonApiRequest.prototype.WithSingleData = function (data) {
	        this.data = data;
	        return this;
	    };
	    JsonApiRequest.prototype.WithIncluded = function (data) {
	        this.included = this.included || new Array();
	        this.included.push(data);
	        return this;
	    };
	    JsonApiRequest.prototype.WithLink = function (linkType, uri) {
	        this.links = this.links || {};
	        this.links[linkType] = new MetaLink(uri);
	        return this;
	    };
	    JsonApiRequest.prototype.AddLink = function (linkType, link) {
	        this.links = this.links || {};
	        this.links[linkType] = link;
	        return this;
	    };
	    JsonApiRequest.prototype.WithMeta = function (key, value) {
	        this.meta = this.meta || new Meta();
	        this.meta[key] = value;
	        return this;
	    };
	    return JsonApiRequest;
	}());
	exports.JsonApiRequest = JsonApiRequest;
	var JsonApiData = (function () {
	    function JsonApiData(type) {
	        this.id = undefined;
	        this.type = type;
	        this.attributes = undefined;
	        this.links = undefined;
	        this.relationships = undefined;
	    }
	    JsonApiData.prototype.WithAttribute = function (key, value) {
	        this.attributes = this.attributes || {};
	        this.attributes[key] = value;
	        return this;
	    };
	    JsonApiData.prototype.AddLink = function (linkType, link) {
	        this.links = this.links || {};
	        this.links[linkType] = link;
	        return this;
	    };
	    JsonApiData.prototype.WithLink = function (linkType, uri) {
	        this.links = this.links || {};
	        this.links[linkType] = new MetaLink(uri);
	        return this;
	    };
	    JsonApiData.prototype.WithId = function (id) {
	        this.id = id;
	        return this;
	    };
	    JsonApiData.prototype.WithRelationship = function (relationName, relation) {
	        this.relationships = this.relationships || {};
	        this.relationships[relationName] = relation;
	        return this;
	    };
	    JsonApiData.prototype.GetSelfLink = function () {
	        if (this.links && this.links['self']) {
	            return this.links['self'].href;
	        }
	        else {
	            return null;
	        }
	    };
	    return JsonApiData;
	}());
	exports.JsonApiData = JsonApiData;
	var JsonApiRelationship = (function () {
	    function JsonApiRelationship(isArray) {
	        this.links = {};
	        if (isArray === true) {
	            this.data = new Array();
	        }
	        else {
	            this.data = null;
	        }
	    }
	    JsonApiRelationship.prototype.WithData = function (type, id) {
	        if (type && id) {
	            if (this.data && Array.isArray(this.data)) {
	                this.data.push(new JsonApiData(type).WithId(id));
	            }
	            else {
	                this.data = new JsonApiData(type).WithId(id);
	            }
	            return this;
	        }
	        else {
	            throw new Error('Invalid call to "JsonApiRelationship.WithData" type and id required');
	        }
	    };
	    JsonApiRelationship.prototype.AddLink = function (linkType, link) {
	        this.links[linkType] = link;
	        return this;
	    };
	    JsonApiRelationship.prototype.WithLink = function (linkType, url) {
	        this.links[linkType] = new MetaLink(url);
	        return this;
	    };
	    JsonApiRelationship.prototype.FindLinkType = function (linkType) {
	        return (this.links && this.links[linkType]) ? this.links[linkType].href : null;
	    };
	    return JsonApiRelationship;
	}());
	exports.JsonApiRelationship = JsonApiRelationship;
	var MetaLink = (function () {
	    function MetaLink(href, meta) {
	        this.href = href;
	        this.meta = meta || new Meta();
	    }
	    return MetaLink;
	}());
	exports.MetaLink = MetaLink;
	var Meta = (function () {
	    function Meta() {
	        this.fields = undefined;
	    }
	    return Meta;
	}());
	exports.Meta = Meta;
	var JsonApiError = (function () {
	    function JsonApiError() {
	    }
	    JsonApiError.prototype.AddLink = function (linkType, link) {
	        this.links[linkType] = link;
	        return this;
	    };
	    return JsonApiError;
	}());
	exports.JsonApiError = JsonApiError;
	var JsonApiVersion = (function () {
	    function JsonApiVersion() {
	    }
	    return JsonApiVersion;
	}());
	exports.JsonApiVersion = JsonApiVersion;
	//# sourceMappingURL=JsonApi.js.map

/***/ }
/******/ ])
});
;