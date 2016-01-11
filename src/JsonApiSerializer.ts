/// <reference path="../scripts/typings/js-data/js-data.d.ts" />
/// <reference path="JsonApi.ts" />

import JsonApi = require('./JsonApi');

//import JSDataLib = require('js-data');
//var jsdata: Function = require('js-data');

//const ISMODEL: string = "ISMODEL"; //Used during serialization to transform relationships
//const ISMODEL_REFERENCE: string = "ISMODEL_REFERENCE"; //Used during serialization to transform relationships   
const JSONAPI_META: string = '$_JSONAPIMETA_';
const JSONAPI_META_PARTIAL_LOAD: string = 'partialLoaded';
const jsonApiContentType: string = 'application/vnd.api+json';

const jsDataBelongsTo : string = 'belongsTo';
const jsDataHasMany: string = 'hasMany';
const jsDataHasOne: string = 'hasOne';

export var DSUTILS: JSData.DSUtil;


class ModelPlaceHolder {
    type: string;
    id: string;
    foreignKeyName: string;
    foreignKeyValue: string;

    constructor(type: string, id: string) {
        this.type = type;
        this.id = id;
    }

    WithForeignKey(name: string, value: string): ModelPlaceHolder {
        this.foreignKeyName = name;
        this.foreignKeyValue = value;
        return this;
    }
}


export class SerializationOptions {
    get type(): string { return this.resourceDef.name; };
    get idAttribute(): string { return this.resourceDef.idAttribute; };
    relationType(): string { return this.resourceDef['type']; };

    resourceDef: JSData.DSResourceDefinitionConfiguration;

    getResource(resourceName: string): SerializationOptions {
        var resource = this.resourceDef.getResource(resourceName);
        return resource ? new SerializationOptions(resource) : null;
    }

    getParentRelation(relationName?: string): JSData.RelationDefinition {
        if (this.resourceDef.relations && this.resourceDef.relations.belongsTo) {

            if (relationName) {
                return this.resourceDef.relations.belongsTo[relationName];
            }else {
                for (var r in this.resourceDef.relations.belongsTo) {
                    if (this.resourceDef.relations.belongsTo[r] && this.resourceDef.relations.belongsTo[r][0]) {
                        return this.resourceDef.relations.belongsTo[r][0];
                    }
                }
            }
        }

        return null;
    }
    getChildRelation(relationName: string): JSData.RelationDefinition {
        let relation = this.getChildRelations(relationName);
        return (relation && relation[0]) ? relation[0] : null;
    }

    private getChildRelations(relationName: string): Array<JSData.RelationDefinition>  {
        if (this.resourceDef.relations) {

            if (this.resourceDef.relations.hasOne) {
                if (this.resourceDef.relations.hasOne[relationName]) {
                    return this.resourceDef.relations.hasOne[relationName];
                }
            }

            if (this.resourceDef.relations.hasMany) {
                if (this.resourceDef.relations.hasMany[relationName]) {
                    return this.resourceDef.relations.hasMany[relationName];
                }
            }

            let relationlower = relationName.toLowerCase();
            let matchIndex = -1;
            let relationList = this.resourceDef['relationlist'];
            DSUTILS.forEach<JSData.RelationDefinition>(relationList, (relation: JSData.RelationDefinition, index: number) => {
                if (relation.type === jsDataHasMany || relation.type === jsDataHasOne) {
                    if (relationlower === relation.relation) {
                        matchIndex = index;
                        return false;
                    }
                }
            });

            if (matchIndex !== -1) {
                LogInfo('Relation Case Insensitive match made of ' + relationName, [relationList[matchIndex]]);
                return relationList[matchIndex];
            }
        }

        return null;
    }

    constructor(def: JSData.DSResourceDefinitionConfiguration) {
        this.resourceDef = def;
    }
}

class DeSerializeResult {
    data: any;
    response: JsonApi.JsonApiRequest;

    constructor(data: any, response: JsonApi.JsonApiRequest) {
        this.data = data;
        this.response = response;
    }
}

function LogInfo(message: string, options: any[] = undefined): void {
    if (console) {
        var c: Console = console;
        c.log(message, options);
    }
}

function LogWarning(message: string, options: any[] = undefined): void {
    if (console) {
        var c: Console = console;
        c.warn(message, options);
    }
}


