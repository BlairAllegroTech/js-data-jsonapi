/// <reference path="../scripts/typings/js-data/js-data.d.ts" />
/// <reference path="../scripts/typings/js-data/JsonApiAdapter.d.ts" />
/// <reference path="JsonApi.ts" />

import JSDataLib = require('js-data');
import JsonApi = require('./JsonApi');

//import JSDataLib = require('js-data');
//var jsdata: Function = require('js-data');

//const ISMODEL: string = "ISMODEL"; //Used during serialization to transform relationships
//const ISMODEL_REFERENCE: string = "ISMODEL_REFERENCE"; //Used during serialization to transform relationships   
const JSONAPI_META: string = '$_JSONAPIMETA_';
const jsonApiContentType: string = 'application/vnd.api+json';
export const JSONAPI_RELATED_LINK: string = 'related';
export const JSONAPI_PARENT_LINK: string = 'parent';

const jsDataBelongsTo : string = 'belongsTo';
const jsDataHasMany: string = 'hasMany';
const jsDataHasOne: string = 'hasOne';



let DSUTILS: JSData.DSUtil = JSDataLib['DSUtils'];

/**
* @name IJSDataManyToManyMeta
* @desc Type def for custom meta data used to tag many-to-many relations in jsdata config
*/
interface IJSDataManyToManyMeta {
    /**
    * @name type
    * @desc JsData data type of foreign type that we are joining to
    */
    type: string;

    /**
    * @name joinType
    * @desc The JsData type name for the joining table used to join many to many data
    */
    joinType: string;
}

class MetaLinkDataImp implements JsonApiAdapter.MetaLinkData {
    type: string;
    url: string;
    meta: any;
    constructor(type: string, url: string) {
        this.type = type;
        this.url = url;
    }
}



export class MetaData implements JsonApiAdapter.JsonApiMetaData {
    selfType: string;
    selfLink: string;
    isJsonApiReference: boolean;
    relationships: { [relation: string]: JsonApiAdapter.MetaLink };
    links: { [link: string]: JsonApiAdapter.MetaLinkData };
    private referenceCount: number;

    constructor(type: string) {
        this.selfType = type;
        this.selfLink = null;
        this.isJsonApiReference = true;
        this.relationships = {};
        this.links = {};
        this.referenceCount = 0;
    }

    /**
        * @name getPath
        * @desc Override DSHttpAdapter get path to use stored JsonApi self link if available
        * @param {string} relationName The name or rel attribute of relationship
        * @param {string} linkType, related, self etc..
        * @param {string} url Link url
        * @return {MetaData} this e.g. fluent method 
        * @memberOf MetaData
    **/
    WithRelationshipLink(relationName: string, linkType: string, dataType: string, url: string): MetaData {
        this.relationships[relationName] = this.relationships[relationName] || {};
        this.relationships[relationName][linkType] = new MetaLinkDataImp(dataType, url);
        return this;
    }

    WithLink(linkName: string, url: string, meta: any): MetaData {
        var link = new MetaLinkDataImp(linkName, url);
        link.meta = meta;
        this.links[linkName] = link;
        return this;
    }

    getLinks(linkName: string): JsonApiAdapter.MetaLinkData {
        return this.links[linkName];
    }

    incrementReferenceCount(): number {
        this.referenceCount++;
        return this.referenceCount;
    }

    public getRelationshipLink(relationName: string, linkType: string): JsonApiAdapter.MetaLinkData {
        if (this.relationships[relationName]) {
            return this.relationships[relationName][linkType];
        } else {
            return undefined;
        }
    }

    static TryGetMetaData(obj: Object): MetaData {
        if (obj) {
            return DSUTILS.get<MetaData>(obj, JSONAPI_META);
        } else {
            return undefined;
        }
    }


}

class ModelPlaceHolder {
    type: string;
    id: string;

    foreignType: string;
    foreignKeyName: string;
    foreignKeyValue: string;

    constructor(type: string, id: string) {
        this.type = type;
        this.id = id;

        if (!type || !id) {
            throw new Error('Type or Id missing');
        }
    }

    WithForeignKey(keyName: string, keyValue: string, keyType: string): ModelPlaceHolder {
        this.foreignKeyName = keyName;
        this.foreignKeyValue = keyValue;
        this.foreignType = keyType;
        return this;
    }
}


export class SerializationOptions {
    get type(): string { return this.resourceDef.name; };
    get idAttribute(): string { return this.resourceDef.idAttribute; };
    relationType(): string { return this.resourceDef['type']; };

    constructor(def: JSData.DSResourceDefinitionConfiguration) {
        this.resourceDef = def;
    }

    private resourceDef: JSData.DSResourceDefinitionConfiguration;

    def(): JSData.DSResourceDefinitionConfiguration {
        return this.resourceDef;
    }

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

    getParentRelationByLocalKey(localKey: string): JSData.RelationDefinition {
        var match: JSData.RelationDefinition = null;
        if (this.resourceDef.relations && this.resourceDef.relations.belongsTo) {
            for (var r in this.resourceDef.relations.belongsTo) {
                if (this.resourceDef.relations.belongsTo[r]) {
                    DSUTILS.forEach(this.resourceDef.relations.belongsTo[r], (relation: JSData.RelationDefinition) => {
                        if (relation.localKey === localKey) {
                            match = relation;
                            return false;
                        }
                    });
                }
            }
        }
        return match;
    }

    getParentRelationByLocalField(localField: string): JSData.RelationDefinition {
        var match: JSData.RelationDefinition = null;
        if (this.resourceDef.relations && this.resourceDef.relations.belongsTo) {
            for (var r in this.resourceDef.relations.belongsTo) {
                if (this.resourceDef.relations.belongsTo[r]) {
                    DSUTILS.forEach(this.resourceDef.relations.belongsTo[r], (relation: JSData.RelationDefinition) => {
                        if (relation.localField === localField) {
                            match = relation;
                            return false;
                        }
                    });
                }
            }
        }
        return match;
    }