export class JsonApiHelper {

    // Checks if a response contains a header that matches value.
    // The comparison is case insensitive, which is a REQUIREMENT
    // of http headers but is not implemented by angular.
    private static ContainsHeader(headers: { [name: string]: string }, header: string, value: string) {
        //var headers: { [name: string]: string } = response.headers();
        for (var key in headers) {
            if (key.toLocaleLowerCase() === header.toLocaleLowerCase()) {
                var h: string = headers[key];
                if (h.toLocaleLowerCase().indexOf(value) > -1) {
                    return true;
                }
            }
        }

        return false;
    }

    public static ContainsJsonApiContentTypeHeader(headers: { [name: string]: string }): boolean {
        return JsonApiHelper.ContainsHeader(headers, 'Content-Type', jsonApiContentType);
    }

    public static AddJsonApiContentTypeHeader(headers: { [name: string]: string }): void {
        //if (!headers['Content-Type'])
            headers['Content-Type'] = jsonApiContentType;
        //else {}
    }

    public static AddJsonApiAcceptHeader(headers: { [name: string]: string }): void {
        headers['Accept'] = jsonApiContentType;
    }

    public static FromJsonApiError(response: JsonApi.JsonApiRequest): JsonApi.JsonApiRequest {
        var responseObj: JsonApi.JsonApiRequest;
        if (response.errors) {
            responseObj = new JsonApi.JsonApiRequest();
            if (DSUTILS.isArray(response.errors)) {
                DSUTILS.forEach(response.errors, (item: JsonApi.JsonApiError) => {
                    responseObj.WithError(DSUTILS.deepMixIn(new JsonApi.JsonApiError(), item));
                });
            } else {
                responseObj.WithError(DSUTILS.deepMixIn(new JsonApi.JsonApiError(), response.errors));
            }
        } else {
            responseObj = JsonApiHelper.CreateInvalidResponseError(response);
        }
        return responseObj;
    }
    // Serialize js-data object as JsonApi request
    public static Serialize(options: SerializationOptions, contents: any): JsonApi.JsonApiRequest {
        var result = new JsonApi.JsonApiRequest();
        if (DSUTILS.isArray(contents)) {
            //Add Data as array
            DSUTILS.forEach(contents, (item: Object) => {
                result.WithData(this.ObjectToJsonApiData(options, item));
            });
        } else {
            // Not sire this is really necessary can just always send and array ?
            result.data = <any>this.ObjectToJsonApiData(options, contents);
        }
        return result;
    }