    /**
     * @name getChildRelation
     * @desc Get the child relationship for a resorce of a given type defined by relationType, 
     *  NOTE: Their can be more than one relation of a type. This just returns the first, or null if non found
     * @param relationType The relationship type to find
     */
    getChildRelation(relationType: string): JSData.RelationDefinition {
        let relation = this.getChildRelations(relationType);
        return (relation && relation[0]) ? relation[0] : null;
    }

     /**
     * @name getChildRelationWithLocalField
     * @desc Given the relationType, find relationship by localFielName name
     * @param relationType The type the relationship represents
     * @param localFieldName The local field name for the relationship, incase there is more than one relationship on the object of the given type
        */
    getChildRelationWithLocalField(relationType: string, localFieldName: string): JSData.RelationDefinition {
        let relations = this.getChildRelations(relationType);

        var match: JSData.RelationDefinition = null;
        DSUTILS.forEach(relations, (relation: JSData.RelationDefinition) => {
            if (relation.localField === localFieldName) {
                match = relation;

                // Exit the for loop
                return false;
            }
        });
        return match;
    }

    /**
     * @name getChildRelationWithForeignKey
     * @desc Given the relationType, find relationship by foreignKey name
     * @param relationType The type the relationship represents
     * @param foreignKeyName Theforeign key name for the relationship, incase there is more than one relationship on the object of the given type
     */
    getChildRelationWithForeignKey(relationType: string, foreignKeyName: string): JSData.RelationDefinition {
        let relations = this.getChildRelations(relationType);

        var match: JSData.RelationDefinition = null;
        DSUTILS.forEach(relations, (relation: JSData.RelationDefinition) => {
            if (relation.foreignKey === foreignKeyName) {
                match = relation;
                return false;
            }
        });
        return match;
    }



    //Find relationship by relationship name
    private getChildRelations(relationType: string): Array<JSData.RelationDefinition>  {
        if (this.resourceDef.relations) {

            if (this.resourceDef.relations.hasOne) {
                if (this.resourceDef.relations.hasOne[relationType]) {
                    return this.resourceDef.relations.hasOne[relationType];
                }
            }

            if (this.resourceDef.relations.hasMany) {
                if (this.resourceDef.relations.hasMany[relationType]) {
                    return this.resourceDef.relations.hasMany[relationType];
                }
            }

            let relationlower = relationType.toLowerCase();
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
                LogInfo('Relation Case Insensitive match made of ' + relationType, [relationList[matchIndex]]);
                return relationList[matchIndex];
            }
        }

        return null;
    }

    //Find relationship by localField
    //private getChildRelationWithLocalField(relationType:string, localFieldName: string): JSData.RelationDefinition {
    //    var match: JSData.RelationDefinition = null;

    //    if (this.resourceDef.relations) {
    //        if (this.resourceDef.relations.hasOne) {
    //            for (var resourceType in this.resourceDef.relations.hasOne) {
    //                if (this.resourceDef.relations.hasOne[resourceType]) {
    //                    DSUTILS.forEach(this.resourceDef.relations.hasOne[resourceType], (relationDef: JSData.RelationDefinition) => {
    //                        if (relationDef.localField && relationDef.localField === localFieldName) {
    //                            match = relationDef;
    //                            return false;
    //                        }
    //                    });
    //                }
    //            }
    //        }

    //        if (!match && this.resourceDef.relations.hasMany) {
    //            for (var resourceType in this.resourceDef.relations.hasMany) {
    //                if (this.resourceDef.relations.hasMany[resourceType]) {
    //                    DSUTILS.forEach(this.resourceDef.relations.hasMany[resourceType], (relationDef: JSData.RelationDefinition) => {
    //                        if (relationDef.localField && relationDef.localField === localFieldName) {
    //                            match = relationDef;
    //                            return false;
    //                        }
    //                    });
    //                }
    //            }
    //        }

    //        if (!match) {
    //            let localFieldNamelower = localFieldName.toLowerCase();
    //            let relationList = this.resourceDef['relationlist'];

    //            DSUTILS.forEach<JSData.RelationDefinition>(relationList, (relation: JSData.RelationDefinition) => {
    //                if (relation.type === jsDataHasMany || relation.type === jsDataHasOne) {

    //                    if (relation.localField && relation.localField === localFieldName) {
    //                        //if (relationlower === relation.relation) {
    //                        match = relation;
    //                        return false;
    //                    }
    //                }
    //            });

    //            if (match) {
    //                LogInfo('Relation Case Insensitive match made of ' + localFieldName, [match]);
    //            }
    //        }
    //    }

    //    return match;
    //}
}

class DeSerializeResult {
    data: any;
    response: JsonApi.JsonApiRequest;

    constructor(data: any, response: JsonApi.JsonApiRequest) {
        this.data = data;
        this.response = response;
    }
}

function LogInfo(message: string, data: any[] = undefined): void {
    if (console) {
        var c: Console = console;
        c.log(message, data);
    }
}

function LogWarning(message: string, data: any[] = undefined): void {
    if (console) {
        var c: Console = console;
        c.warn(message, data);
    }
}