    // DeSerialize  Json Api reponse into js-data friendly object graph
    public static DeSerialize(options: SerializationOptions, response: JsonApi.JsonApiRequest): DeSerializeResult {
        // Array of deserialized objects as a js-data friendly object graph  
        var newResponse = new JsonApi.JsonApiRequest();

        // Required data
        if (response.data) {
            if (response.links) {
                this.NormaliseLinkFormat(response.links);
                for (var link in response.links) {
                    if (response.links[link]) {
                        newResponse.AddLink(link, response.links[link]);
                    }
                }
            }

            if (DSUTILS.isArray(response.included)) {
                DSUTILS.forEach(response.included, (item: JsonApi.JsonApiData) => {
                    this.NormaliseLinkFormat(item.links);

                    for (var relation in item.relationships) {
                        if (item.relationships[relation]) {
                            this.NormaliseLinkFormat(item.relationships[relation].links);
                        }
                    }

                    // Add JsonApiData
                    newResponse.WithIncluded(DSUTILS.deepMixIn(new JsonApi.JsonApiData('', ''), item));
                });
            }

            // JSON API Specifies that a single data object be returned as an object where as data from a one to many should always be returned in an array.
            if (DSUTILS.isArray(response.data)) {
                DSUTILS.forEach(response.data, (item: JsonApi.JsonApiData) => {

                    this.NormaliseLinkFormat(item.links);

                    for (var relation in item.relationships) {
                        if (item.relationships[relation]) {
                            this.NormaliseLinkFormat(item.relationships[relation].links);
                        }
                    }
                    // Add JsonApiData
                    newResponse.WithData(DSUTILS.deepMixIn(new JsonApi.JsonApiData('', ''), item));
                });
            } else {
                this.NormaliseLinkFormat((<any>response.data).links);
                newResponse.WithData(DSUTILS.deepMixIn(new JsonApi.JsonApiData('', ''), <any>response.data));
            }
        }

        //------ Original algorithum ------------
        // var responseDataArray = new Array();
        // JSON API Specifies that a single data object be returned as an object where as data from a one to many should always be returned in an array.
        //if (DSUTILS.isArray(newResponse.data)) {
        //    DSUTILS.forEach(newResponse.data, (item) => {
        //        var obj = this.DataToObject(options, newResponse, item, 0);
        //        responseDataArray.push(obj);
        //    });
        //} else {
        //    var obj = this.DataToObject(options, newResponse, (<any>newResponse.data), 0);
        //    responseDataArray.push(obj);
        //}
        //return new DeSerializeResult(responseDataArray, newResponse);
        //---------------------------------------


        //------ New algorithum ------------
        //var data = {};
        //var included = {};
        //[1] Deserialize all data        
        //[2] Deserialize all included data
        //[3] Iterate over inclued data relationships set ro reference other included data.
        //[4] Iterate over data relationships and set to reference included data if available. 
        var data = {};
        var included = {};
        DSUTILS.forEach(newResponse.data, (item: JsonApi.JsonApiData) => {
            data[item.type] = data[item.type] || {};
            data[item.type][item.id] = this.DeserializeJsonApiData(options, item);
        });

        DSUTILS.forEach(newResponse.included, (item: JsonApi.JsonApiData) => {
            included[item.type] = included[item.type] || {};
            included[item.type][item.id] = this.DeserializeJsonApiData(options.getResource(item.type), item);
        });

        // Replace data references with included data where available
        var flatternedData = [];
        for (var dataType in data) {
            if (data[dataType]) {
                for (var dataId in data[dataType]) {
                    if (data[dataType][dataId]) {
                        var dataObject = data[dataType][dataId];

                        for (var prop in dataObject) {
                            if (DSUTILS.isArray(dataObject[prop])) {
                                DSUTILS.forEach(dataObject[prop], (item: ModelPlaceHolder, index: number, source: Array<ModelPlaceHolder>) => {
                                    //If included or data contains the reference we are looking for then use it
                                    let newItem = included[item.type] ? included[item.type][item.id] : (data[item.type] ? data[item.type][item.id] : null);
                                    if (newItem) {
                                        // This is a fully loaded json api reference
                                        newItem[JSONAPI_META] = {};
                                        newItem[JSONAPI_META][JSONAPI_META_PARTIAL_LOAD] = false;

                                        // Apply foreign key to js-data object 
                                        if (item.foreignKeyName) {
                                            newItem[item.foreignKeyName] = item.foreignKeyValue;
                                        }

                                        // Replace item in array with data from included or data, data
                                        source[index] = newItem;
                                    } else {
                                        // Is is possible to store arrays in js-data that are not related items?
                                        if (!DSUTILS.isString(item)) {
                                            // Replace item in array with plain object, but with Primary key or any foreign keys set                                    
                                            var itemOptions = options.getResource(item.type);

                                            let newItem = <any>{};
                                            newItem[JSONAPI_META] = {};
                                            newItem[JSONAPI_META][JSONAPI_META_PARTIAL_LOAD] = true;
                                            newItem[itemOptions.idAttribute] = item.id;

                                            // Apply foreign key to js-data object 
                                            if (item.foreignKeyName) {
                                                newItem[item.foreignKeyName] = item.foreignKeyValue;
                                            }

                                            // Replace item in array with data from included or data, data
                                            source[index] = newItem;
                                        }
                                    }
                                });
                            }
                        }
                        flatternedData.push(dataObject);
                    }
                }
            }
        }
        return new DeSerializeResult(flatternedData, newResponse);
    }


    private  static CreateErrorResponse(title: string, detail: string): JsonApi.JsonApiRequest {
        var response = new JsonApi.JsonApiRequest();
        var e = new JsonApi.JsonApiError();
        e.title = title;
        e.detail = detail;
        response.WithError(e);

        return response;
    }

    private  static CreateNoResponseError() {
        var responseObj = new JsonApi.JsonApiRequest();

        var e = new JsonApi.JsonApiError();
        e.title = 'No response from server';
        e.detail = e.title;
        responseObj.WithError(e);

        return responseObj;
    }