export class JsonApiHelper {
    /*
    @Merge Meta data from newly recieved 'data with that of cached data from datastore
    */
    private static MergeMetaData(res: JSData.DSResourceDefinition<any>, data: Object) {
        if (res) {
            var dataMeta = MetaData.TryGetMetaData(data);
            if (!dataMeta) {
                throw new Error('MergeMetaData failed, target object missing meta data Type:' + res.name);
            } else {

                let id = data[res.idAttribute];
                var exiting = res.get(id);

                if (exiting) {
                    var existingMeta = MetaData.TryGetMetaData(exiting);
                    if (existingMeta) {
                        dataMeta.isJsonApiReference = dataMeta.isJsonApiReference || existingMeta.isJsonApiReference;
                    }
                }

                // NOTE : This did not do what it was supposed to do...
                // Just skip for now
                // Should compare new object to existing and update metadata
                // If resource is already fully loaded then do not reset flag!!
                //dataMeta.isJsonApiReference = dataFullyLoaded;

                // see: http://www.js-data.io/docs/dsdefaults#onconflict, onConflict default value is merge
                // NOT sure if this is necessary. Not sure if jsdata updates be merging e.g. doing this or by replacing?
                //if (resourceFullyLoaded === true && dataFullyLoaded == false) {
                //    DSUTILS.deepMixIn(data, res);
                //}
            }
        }
    }

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
        headers['Content-Type'] = jsonApiContentType;
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
            // Not sure this is really necessary could just always send an array ?
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

            if (DSUTILS.isArray(response.included)) {
                DSUTILS.forEach(response.included, (item: JsonApi.JsonApiData) => {
                    this.NormaliseLinkFormat(item.links);

                    for (var relation in item.relationships) {
                        if (item.relationships[relation]) {
                            this.NormaliseLinkFormat(item.relationships[relation].links);
                            var isArray = DSUTILS.isArray( item.relationships[relation].data );
                            item.relationships[relation] = DSUTILS.deepMixIn(new JsonApi.JsonApiRelationship(isArray), item.relationships[relation]);
                        }
                    }

                    // Add JsonApiData
                    newResponse.WithIncluded(DSUTILS.deepMixIn(new JsonApi.JsonApiData('unknown'), item));
                });
            }