    private static CreateInvalidResponseError(response: any) {
        var responseObj = new JsonApi.JsonApiRequest();

        var e = new JsonApi.JsonApiError();
        e.title = 'Invalid response';
        e.detail = 'Response is incorrectly formed: ' + JSON.stringify(response);
        responseObj.WithError(e);

        return responseObj;
    }


    // Convert js-data object to JsonApi request
    private static ObjectToJsonApiData(options: SerializationOptions, contents: Object): JsonApi.JsonApiData {

        if (!options.type) {
            throw new Error('Type required within options');
        }

        var data = new JsonApi.JsonApiData(
            (contents[options.idAttribute] || '').toString(), //JsonApi id is always a string
            options.type);

        for (var prop in contents) {
            if (prop === options.idAttribute || prop === 'type' || prop === 'Type') {
                continue;
            }


            if (contents[prop] !== null) {
                var childRelation = options.getChildRelation(prop);

                if (DSUTILS.isArray(contents[prop])) {
                    // To many relation                    
                    if (childRelation) {
                    //if (contents[prop][0] && contents[prop][0].hasOwnProperty(ISMODEL)) {

                        var relationType = childRelation.type || 'MissingRelationType';
                        if (relationType !== jsDataHasMany) {
                            throw new Error('Data aray encountered, expected this to be a to have a hasMany relationship defined in JSData but found, ' + relationType);
                        }

                        var resourceDef = options.getResource(childRelation.relation);

                        //This is a relationship so add data as relationsship as apposed to inling data structure                        
                        var relationship = new JsonApi.JsonApiRelationship();
                        DSUTILS.forEach(contents[prop], (item: any) => {
                            var type = resourceDef.type;
                            var id = item[resourceDef.idAttribute];
                            relationship.WithData(type, id);
                        });

                        data.WithRelationship(prop, relationship);

                    } else {
                        // Add inline data struture / array
                        data.WithAttribute(prop, contents[prop]);
                    }
                } else if (childRelation) {
                    var resourceDef = options.getResource(childRelation.relation);

                    var type = childRelation.type;
                    var id = contents[resourceDef.idAttribute];

                    var relation = new JsonApi.JsonApiRelationship();
                    relation.data = <any>new JsonApi.JsonApiData(id, type);

                    if (childRelation.type === jsDataHasMany) {
                        data.WithRelationship(prop, relation);
                    } else {
                        data.relationships[prop] = relation;
                    }
                } else {
                    data.WithAttribute(prop, contents[prop]);
                }
            } else {
                LogWarning('Unexpected null value in ObjectToData()', [prop]);
            }
        }
        return data;
    }

    // Convert a JsonApi response into an object graph that can be used by js-data
    // One of the main conversions reqired here is to add in ParentIds to child objects so that js-data toMany and toOne relationships work correctly
    private static DeserializeJsonApiData(options: SerializationOptions, data: JsonApi.JsonApiData): Object {
        if (!options) {
            throw new Error('Missing Serialization Options, indicates possible missing jsData resource: ' + data.type);
        }

        // We start off by taking all jsonapi attributes
        var fields = DSUTILS.copy(data.attributes || {});

        // Set Id and Type attributes required by js-data, uses different casing than js-data
        if (data.id) {
            fields[options.idAttribute] = data.id.toString();
        } else {
            throw new Error('Missing required "id" property in JsonApi response');
        }

        //Keep type and 
        if (data.type) {
            //fields['type'] = data.type;
        } else {
            throw new Error('Missing required "type" property in JsonApi response');
        }

        // If the object has any belongs to relations extract parent id and set on object
        JsonApiHelper.setParentIds(options, data, fields);

        //options.resourceDef.ignoredChanges([JSONAPI_META]);
        options.resourceDef.beforeInject = (resource: JSData.DSResourceDefinition<any>, dataList: any): void => {
            // Merge a json api reference with a fully populated resource that has been previously retrieved
            DSUTILS.forEach<any>(dataList, (data: any) => {
                var res = resource.get(data[resource.idAttribute]);
                if (res) {
                    // This is an update the resource should always exist!!
                    var resourceFullyLoaded = (res && res[JSONAPI_META]) ? (res[JSONAPI_META][JSONAPI_META_PARTIAL_LOAD] || false) : false;
                    var dataFullyLoaded = (data && data[JSONAPI_META]) ? (data[JSONAPI_META][JSONAPI_META_PARTIAL_LOAD] || false) : false;

                    if (resourceFullyLoaded === dataFullyLoaded) {
                        // if they are either both fully loaded or both not fully loaded then continue with current data

                    } else {
                        // This SHOULD alsways be set but just in case will be extra cautious!!
                        data[JSONAPI_META] = data[JSONAPI_META] || {};

                        // If resource is already fully loaded then do not reset flag!!
                        data[JSONAPI_META][JSONAPI_META_PARTIAL_LOAD] = (resourceFullyLoaded || dataFullyLoaded);

                        // see: http://www.js-data.io/docs/dsdefaults#onconflict, onConflict default value is merge
                        // NOT sure if this is necessary. Not sure if jsdata updates be merging e.g. doing this or by replacing?
                        //if (resourceFullyLoaded === true && dataFullyLoaded == false) {
                        //    DSUTILS.deepMixIn(data, res);
                        //}

                        LogInfo('beforeInject called onresource:', [resource.name]);

                    }
                }

            });
        };

        options.resourceDef.beforeUpdate = (resource: JSData.DSResourceDefinition<any>, data: any, cb: (err: Error, data: any) => void): void => {

            // Merge a json api reference with a fully populated resource that has been previously retrieved
            var res = resource.get(data[resource.idAttribute]);
            if (res) {
                // This is an update the resource should always exist!!
                var resourceFullyLoaded = (res && res[JSONAPI_META]) ? (res[JSONAPI_META][JSONAPI_META_PARTIAL_LOAD] || false) : false;
                var dataFullyLoaded = (data && data[JSONAPI_META]) ? (data[JSONAPI_META][JSONAPI_META_PARTIAL_LOAD] || false) : false;

                // if they are either both fully loaded or both not fully loaded then continue with current data
                if (resourceFullyLoaded !== dataFullyLoaded) {
                    // This SHOULD alsways be set but just in case will be extra cautious!!
                    data[JSONAPI_META] = data[JSONAPI_META] || {};

                    // If resource is already fully loaded then do not reset flag!!
                    data[JSONAPI_META][JSONAPI_META_PARTIAL_LOAD] = (resourceFullyLoaded || dataFullyLoaded);

                    // see: http://www.js-data.io/docs/dsdefaults#onconflict, onConflict default value is merge
                    // NOT sure if this is necessary. Not sure if jsdata updates be merging e.g. doing this or by replacing?
                    //if (resourceFullyLoaded === true && dataFullyLoaded == false) {
                    //    DSUTILS.deepMixIn(data, res);
                    //}
                }
            }

            LogInfo('beforeUpdate called onresource:', [resource.name]);
            cb(null, data);
        };


        //Get each child relationship
        for (var relationName in data.relationships) {
            if (data.relationships[relationName]) {
                // here js-data relation name <==> js-data relation
                var relationship = data.relationships[relationName];

                if (relationship.data) {
                    var relationshipDef = options.getChildRelation(relationName);

                    if (!relationshipDef) {
                        throw new Error(
                            'MISSING: Relationship definition on js-data resource, Name:' + options.type +
                            ', failed to load relationship named: ' + relationName +
                            '.Your js-data store configuration does not match your jsonapi data structure');
                    }

                    // hasMany uses 'localField' and "localKeys" or "foreignKey"
                    // hasOne uses "localField" and "localKey" or "foreignKey"
                    var localField = relationshipDef.localField;
                    var localKeys = relationshipDef.localKeys;
                    var localKey = relationshipDef.localKey;
                    var relationType = relationshipDef.type; //hasOne or hasMany
                    var foreignKey = relationshipDef.foreignKey;

                    if (!localField) {
                        throw new Error(
                            'ERROR: Incorrect js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + relationshipDef.relation +
                            'relationship requires "localField" parameter to be configured');
                    }

                    if (relationType === jsDataHasMany) {
                        if (!(foreignKey || relationshipDef.localKeys)) {
                            throw new Error(
                                'ERROR: Incorrect js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + relationshipDef.relation +
                                'A "hasMany" relationship requires either "foreignKey" or "localKeys" to be configured');
                        }
                    } else {
                        if (!(foreignKey || relationshipDef.localKey)) {
                            throw new Error(
                                'ERROR: Incorrect js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + relationshipDef.relation +
                                'A "hasOne" relationship requires either "foreignKey" or "localKey" to be configured');
                        }
                    }

                    var localKeysList = new Array<string>();
                    // From each relationship, get the data IF it is an array
                    if (DSUTILS.isArray(relationship.data)) {

                        var relatedItems = new Array<Object>();
                        DSUTILS.forEach(relationship.data, (item: JsonApi.JsonApiData) => {
                            var id = item.id;
                            var type = item.type;

                            localKeysList.push(id);

                            let relatedItem = new ModelPlaceHolder(type, id);
                            if (relationshipDef.foreignKey) {
                                relatedItem.WithForeignKey(foreignKey, data.id);
                            }

                            relatedItems.push(relatedItem);
                        });


                        // Store related local keys for toMany related items relationship
                        fields[localField] = relatedItems;

                        // Configure js-data relations
                        if (!relationshipDef.foreignKey) {
                            // hasOne uses localKey has many uses localKeys
                            var key = (relationType === jsDataHasMany) ? relationshipDef.localKeys : relationshipDef.localKey;
                            fields[key] = localKeysList; //Set localKeys on Parent                        
                        }
                    } else {
                        // If data is not an array then set a single item.
                        let data: JsonApi.JsonApiData = (<any>relationship.data);
                        var id = data.id;
                        var type = data.type;

                        localKeysList.push(id);

                        let relatedItem = new ModelPlaceHolder(type, id);
                        if (relationshipDef.foreignKey) {
                            relatedItem.WithForeignKey(foreignKey, data.id);
                        }

                        if (!relationshipDef.foreignKey) {
                            if (relationshipDef.type === jsDataHasOne) {
                                // Store related local keys for toMany related items relationship
                                fields[localField] = relatedItem;
                            } else {
                                // Store related local keys for toMany related items relationship
                                fields[localField] = [relatedItem];
                            }

                            // hasOne uses localKey hasMany uses localKeys
                            fields[(relationshipDef.localKeys || relationshipDef.localKey)] = localKeysList; //Set localKeys on Parent
                        }
                    }
                }
            }
        }
        return fields;
    }