            // JSON API Specifies that a single data object be returned as an object where as data from a one to many should always be returned in an array.
            if (DSUTILS.isArray(response.data)) {
                DSUTILS.forEach(response.data, (item: JsonApi.JsonApiData) => {

                    this.NormaliseLinkFormat(item.links);

                    for (var relation in item.relationships) {
                        if (item.relationships[relation]) {
                            this.NormaliseLinkFormat(item.relationships[relation].links);
                            var isArray = DSUTILS.isArray(item.relationships[relation].data);
                            item.relationships[relation] = DSUTILS.deepMixIn(new JsonApi.JsonApiRelationship(isArray), item.relationships[relation]);
                        }
                    }
                    // Add JsonApiData
                    newResponse.WithData(DSUTILS.deepMixIn(new JsonApi.JsonApiData(''), item));
                });
            } else {
                this.NormaliseLinkFormat((<any>response.data).links);
                newResponse.WithData(DSUTILS.deepMixIn(new JsonApi.JsonApiData(''), <any>response.data));
            }
        }
        if (response.links) {
            this.NormaliseLinkFormat(response.links);

            // We need somewhere global to store these link!!
            for (var link in response.links) {
                if (response.links[link]) {
                    newResponse.AddLink(link, response.links[link]);
                }
            }
        }

        //------ New algorithum ------------
        //var data = {};
        //var included = {};
        //[1] Deserialize all data
        //[2] Deserialize all included data
        //[3] Iterate over included data relationships set to reference other included data.
        //[4] Iterate over data relationships and set to reference included data if available. 
        var data = {};
        var included = {};
        var jsDataJoiningTables = {};

        //Store data in a type,id key pairs
        DSUTILS.forEach(newResponse.data, (item: JsonApi.JsonApiData) => {
            data[item.type] = data[item.type] || {};
            data[item.type][item.id] = this.DeserializeJsonApiData(options, item, jsDataJoiningTables);

            // Data section is returned to js data so does not need to be inserted again from anywhere else!!
            var metaData = MetaData.TryGetMetaData(data[item.type][item.id]);
            metaData.incrementReferenceCount();
        });

        // Attach liftime events
        JsonApiHelper.AssignLifeTimeEvents(options.def());

        //Store data included as type,id key pairs
        DSUTILS.forEach(newResponse.included, (item: JsonApi.JsonApiData) => {
            var includedDef = options.getResource(item.type);
            included[item.type] = included[item.type] || {};
            included[item.type][item.id] = this.DeserializeJsonApiData(includedDef, item, jsDataJoiningTables);

            // Attach liftime events
            JsonApiHelper.AssignLifeTimeEvents(includedDef.def());
        });

        // This is an array of top level objects with child, object references and included objects
        //var jsDataArray = this.NormaliseDataObjectGraph(data, included, jsDataJoiningTables, options);

        var itemSelector = (item: ModelPlaceHolder): any => {

            //If included or data or joining data contains the reference we are looking for then use it
            let newItem = included[item.type] ? included[item.type][item.id] :
                (data[item.type] ? data[item.type][item.id] :
                    (jsDataJoiningTables[item.type] ? jsDataJoiningTables[item.type][item.id] : null));

            return newItem;
        };
        var toManyPlaceHolderVisitor = (data: Object): any => {

            if (data.constructor === ModelPlaceHolder) {
                let itemPlaceHolder = <ModelPlaceHolder>data;

                //If included or data or joining data contains the reference we are looking for then use it
                let newItem = itemSelector(itemPlaceHolder);

                if (newItem) {
                    //Included item found!!
                    // Apply foreign key to js-data object
                    if (itemPlaceHolder.foreignKeyName) {
                        newItem[itemPlaceHolder.foreignKeyName] = itemPlaceHolder.foreignKeyValue;
                    }

                    // To avoid circular dependanciesin the object graph that we send to jsData only include an object once.
                    // Otherwise it is enough to reference an existing object by its foreighn key
                    var meta = MetaData.TryGetMetaData(newItem);
                    if (meta.incrementReferenceCount() === 1) {
                        return newItem;
                    } else {
                        return undefined;
                    }
                } else {

                    //This item dosn't exist so create a model reference to it
                    let newItem = <any>{};

                    // Apply foreign key to js-data object 
                    if (itemPlaceHolder.foreignKeyName) {
                        newItem[itemPlaceHolder.foreignKeyName] = itemPlaceHolder.foreignKeyValue;
                    }

                    // Replace item in array with plain object, but with Primary key or any foreign keys set
                    var itemOptions = options.getResource(itemPlaceHolder.type);

                    let metaData = new MetaData(itemPlaceHolder.type);
                    metaData.isJsonApiReference = true;

                    newItem[JSONAPI_META] = metaData;
                    newItem[itemOptions.idAttribute] = itemPlaceHolder.id;

                    // Attach liftime events
                    JsonApiHelper.AssignLifeTimeEvents(itemOptions.def());

                    return newItem;
                }
            }

            return data;
        };

        var toOnePlaceHolderVisitor = (data: Object, localField: string, opt: SerializationOptions): any => {
            var val = data[localField];
            if (val !== null && val.constructor === ModelPlaceHolder) {
                let itemPlaceHolder = <ModelPlaceHolder>val;

                //If included or data or joining data contains the reference we are looking for then use it
                let newItem = itemSelector(itemPlaceHolder);

                if (newItem) {
                    // To avoid circular dependanciesin the object graph that we send to jsData only include an object once.
                    // Otherwise it is enough to reference an existing object by its foreighn key
                    var meta = MetaData.TryGetMetaData(newItem);
                    if (meta.incrementReferenceCount() === 1) {
                        return newItem;
                    } else {

                        // hasOne usesforeign key and localal field
                        // Apply foreign key to js-data object hasOne
                        if (itemPlaceHolder.foreignKeyName) {
                            newItem[itemPlaceHolder.foreignKeyName] = itemPlaceHolder.foreignKeyValue;
                        } else {

                            var relation = opt.getParentRelationByLocalField(localField);
                            //Belongs to uses localfield and localkey
                            if (relation && relation.type === jsDataBelongsTo) {
                                data[relation.localKey] = itemPlaceHolder.id;
                            }
                        }
                        return undefined;
                    }
                } else {
                    //This item dosn't exist so create a model reference to it
                    let newItem = <any>{};

                    // Replace item in array with plain object, but with Primary key or any foreign keys set
                    var itemOptions = options.getResource(itemPlaceHolder.type);

                    // Apply foreign key to js-data object 
                    if (itemPlaceHolder.foreignKeyName) {
                        newItem[itemPlaceHolder.foreignKeyName] = itemPlaceHolder.foreignKeyValue;
                    }

                    let metaData = new MetaData(itemPlaceHolder.type);
                    metaData.isJsonApiReference = true;

                    newItem[JSONAPI_META] = metaData;
                    newItem[itemOptions.idAttribute] = itemPlaceHolder.id;

                    // Attach liftime events
                    JsonApiHelper.AssignLifeTimeEvents(itemOptions.def());

                    return newItem;
                }
            }

            return data[localField];
        };

        this.RelationshipVisitor(data, options, toManyPlaceHolderVisitor, toOnePlaceHolderVisitor);
        this.RelationshipVisitor(included, options, toManyPlaceHolderVisitor, toOnePlaceHolderVisitor);
        this.RelationshipVisitor(jsDataJoiningTables, options, toManyPlaceHolderVisitor, toOnePlaceHolderVisitor);

        // Register all data types for life time events
        var registration = (type: string) => {
            var typeOptions = options.getResource(type);
            if (typeOptions) {
                // Attach liftime events
                JsonApiHelper.AssignLifeTimeEvents(typeOptions.def());
            } else {
                throw new Error('Unknow type:' + type);
            }
        };

        this.DataTypeVisitor(data, registration);
        this.DataTypeVisitor(included, registration);
        this.DataTypeVisitor(jsDataJoiningTables, registration);

        //this.ReplaceModelPlaceHolderRelations(included, options);
        //this.ReplaceModelPlaceHolderRelations(jsDataJoiningTables, options);

        // Copy top level objects
        // This is an array of top level objects with child, object references and included objects
        var jsDataArray = [];
        if (data) {
            for (var dataType in data) {

                if (data[dataType]) {
                    for (var dataId in data[dataType]) {

                        if (data[dataType][dataId]) {
                            jsDataArray.push(data[dataType][dataId]);
                        }
                    }
                }
            }
        }

        return new DeSerializeResult(jsDataArray, newResponse);
    }

    private static RelationshipVisitor(data: any, options: SerializationOptions,
        toManyVisitor: (relationData: Object) => any,
        toOneVisitor: (relationData: Object, fieldName: string, opt: SerializationOptions) => any) {
        if (data) {
            // Replace data references with included data where available
            for (var dataType in data) {

                if (data[dataType]) {
                    for (var dataId in data[dataType]) {

                        if (data[dataType][dataId]) {
                            var dataObject = data[dataType][dataId];

                            for (var prop in dataObject) {

                                if (DSUTILS.isArray(dataObject[prop])) {

                                    // hasMany Relationship
                                    // With many relations we can set the foreign key and delete the object to prevent circular relations
                                    DSUTILS.forEach(dataObject[prop], (item: ModelPlaceHolder, index: number, source: Array<ModelPlaceHolder>) => {
                                        var result = toManyVisitor(item);
                                        source[index] = result;
                                    });

                                    // Remove un-used array items
                                    for (var i = dataObject[prop].length; i >= 0; i--) {
                                        if (!dataObject[prop][i]) {
                                            dataObject[prop].splice(i, 1);
                                        }
                                    }

                                    // Remove array if empty
                                    if (dataObject[prop].length === 0) {
                                        delete dataObject[prop];
                                    }

                                } else {
                                    // hasOne, belongsTo relations
                                    // hasOne or parent Relationship
                                    var opt = options.getResource(dataType);

                                    // Has one relations we can set the foreign key and remove the object
                                    var result = toOneVisitor(dataObject, prop, opt);
                                    if (result !== undefined) {
                                        dataObject[prop] = result;
                                    } else {
                                        delete dataObject[prop];
                                    }

                                }
                            }
                        }

                    }
                }
            }
        }
    }

    private static DataTypeVisitor(data: any, visitor: (type: string) => any) {
        // Replace data references with included data where available
        for (var dataType in data) {
            if (dataType) {
                visitor(dataType);
            }
        }
    }

    private static CreateErrorResponse(title: string, detail: string): JsonApi.JsonApiRequest {
        var response = new JsonApi.JsonApiRequest();
        var e = new JsonApi.JsonApiError();
        e.title = title;
        e.detail = detail;
        response.WithError(e);

        return response;
    }

    private static CreateNoResponseError() {
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


        var data = new JsonApi.JsonApiData(options.type);

        //JsonApi id is always a string, it can be empty for a new unstored object!
        if (contents[options.idAttribute]) {
            data.id = contents[options.idAttribute];
        }

        for (var prop in contents) {
            // Skip id attribute as it has already been copied to the id field out side of the attributes collection
            if (prop === options.idAttribute) {
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
                            throw new Error('Data array encountered, expected this to be a to have a hasMany relationship defined in JSData but found, ' + relationType);
                        }

                        var resourceDef = options.getResource(childRelation.relation);

                        //This is a relationship so add data as relationsship as apposed to inling data structure                        
                        var relationship = new JsonApi.JsonApiRelationship(true);
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

                    var relation = new JsonApi.JsonApiRelationship(false);
                    relation.data = new JsonApi.JsonApiData(type)
                        .WithId(id);

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
    private static DeserializeJsonApiData(options: SerializationOptions, data: JsonApi.JsonApiData, joinData: any): Object {
        if (!options) {
            throw new Error('Missing Serialization Options, indicates possible missing jsData resource: ' + data.type);
        }

        // We start off by taking all jsonapi attributes
        var fields = DSUTILS.copy(data.attributes || {});

        var metaData = new MetaData(data.type);
        metaData.isJsonApiReference = false;
        metaData.selfLink = data.GetSelfLink();

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
        metaData.WithRelationshipLink(JSONAPI_PARENT_LINK, JSONAPI_PARENT_LINK, data.type, JsonApiHelper.setParentIds(options, data, fields));
        //Get each child relationship
        // SHOULD Relation name really BE relation TYPE ???
        for (var relationName in data.relationships) {
            if (data.relationships[relationName]) {

                // Relation name should be the local field name of a relationship.
                var relationship = data.relationships[relationName];

                // Data is truthy and is not an array or if an array is not empty
                var hasData = (relationship.data && (!DSUTILS.isArray(relationship.data) || (DSUTILS.isArray(relationship.data) && (<JsonApi.JsonApiData[]>relationship.data).length > 0)));

                if (hasData) {
                    var joinTableFactory = null;
                    // Gets type from data
                    var childRelationType = DSUTILS.isArray(relationship.data) ? relationship.data[0].type : (<JsonApi.JsonApiData>(<any>relationship.data)).type;
                    var relationshipDef = options.getChildRelationWithLocalField(childRelationType, relationName);

                    // EXPERIMENTAL MANY TO MANY RELATIONSHIPS SPECIAL HANDLEING
                    // NOTE : If this children are contained in an array and the relationship contains a self link meaning we can manipulate the relationship
                    // independant of the data then this is a manyToMAny relationship and should use a joining table
                    if (!relationshipDef) {
                        // We could not find the relationship for this data, so check meta data to see if we are using a joining 
                        // table to manage this type
                        if (options.def().meta[relationName]) {
                            // Has meta tag for this related field

                            // Child type from meta, relationNameis the name of the local field
                            var joinMetaData = options.def().meta[relationName] as IJSDataManyToManyMeta;

                            // Meta data for the joining table
                            var joiningTypeResourceDef = options.getResource(joinMetaData.joinType);

                            // So now we have the correct type for the relationship, we can get the local relationship
                            // and its corresponding foreign key field name
                            relationshipDef = options.getChildRelationWithLocalField(joinMetaData.joinType, relationName);
                            if (relationshipDef.type !== jsDataHasMany) {
                                throw new Error(
                                    'Expected relationship Named:' + relationName + 'on type:' + options.type +
                                    ' with many-to-many meta data to be a to many relationship.');
                            }

                            // Get the parent relation of the joining type
                            var joiningTableChildRelation = joiningTypeResourceDef.getParentRelation(joinMetaData.type);
                            if (!joiningTableChildRelation || !joiningTableChildRelation[0]) {
                                throw new Error(
                                    'Expected Many-To-Many Joining table to have a "belongsTo" relation of type:' + joinMetaData.type +
                                    ' as defined in meta data of type:' + data.type);
                            }

                            // Not sure yetif we are going to use local fields or keys...
                            var joinState = {
                                idAttribute: joiningTypeResourceDef.idAttribute,
                                type: joiningTypeResourceDef.type,

                                dataLocalField: relationshipDef.localField,
                                dataForeignKey: relationshipDef.foreignKey,

                                joinTypeDef: joiningTypeResourceDef
                            };

                            // So we will need to attach joining data to the field before returning it
                            // We can calculate id as the combination of both foreign keys
                            //Create an instance of the joining table.
                            joinTableFactory = function (foreignRecord: JsonApi.JsonApiData, relationshipLink: string) {

                                // Compare typenames in order to determine order to combine pk vales.
                                // Any algorithum that results in the same value regardless of the order will do here
                                var pk = (data.type > foreignRecord.type) ? data.id + foreignRecord.id : foreignRecord.id + data.id;
                                joinData[joinState.type] = (joinData[joinState.type] || {});

                                // Set foreign field
                                var joinTableRelation = joinState.joinTypeDef.getParentRelationByLocalKey(joinState.dataForeignKey);

                                if (!joinTableRelation) {
                                    throw new Error('No "BelongsTo" relationship found on joining table ' + joinState.joinTypeDef.type + ' with field name:' + joinState.dataForeignKey);
                                }

                                // If it exists should not need to alter it
                                if (!joinData[joinState.type][pk]) {

                                    var metaData = new MetaData(joinState.type);
                                    metaData.isJsonApiReference = false;

                                    // Unique key
                                    let fields = {};
                                    fields[joinState.idAttribute] = pk;
                                    //fields['type'] = joinState.type;

                                    //Set foreign key of this type
                                    // TODO : Must set foreign field rather than foreign key so that js data can build objects correctly
                                    //fields[joinState.dataLocalField] = new ModelPlaceHolder(data.type, data.id)
                                    //    .WithForeignKey(joinState.dataLocalField, data.id, data.type);


                                    //Joining object should be a parent belongsto relation
                                    fields[joinTableRelation.localKey] = data.id;
                                    fields[joinTableRelation.localField] = new ModelPlaceHolder(data.type, data.id);

                                    //foreignRecord[joinState.dataLocalField] = new ModelPlaceHolder(joinState.type, pk)
                                    //    .WithForeignKey(joinState.dataForeignKey, data.id, data.type);

                                    // Append the id of the synthisized pk...Not sure if we will get away with this as we may not always
                                    // have both of these, say for inserts
                                    metaData.selfLink = relationshipLink + '/' + pk;

                                    // May need to flag this as a temp object not sourced from server...
                                    fields[JSONAPI_META] = metaData;

                                    // Store this oject
                                    joinData[joinState.type][pk] = fields;
                                } else {
                                    // Already exists so just set relation on it

                                    // Set foreign field
                                    var join = joinData[joinState.type][pk];

                                    join[joinTableRelation.localKey] = data.id;
                                    join[joinTableRelation.localField] = new ModelPlaceHolder(data.type, data.id);

                                    //join[joinTableRelation.localField] = new ModelPlaceHolder(foreignRecord.type, foreignRecord.id)
                                    //   .WithForeignKey(joinTableRelation.foreignKey, data.id, data.type);
                                }

                                return new ModelPlaceHolder(joinState.type, pk)
                                    .WithForeignKey(joinState.dataForeignKey, data.id, data.type);
                            };
                        }
                    }

                    if (!relationshipDef) {
                        throw new Error(
                            'MISSING: Relationship definition on js-data resource, Name:' + options.type +
                            ', failed to load relationship named: ' + relationName +
                            '.Your js-data store configuration does not match your jsonapi data structure');
                    } else {
                        // Add relationship to meta data, so that we can use this to lazy load relationship as requiredin the future
                        //metaData.WithRelationshipLink(relationshipDef.relation, 'related', relationship.FindLinkType('related'));
                        metaData.WithRelationshipLink(relationshipDef.localField, JSONAPI_RELATED_LINK, relationshipDef.relation, relationship.FindLinkType(JSONAPI_RELATED_LINK));
                    }

                    // hasMany uses 'localField' and "localKeys" or "foreignKey"
                    // hasOne uses "localField" and "localKey" or "foreignKey"
                    var localField = relationshipDef.localField;
                    //var localKeys = relationshipDef.localKeys;
                    //var localKey = relationshipDef.localKey;
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

                    // NOT SURE if we need these local keys..
                    var localKeysList = new Array<string>();
                    // From each relationship, get the data IF it is an array
                    if (DSUTILS.isArray(relationship.data)) {

                        var relatedItems = new Array<Object>();
                        DSUTILS.forEach((<JsonApi.JsonApiData[]>relationship.data), (item: JsonApi.JsonApiData) => {

                            if (joinTableFactory == null) {

                                var id = item.id;
                                var type = item.type;

                                localKeysList.push(id);

                                let relatedItem = new ModelPlaceHolder(type, id);
                                if (relationshipDef.foreignKey) {
                                    relatedItem.WithForeignKey(foreignKey, data.id, data.type);
                                }

                                relatedItems.push(relatedItem);
                            } else {
                                // This is part of a manyToMany relationship
                                // This new joinItem needs to be added to the main collection of objets so that in the next pass where we resolve 
                                // ModelPlaceHolders it will be picked up
                                let relatedItem = joinTableFactory(item, relationship.FindLinkType('self'));

                                localKeysList.push(id);

                                relatedItems.push(relatedItem);
                            }
                        });

                        // Store related local items for toMany relationship
                        fields[localField] = relatedItems;

                        // Configure js-data relations
                        if (!relationshipDef.foreignKey) {
                            // hasOne uses localKey has many uses localKeys
                            var key = (relationType === jsDataHasMany) ? relationshipDef.localKeys : relationshipDef.localKey;
                            fields[key] = localKeysList; //Set localKeys on Parent
                        }
                    } else {
                        // If data is not an array then set a single item.
                        let item: JsonApi.JsonApiData = (<any>relationship.data);
                        var id = item.id;
                        var type = item.type;

                        localKeysList.push(id);

                        let relatedItem = new ModelPlaceHolder(type, id);
                        if (relationshipDef.foreignKey) {
                            relatedItem.WithForeignKey(foreignKey, data.id, data.type);
                            fields[localField] = relatedItem;
                        }

                        if (!relationshipDef.foreignKey) {
                            if (relationshipDef.type === jsDataHasOne) {
                                // Store related local keys for toOne related items relationship
                                fields[localField] = relatedItem;
                            } else {
                                // Store related local keys for toMany related items relationship
                                fields[localField] = [relatedItem];
                            }

                            // hasOne uses localKey hasMany uses localKeys
                            fields[(relationshipDef.localKeys || relationshipDef.localKey)] = localKeysList; //Set localKeys on Parent
                        }
                    }
                } else {
                    // When a relationship has no data we must still return it to js-data so that the data store is updated.
                    // E.g. If there previously existed a relationship then we need to inform js-data's data store to break this relationship!

                    //Here the relationship data will be set to null or and empty array
                }

            }
        }

        // Deserialise Arbitary data links into object meta data
        if (data.links) {
            this.NormaliseLinkFormat(data.links);

            for (var linkName in data.links) {
                if (data.links[linkName]) {
                    var link: JsonApi.MetaLink = data.links[linkName];
                    metaData.WithLink(linkName, link.href, link.meta);
                }
            }
        }

        fields[JSONAPI_META] = metaData;
        return fields;
    }

    /**
        * Adds ParentID fields to the data provided.
        * The ParentIDs are retrieved from the self 
        * links in the links object provided.
        * This will modify the response object.
        */
    private static setParentIds(options: SerializationOptions, data: JsonApi.JsonApiData, fields: any): string {
        // This object belongs to a parent then search backwards in url for the 
        // parent resource and then the next field we assume contains the parent reource id
        // e.g. api/Parent/1/Children        
        var parentRel = options.getParentRelation();
        if (parentRel) {
            // If Type is set and it has links and links has a self link
            if (data.type && data.GetSelfLink && data.GetSelfLink()) {

                var parentName = parentRel.relation;
                // Get configured local key
                var localKey = parentRel.localKey;

                if (!localKey) {
                    throw new Error(
                        'ERROR: Incorrect js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + parentRel.relation +
                        'A "belongsTo" relationship requires a "localKey" to be configured');
                }

                var selfLinkArray = data.GetSelfLink().split('/');
                var parentResourceIndex = selfLinkArray.lastIndexOf(parentName);
                if (parentResourceIndex > 0) {
                    fields[localKey] = selfLinkArray[parentResourceIndex + 1]; // Set Parent Id
                    var parentLink = selfLinkArray.slice(0, parentResourceIndex + 1).join('/');
                    return parentLink;
                }
            } else {
                LogWarning('Resource ' + options.type + ' has a "belongsTo" relation but is missing a self link and so its parent relation can not be set');
            }
        }
        return null;
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
                    newLink.meta = DSUTILS.deepMixIn(new JsonApi.Meta(), src.meta);
                    links[link] = newLink;
                }
            }
        }
    }


    private static beforeInjectJsonApiData(resource: JSData.DSResourceDefinition<any>, items: any): void {

        if (items) {
            // Merge a json api reference with a fully populated resource that has been previously retrieved
            var dataList = DSUTILS.isArray(items) ? items : [items];

            DSUTILS.forEach<any>(dataList, (data: any) => {

                // This is an update the resource should always exist!!
                JsonApiHelper.MergeMetaData(resource, data);

                if (data['IsJsonApiReference'] === undefined) {
                    var descriptor: any = {
                        enumerable: false,
                        writeable: false,
                        get: function () {
                            var meta = MetaData.TryGetMetaData(this);
                            if (meta) {
                                return meta.isJsonApiReference;
                            } else {
                                return null;
                            }
                        }
                    };
                    Object.defineProperty(data, 'IsJsonApiReference', descriptor);
                }

                // -- findRelated ---------------------------
                if (data['findRelated'] === undefined) {
                    var findRelatedFunction = function (relationName: string) {
                        var containsReferences = false;
                        var meta = MetaData.TryGetMetaData(this);

                        if (meta && meta.isJsonApiReference === false) {

                            if (this[relationName]) {
                                DSUTILS.forEach(this[relationName], function (item: Object) {
                                    var relationItemMeta = MetaData.TryGetMetaData(item);
                                    if (relationItemMeta.isJsonApiReference === true) {
                                        containsReferences = true;
                                        // Exit the for loop early
                                        return false;
                                    }
                                });
                            } else {
                                throw new Error('findRelated failed, Relationship name:' + relationName + ' does not exist.');
                            }

                            if (containsReferences === true || this[relationName] === undefined) {
                                // Get related link for relationship
                                var relationshipMeta = meta.getRelationshipLink(relationName, JSONAPI_RELATED_LINK);

                                if (relationshipMeta) {
                                    var parentResourceType = new SerializationOptions(resource);
                                    var relation = parentResourceType.getChildRelationWithLocalField(relationshipMeta.type, relationName);
                                    var childResource = parentResourceType.getResource(relation.relation);

                                    var params = { jsonApi: { jsonApiPath: relationshipMeta.url}};
                                    params[relation.foreignKey] = this.Id;

                                    var operationConfig: JSDataLib.DSAdapterOperationConfiguration = { bypassCache: true };
                                    return (<JSData.DSResourceDefinition<any>>childResource.def()).findAll(params, operationConfig);
                                }
                            } else {
                                // Resolve promise synchronously!!
                                return DSUTILS.Promise.resolve(this[relationName]);
                            }
                        } else {
                            // This is it self a model reference and so we should get the self link first.
                            // NOTE : We could load self link and then relationship transparently but not sure that this would be what a developer would want.
                            // probably still better to jut throw an error for now!
                            throw Error('findRelated failed, this is a mode reference load via self link instead.');
                        }
                    };
                    data['findRelated'] = findRelatedFunction;
                }

                //LogInfo('beforeInject called onresource:', [resource.name]);
            });
        }
    };


    private static beforeUpdateJsonApiData(resource: JSData.DSResourceDefinition<any>, items: any, cb?: (err: Error, data: any) => void): void {
        var dataList = DSUTILS.isArray(items) ? items : [items];

        DSUTILS.forEach<any>(dataList, (data: any) => {
            // Merge a json api reference with a fully populated resource that has been previously retrieved

            // This is an update the resource should always exist!!
            JsonApiHelper.MergeMetaData(resource, data);

            //LogInfo('beforeUpdate called onresource:', [resource.name]);
        });

        if (cb) {
            cb(null, items);
        } else {
            // Synchronous call
            // LogInfo('beforeUpdateJsonApiData called without callback', [resource, items]);
            return items;
        }
    };

    public static AssignLifeTimeEvents(resource: JSData.DSResourceDefinitionConfiguration) {
        //resource.beforeInject = JsonApiHelper.beforeInjectJsonApiData;
        resource.afterInject = JsonApiHelper.beforeInjectJsonApiData;
        resource.beforeUpdate = JsonApiHelper.beforeUpdateJsonApiData;
    }
}


    /* Expreimental !!
    // This is where the magic of relations happens.
    applyRelationLoadersToTarget(store: JSData.DS, definition: JSData.DSResourceDefinition<any>, target: Object): void {
        DSUTILS.forEach(definition['relationList'], (def: JSData.RelationDefinition) => {
            let relationName = def.relation;
            let localField = def.localField;
            let localKey = def.localKey;
            let foreignKey = def.foreignKey;
            let localKeys = def.localKeys;
            let foreignKeys = def.foreignKeys;
            let enumerable = typeof def.enumerable === 'boolean' ? def.enumerable : !!definition.relationsEnumerable;
            if (typeof def.link === 'boolean' ? def.link : !!definition.linkRelations) {
                
                
                let prop = {
                    enumerable: enumerable,
                    get: undefined,
                };
                if (def.type === 'belongsTo') {
                    prop.get = function () {

                        let key = DSUTILS.get<any>(this, localKey);
                        let hasKey = !!(key || key === 0);                        

                        if (!hasKey) {
                            return DSUTILS.Promise.resolve();
                        } else {
                            var parent = this.apply(localField);
                            if (parent) {
                                var meta = DSUTILS.get<JsonApiAdapter.JsonApiMetaData>(parent, JSONAPI_META);
                                if (meta.isJsonApiReference === true) {
                                    return DSUTILS.Promise.resolve(parent);
                                }
                            }

                            return (<JSData.DSResourceDefinition<any>>definition.getResource(relationName))
                                .find(key, { bypassCache: true });
                        }                        
                    };
                    
                } else if (def.type === 'hasMany') {
                    prop.get = (): JSData.JSDataPromise<any> =>  {

                        // Get many related data
                        var many = this.apply(localField);
                        if (many) {
                            var containsJsonReferences = false;
                            if (DSUTILS.isArray(many)) {
                                DSUTILS.forEach(many, (item) => {
                                    //if any are references then exit the loop
                                    var meta = DSUTILS.get<JsonApiAdapter.JsonApiMetaData>(parent, JSONAPI_META);
                                    if (meta.isJsonApiReference !== false) {
                                        containsJsonReferences = true;
                                        return false;
                                    }
                                });
                            }

                            if (containsJsonReferences) {
                                return (<JSData.DSResourceDefinition<any>>definition.getResource(relationName))
                                    .findAll(key, { bypassCache: true });
                            } else {
                                return DSUTILS.Promise.resolve(many);
                            }
                        }

                        let params = {};
                        if (foreignKey) {
                            params[foreignKey] = this[definition.idAttribute];
                        } else if (localKeys) {
                            let keys = DSUTILS.get(this, localKeys) || [];
                            
                        } else if (foreignKeys) {
                            DSUTILS.set(params, `where.${foreignKeys}.contains`, this[definition.idAttribute]);
                            //return definition.getResource(relationName).defaultFilter.call(store, store.store[relationName].collection, relationName, params);
                            return store.filter(relationName, params);
                        }

                        return undefined;
                    };
                } else if (def.type === 'hasOne') {
                    if (localKey) {
                        prop.get = function () {
                            let key = DSUTILS.get<any>(this, localKey);
                            let hasKey = !!(key || key === 0);
                            return hasKey ? (<JSData.DSResourceDefinition<any>>definition.getResource(relationName)).get(key) : undefined;
                        };
                        //prop.set = function (sibling) {
                        //    if (sibling) {
                        //        DSUTILS.set(this, localKey, DSUTILS.get(sibling, definition.getResource(relationName).idAttribute));
                        //    }
                        //    return DSUTILS.get(this, localField);
                        //};
                    } else {
                        prop.get = function () {
                            let params = {};
                            params[foreignKey] = this[definition.idAttribute];
                            //let items = params[foreignKey] ? definition.getResource(relationName).defaultFilter
                                    .call(store, store.store[relationName].collection, relationName, params, { allowSimpleWhere: true }) : [];
                            let items = params[foreignKey] ? definition.getResource(relationName).defaultFilter
                                     .call(store, store.store[relationName].collection, relationName, params, { allowSimpleWhere: true }) : [];
                            return store.filter(relationName, params, { allowSimpleWhere: true });
                            if (items.length) {
                                return items[0];
                            }
                            return undefined;
                        };
                        //prop.set = function (sibling) {
                        //    if (sibling) {
                        //        DSUTILS.set(sibling, foreignKey, DSUTILS.get(this, definition.idAttribute));
                        //    }
                        //    return DSUTILS.get(this, localField);
                        //};
                    }
                }
                (<JSData.DSResourceDefinition<any>>definition.getResource(relationName))
                if ((<any>def).get) {
                    let orig = prop.get;
                    prop.get = function () {
                        return (<any>def).get(definition, def, this, (...args) => orig.apply(this, args));
                    };
                }
                Object.defineProperty(target, 'find' + localField, prop);
            }
        });
    }
    */