    /**
        * Adds ParentID fields to the data provided.
        * The ParentIDs are retrieved from the self 
        * links in the links object provided.
        * This will modify the response object.
        */
    private static setParentIds(options: SerializationOptions, data: JsonApi.JsonApiData, fields: any) {
        // This object belongs to a parent thensearch backwards in url for the 
        // parent resource and then the next field we assume contains the parent reource id
        // e.g. api/Parent/1/Children        
        var parentRel = options.getParentRelation();
        if (parentRel) {
            let relationSet = false;
            // If Type is set and it has links and links has a self link
            if (data.type && data.GetSelfLink && data.GetSelfLink()) {

                var parentName = parentRel.relation;
                // Get parent local key or use default naming convention.
                // TODO : look up foreign key on parent config
                var localKey = parentRel.localKey || (parentName + 'Id');

                var selfLinkArray = data.GetSelfLink().split('/');
                var parentResourceIndex = selfLinkArray.lastIndexOf(parentName);
                if (parentResourceIndex > 0) {
                    fields[localKey] = selfLinkArray[parentResourceIndex + 1]; // Set Parent Id
                }

                relationSet = true;
            } else {
                LogWarning('Resource ' +  options.type + ' has a "belongsTo" relation but is missing a self link and so its parent relation can not be set');
            }
        }
    }

    /**
        * @name NormaliseLinkFormat
        * @desc Normalise links they can be defined in either short form or long form!!
        * @param {Oject} links Maybe an array of links
        * @memberOf JsonApiHelper
        */
    private static NormaliseLinkFormat(links: Object) {
        if (links) {
            // Normalise links they can be defined in either short form or long form!!
            for (var link in links) {
                if (links[link]) {
                    let src = links[link];
                    let newLink = new JsonApi.MetaLink(src.href || (<any>src).toString());
                    newLink.meta = src.meta;

                    //newResponse.WithLink(link, newLink);
                    //links[link] = DSUTILS.copy(newLink);

                    links[link] = newLink;
                }
            }
        }
    }
}
