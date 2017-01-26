/// <reference path="../scripts/typings/js-data/js-data.d.ts" />
/// <reference path="../scripts/typings/js-data/JsonApiAdapter.d.ts" />
/// <reference path="JsonApi.ts" />

import JSDataLib = require('js-data');
import JsonApi = require('./JsonApi');

//import JSDataLib = require('js-data');
//var jsdata: Function = require('js-data');


export const JSONAPI_META: string = '$_JSONAPIMETA_';
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

    keyType: string;
    keyName: string;
    keyValue: string;

    constructor(type: string, id: string) {
        this.type = type;
        this.id = id;

        if (!type || !id) {
            throw new Error('Type or Id missing');
        }
    }

    WithForeignKey(keyName: string, keyValue: string, keyType: string): ModelPlaceHolder {
        this.keyName = keyName;
        this.keyValue = keyValue;
        this.keyType = keyType;
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

    getBelongsToRelation(parentType: string, relationName? : string): JSData.RelationDefinition {
        if (this.resourceDef.relations && this.resourceDef.relations.belongsTo) {

            if (relationName) {
                return this.resourceDef.relations.belongsTo[parentType];
            }else {
                return this.resourceDef.relations.belongsTo[parentType];
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

        relationType = relationType.toLowerCase();
        localFieldName = localFieldName.toLowerCase();

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
        relationType = relationType.toLowerCase();
        foreignKeyName = foreignKeyName.toLowerCase();

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

    /**
     * @name enumerateAllChildRelations
     * @desc Encapsulates enumerating child relationships
     * @param callback A function tobe called back with child relationship data
     */
    enumerateAllChildRelations(callback: (relation: JSData.RelationDefinition, index?: number, source?: Object) => boolean): void {
        DSUTILS.forEach(this.resourceDef.relationList, (relation: JSData.RelationDefinition, index?: number, source?: Object) => {
            if (relation.type === jsDataHasMany || relation.type === jsDataHasOne) {
                return callback(relation, index, source);
            }
        });
    }

    /**
     * @name enumerateAllParentRelations
     * @desc Encapsulates enumerating child relationships
     * @param callback A function tobe called back with child relationship data
     */
    enumerateAllParentRelations(callback: (relation: JSData.RelationDefinition, index?: number, source?: Object) => boolean): void {
        DSUTILS.forEach(this.resourceDef.relationList, (relation: JSData.RelationDefinition, index?: number, source?: Object) => {
            if (relation.type === jsDataBelongsTo) {
                return callback(relation, index, source);
            }
        });
    }

    /**
     * @name enumerateRelations
     * @desc Encapsulates enumerating child relationships
     * @param callback A function tobe called back with child relationship data
     */
    enumerateRelations(callback: (relation: JSData.RelationDefinition, index?: number, source?: Object) => boolean): void {
        DSUTILS.forEach(this.resourceDef.relationList, (relation: JSData.RelationDefinition, index?: number, source?: Object) => {
                return callback(relation, index, source);
        });
    }


    //Find relationship by relationship name
    private getChildRelations(relationType: string): Array<JSData.RelationDefinition> {
        relationType = relationType.toLowerCase();

        if (this.resourceDef.relations) {
            let matches: Array<JSData.RelationDefinition> = [];

            if (this.resourceDef.relations.hasOne) {
                if (this.resourceDef.relations.hasOne[relationType]) {
                    matches = matches.concat(this.resourceDef.relations.hasOne[relationType]);
                }
            }

            if (this.resourceDef.relations.hasMany) {
                if (this.resourceDef.relations.hasMany[relationType]) {
                    matches = matches.concat(this.resourceDef.relations.hasMany[relationType]);
                }
            }

            if (matches.length) {
                return matches;
            }

            let relationlower = relationType.toLowerCase();
            let relationList = this.resourceDef.relationList;

            DSUTILS.forEach<JSData.RelationDefinition>(relationList, (relation: JSData.RelationDefinition) => {
                if (relation.type === jsDataHasMany || relation.type === jsDataHasOne) {
                    if (relationlower === relation.relation) {
                        matches.push(relation);
                    }
                }
            });
            LogInfo('Relation Case Insensitive match made of ' + relationType, matches);
            return matches;
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

    /**
     * @name getRelationByLocalField
     * @desc Get the relationship for a resorce of a given local field name,
     *       which should be unique and match payload relationships keys.
     *       This method returns both parent and child relationship types
     * @param relationName The relationship name to find
     */
    getRelationByLocalField(relationName: string): JSData.RelationDefinition {
        let relationlower = relationName.toLowerCase();
        let relationList = this.resourceDef.relationList;

        var match: JSData.RelationDefinition = null;
        DSUTILS.forEach(relationList, (relation: JSData.RelationDefinition) => {
            if (relation.localField === relationlower) {
                match = relation;
                return false;
            }
        });
        return match;
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

function LogInfo(message: string, data?: any[]): void {
    if (console) {
        (<Console>console).log(message, data);
    }
}

function LogWarning(message: string, data?: any[]): void {
    if (console) {
        (<Console>console).warn(message, data);
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

        if (headers) {
            for (var key in headers) {
                if (key.toLocaleLowerCase() === header.toLocaleLowerCase()) {
                    var h: string = headers[key];
                    if (h.toLocaleLowerCase().indexOf(value) > -1) {
                        return true;
                    }
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
    public static Serialize(options: SerializationOptions, attrs: any, config: JsonApiAdapter.DSJsonApiAdapterOptions): JsonApi.JsonApiRequest {
        var result = new JsonApi.JsonApiRequest();
        if (DSUTILS.isArray(attrs)) {
            //Add Data as array
            DSUTILS.forEach(attrs, (item: Object) => {
                result.WithData(this.ObjectToJsonApiData(options, item, config));
            });
        } else {
            // JsonAPI single object
            result.data = <any>this.ObjectToJsonApiData(options, attrs, config);
        }
        return result;
    }

    // DeSerialize  Json Api reponse into js-data friendly object graph
    public static DeSerialize(options: SerializationOptions, response: JsonApi.JsonApiRequest): DeSerializeResult {

        if (response.data === null) {
            return new DeSerializeResult(null, null);
        }

        if (DSUTILS.isArray(response.data)) {
            if ((<JsonApi.JsonApiData[]>response.data).length === 0) {
                return new DeSerializeResult([], null);
            }
        }

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
                DSUTILS.forEach(<JsonApi.JsonApiData[]>response.data, (item: JsonApi.JsonApiData) => {

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
                let item = (<any>response.data);
                this.NormaliseLinkFormat(item.links);

                for (var relation in item.relationships) {
                    if (item.relationships[relation]) {
                        this.NormaliseLinkFormat(item.relationships[relation].links);
                        var isArray = DSUTILS.isArray(item.relationships[relation].data);
                        item.relationships[relation] = DSUTILS.deepMixIn(new JsonApi.JsonApiRelationship(isArray), item.relationships[relation]);
                    }
                }

                // Add JsonApiData
                newResponse.WithSingleData(DSUTILS.deepMixIn(new JsonApi.JsonApiData(''), <any>response.data));
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
        if (DSUTILS.isArray(newResponse.data)) {
            DSUTILS.forEach(<JsonApi.JsonApiData[]>newResponse.data, (item: JsonApi.JsonApiData) => {
                data[item.type] = data[item.type] || {};
                data[item.type][item.id] = this.DeserializeJsonApiData(options, item, jsDataJoiningTables);

                // Data section is returned to js data so does not need to be inserted again from anywhere else!!
                var metaData = MetaData.TryGetMetaData(data[item.type][item.id]);
                metaData.incrementReferenceCount();
            });
        } else {
            let item: JsonApi.JsonApiData = <JsonApi.JsonApiData>newResponse.data;
            if (item) {
                data[item.type] = data[item.type] || {};
                data[item.type][item.id] = this.DeserializeJsonApiData(options, item, jsDataJoiningTables);

                // Data section is returned to js data so does not need to be inserted again from anywhere else!!
                var metaData = MetaData.TryGetMetaData(data[item.type][item.id]);
                metaData.incrementReferenceCount();
            }
        }

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
                    if (itemPlaceHolder.keyName) {
                        newItem[itemPlaceHolder.keyName] = itemPlaceHolder.keyValue;
                    }

                    //TODO  : What about local keys, when this is a locaKeys array we must append to it!!
                    // These are/have ben set directly on the parent in Deserialize

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
                    if (itemPlaceHolder.keyName) {
                        newItem[itemPlaceHolder.keyName] = itemPlaceHolder.keyValue;
                    }

                    //TODO  : What about local keys, when this is a locaKeys array we must append to it!!
                    // These are/have ben set directly on the parent in Deserialize

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
            if (val && val.constructor === ModelPlaceHolder) {
                var itemPlaceHolder = <ModelPlaceHolder>val;

                //If included or data or joining data contains the reference we are looking for then use it
                var newItem = itemSelector(itemPlaceHolder);

                if (newItem) {
                    // To avoid circular dependancies in the object graph that we send to jsData only include an object once.
                    // Otherwise it is enough to reference an existing object by its foreign key
                    var meta = MetaData.TryGetMetaData(newItem);
                    if (meta.incrementReferenceCount() === 1) {
                        return newItem;
                    } else {

                        // hasOne uses foreignKey or localKey fieldand localField
                        // Apply foreign key to js-data object hasOne
                        if (itemPlaceHolder.keyName) {
                            newItem[itemPlaceHolder.keyName] = itemPlaceHolder.keyValue;
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
                    newItem = {};

                    // Replace item in array with plain object, but with Primary key or any foreign keys set
                    var itemOptions = options.getResource(itemPlaceHolder.type);

                    // Apply keys, foreign and local to js-data object
                    if (itemPlaceHolder.keyName) {
                        newItem[itemPlaceHolder.keyName] = itemPlaceHolder.keyValue;
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
        if (data) {

            var jsDataArray = [];
            if (DSUTILS.isArray(newResponse.data)) {
                DSUTILS.forEach(<JsonApi.JsonApiData[]>newResponse.data, (item: JsonApi.JsonApiData) => {
                    if (data[item.type] && data[item.type][item.id]) {
                        jsDataArray.push(data[item.type][item.id]);
                    }
                });
                return new DeSerializeResult(jsDataArray, newResponse);
            } else {
                if (newResponse.data) {
                    var item = <JsonApi.JsonApiData>newResponse.data;
                    if (data[item.type] && data[item.type][item.id]) {
                        return new DeSerializeResult(data[item.type][item.id], newResponse);
                    }
                } else {
                    return new DeSerializeResult(null, newResponse);
                }
            }
        }

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

    private static CreateInvalidResponseError(response: any) {
        var responseObj = new JsonApi.JsonApiRequest();

        var e = new JsonApi.JsonApiError();
        e.title = 'Invalid response';
        e.detail = 'Response is incorrectly formed: ' + JSON.stringify(response);
        responseObj.WithError(e);

        return responseObj;
    }

    // Convert js-data object to JsonApi request
    private static ObjectToJsonApiData(options: SerializationOptions, attrs: Object, config: JsonApiAdapter.DSJsonApiAdapterOptions): JsonApi.JsonApiData {

        if (!options.type) {
            throw new Error('Type required within options');
        }

        var data = new JsonApi.JsonApiData(options.type);

        //JsonApi id is always a string, it can be empty for a new unstored object!
        if (attrs[options.idAttribute]) {
            data.WithId(attrs[options.idAttribute]);
        }

        // Take object attributes
        if (config.changes && attrs[options.idAttribute]) {
            var id = attrs[options.idAttribute];
            if ((<JSData.DSResourceDefinition<any>>options.def()).hasChanges(id)) {
                var changes = (<JSData.DSResourceDefinition<any>>options.def()).changes(id);

                DSUTILS.forOwn(changes['added'], (value: any, prop: string) => {
                    // Skip id attribute as it has already been copied to the id field out side of the attributes collection
                    // Skip any non-json api compliant tags
                    if (prop !== options.idAttribute && prop !== JSONAPI_META && prop.indexOf('$') < 0) {
                        data.WithAttribute(prop, value);
                    }
                });

                DSUTILS.forOwn(changes['changed'], (value: any, prop: string) => {
                    // Skip id attribute as it has already been copied to the id field out side of the attributes collection
                    // Skip any non-json api compliant tags
                    if (prop !== options.idAttribute && prop !== JSONAPI_META && prop.indexOf('$') < 0) {
                        data.WithAttribute(prop, value);
                    }
                });

                DSUTILS.forOwn(changes['removed'], (value: any, prop: string) => {
                    // Skip id attribute as it has already been copied to the id field out side of the attributes collection
                    // Skip any non-json api compliant tags
                    if (prop !== options.idAttribute && prop !== JSONAPI_META && prop.indexOf('$') < 0) {
                        data.WithAttribute(prop, null);
                    }
                });
            }

        } else {
            DSUTILS.forOwn(attrs, (value: any, prop: string) => {
                // Skip id attribute as it has already been copied to the id field out side of the attributes collection
                // Skip any non-json api compliant tags
                if (prop !== options.idAttribute && prop !== JSONAPI_META && prop.indexOf('$') < 0) {
                    data.WithAttribute(prop, value);
                }
            });
        }

        // Get object related data
        // Create should always send relationships
        if (config.jsonApi.updateRelationships === true) {
            options.enumerateAllChildRelations( (relation: JSData.RelationDefinition) => {

                // Process child definition
                var relatedDef = options.getResource(relation.relation);

                if (relation.type === jsDataHasMany) {
                    var relationship = new JsonApi.JsonApiRelationship(true);
                    var relatedObjects = DSUTILS.get<any[]>(attrs, relation.localField);
                    if (relatedObjects) {
                        //This is a relationship so add data as relationship
                        DSUTILS.forEach(relatedObjects, (item: any) => {
                            relationship.WithData(relation.relation, item[relatedDef.idAttribute]);
                        });
                    }
                    data.WithRelationship(relation.localField, relationship);
                }

                if (relation.type === jsDataHasOne) {
                    var relationship: JsonApi.JsonApiRelationship = null;
                    var relatedObject = DSUTILS.get<any>(attrs, relation.localField);
                    if (relatedObject) {
                        relationship = new JsonApi.JsonApiRelationship(false)
                            .WithData(relation.relation, relatedObject[relatedDef.idAttribute]);
                    }

                    data.WithRelationship(relation.localField, relationship);
                }

                // Return true to keep enumerating
                return true;
            });
        }

        // Remove all local keys
        if (data.attributes) {
            options.enumerateRelations((relation: JSData.RelationDefinition) => {

                var localKeys = relation.localKey || relation.localKeys;
                if (localKeys) {
                    if (DSUTILS.get<any>(data.attributes, localKeys)) {
                        delete data.attributes[localKeys];
                    }
                }

                return true;
            });
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
        JsonApiHelper.setParentIds(options, data, fields, metaData);

        //Get each child relationship
        for (var relationName in data.relationships) {
            if (data.relationships[relationName]) {
                // Relation name should be the local field name of a relationship.
                var relationship = data.relationships[relationName];

                var relationshipDef = options.getRelationByLocalField(relationName);
                if (relationshipDef) {
                    // We are only interested in child relationships
                    // Add relationship to meta data, so that we can use this to lazy load relationship as required in the future
                    if (relationshipDef.type === jsDataHasMany || relationshipDef.type === jsDataHasOne) {
                        metaData.WithRelationshipLink(
                            relationshipDef.localField,
                            JSONAPI_RELATED_LINK,
                            relationshipDef.relation,
                            relationship.FindLinkType(JSONAPI_RELATED_LINK)
                        );


                        // Data is truthy and is not an array or if an array is not empty
                        var hasData = (relationship.data && (
                            !DSUTILS.isArray(relationship.data) ||
                            (DSUTILS.isArray(relationship.data) && (<JsonApi.JsonApiData[]>relationship.data).length > 0))
                        );

                        if (hasData) {
                            var joinTableFactory = null;
                            // Gets type from data
                            var childRelationType = DSUTILS.isArray(relationship.data) ? relationship.data[0].type : (<JsonApi.JsonApiData>(<any>relationship.data)).type;
                            relationshipDef = options.getChildRelationWithLocalField(childRelationType, relationName);

                            // EXPERIMENTAL MANY TO MANY RELATIONSHIPS SPECIAL HANDLING
                            // NOTE : If this children are contained in an array and the relationship contains a self link meaning we can manipulate the relationship
                            // independant of the data then this is a manyToMAny relationship and should use a joining table
                            if (!relationshipDef) {
                                // We could not find the relationship for this data, so check meta data to see if we are using a joining
                                // table to manage this type
                                if (options.def().meta && options.def().meta[relationName]) {
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
                                    var joiningTableChildRelation = joiningTypeResourceDef.getBelongsToRelation(joinMetaData.type);
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

                            if (relationshipDef) {
                                // Add relationship to meta data, so that we can use this to lazy load relationship as required in the future
                                metaData.WithRelationshipLink(
                                    relationshipDef.localField,
                                    JSONAPI_RELATED_LINK,
                                    relationshipDef.relation,
                                    relationship.FindLinkType(JSONAPI_RELATED_LINK)
                                );
                            } else {
                                throw new Error(
                                    'MISSING: Relationship definition on js-data resource, Name:' + options.type +
                                    ', failed to load relationship named: ' + relationName +
                                    '. Your js-data store configuration does not match your jsonapi data structure');
                            }

                            // hasMany uses 'localField' and "localKeys" or "foreignKey"
                            // hasOne uses "localField" and "localKey" or "foreignKey"
                            var localField = relationshipDef.localField;
                            var foreignKey = relationshipDef.foreignKey;
                            var relationType = relationshipDef.type; //hasOne or hasMany

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
                                if (foreignKey && relationshipDef.localKeys) {
                                    throw new Error(
                                        'ERROR: Ambiguous js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + relationshipDef.relation +
                                        'A "hasMany" relationship has both localKeys and foreignKeys configured, use either "foreignKey" or "localKeys" but not BOTH');
                                }

                            } else {
                                if (!(foreignKey || relationshipDef.localKey)) {
                                    throw new Error(
                                        'ERROR: Incorrect js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + relationshipDef.relation +
                                        'A "hasOne" relationship requires either "foreignKey" or "localKey" to be configured');
                                }

                                if (foreignKey && relationshipDef.localKey) {
                                    throw new Error(
                                        'ERROR: Ambiguous js-data, relationship definition on js-data resource, Name:' + options.type + 'Relationship Name:' + relationshipDef.relation +
                                        'A "hasOne" relationship has both localKey and foreignKey configured, use either "foreignKey" or "localKey" but not BOTH');
                                }
                            }

                            // From each relationship, get the data IF it is an array
                            if (DSUTILS.isArray(relationship.data)) {

                                // NOT SURE if we need these local keys..
                                var localKeysList = new Array<string>();

                                // TO MANY RELATIONSHPI, use either foreignKey or localKeys
                                var relatedItems = new Array<Object>();
                                DSUTILS.forEach((<JsonApi.JsonApiData[]>relationship.data), (item: JsonApi.JsonApiData) => {

                                    if (joinTableFactory == null) {
                                        var id = item.id;
                                        var type = item.type;

                                        let relatedItem = new ModelPlaceHolder(type, id);
                                        if (relationshipDef.foreignKey) {
                                            // Store foreign key forfuture reference, so that it can be applied to foreign object later once resolved
                                            relatedItem.WithForeignKey(relationshipDef.foreignKey, data.id, data.type);
                                        } else {
                                            // Store local keys directly on the object
                                            localKeysList.push(id);
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

                                // Configure js-data relations.
                                // If the relation dosent have a foreignKey defined then we must use localKeys
                                if (relationshipDef.localKeys) {
                                    // hasMany uses localKeys
                                    fields[relationshipDef.localKeys] = localKeysList; //Set localKeys on Parent
                                }

                                // Store related local items for toMany relationship refered to by foreignKeys or localKeys
                                fields[localField] = relatedItems;


                            } else {
                                // TO ONE RELATIONSHIP
                                // If data is not an array then set a single item.
                                let item: JsonApi.JsonApiData = (<any>relationship.data);
                                var id = item.id;
                                var type = item.type;

                                let relatedItem = new ModelPlaceHolder(type, id);
                                if (relationshipDef.foreignKey) {
                                    relatedItem.WithForeignKey(relationshipDef.foreignKey, data.id, data.type);
                                } else {
                                    // hasOne uses localKey
                                    fields[relationshipDef.localKey] = id; //Set localKeys on Parent
                                }

                                // Store related local key for toOne related items relationship
                                // This will get removed later and either resolved to a relateed object or the stored key set on the parent
                                fields[localField] = relatedItem;

                            }
                        } else {
                            // When a relationship has no data we must still return it to js-data so that the data store is updated.
                            // E.g. If there previously existed a relationship then we need to inform js-data's data store to break this relationship!

                            //Here the relationship data will be set to null or and empty array
                        }

                    } else {
                        // This is a parenet relationship
                    }
                } else {
                    throw new Error(
                        'MISSING: Relationship definition on js-data resource, Name:' + options.type +
                        ', failed to load relationship named: ' + relationName +
                        '. Your js-data store configuration does not match your jsonapi data structure');
                }
            }
        } // End : relationships

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
    private static setParentIds(options: SerializationOptions, data: JsonApi.JsonApiData, fields: any, metaData: MetaData): void {
        // This object belongs to a parent so search backwards in the self link url for the
        // parent resource and then the next field we assume contains the parent reource id
        // e.g. api/Parent/1/Childrelation
        //Here 'Parent' should be the data.type of the parent, follows by its id, then the child relationship

        //Here:
        // - Parent is the name of the parent type , follows by the id.
        // - ChildRelation - is the localField/relationName on the parent


        // Get parent link
        if (data.type && data.GetSelfLink && data.GetSelfLink()) {
            var selfLinkArray = data.GetSelfLink().split('/');

            // Iterate over parent relations
            // Look for parent type in self link.
            // If found get the id and set to loalKey
            options.enumerateAllParentRelations((rel: JSData.RelationDefinition) => {

                // If we find a parent/belongsTo relationship with the same type as the parent then use it.
                // There should only ever be one parent relationship of a given type.
                var parentResourceIndex = selfLinkArray.lastIndexOf(rel.relation);
                if (parentResourceIndex >= 0 && rel.localKey) {
                    //We found a match
                    fields[rel.localKey] = selfLinkArray[parentResourceIndex + 1]; // Set Parent Id
                    var parentLink = selfLinkArray.slice(0, parentResourceIndex + 2).join('/');

                    // This will allow loadRelations to load this a parent relationship!!
                    // Im not sure when it would make sense to call loadRelations on a parent link?
                    // Maybe if somehow you got an object without first loading its parent and called load relations on the
                    // parent relation ?
                    metaData.WithRelationshipLink(rel.localField, JSONAPI_PARENT_LINK, rel.relation, parentLink);
                    return false;
                }
                return true;
            });
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
                    newLink.meta = DSUTILS.deepMixIn(new JsonApi.Meta(), src.meta);
                    links[link] = newLink;
                }
            }
        }
    }


    private static onInjectJsonApiData(resource: JSData.DSResourceDefinition<any>, items: any): void {

        if (items) {

            // This is not required oneach data item this applies to the Resource Definition
            var def: SerializationOptions = new SerializationOptions(resource);

            def.enumerateRelations((relationDef: JSData.RelationDefinition) => {
                if (typeof relationDef.load !== 'function') {

                    // This adds a custom relationship load method that is called by loadRelations to override default behaviour
                    // Here we add the relationship url to options and store a reference to this functon, set the relationshipDef load functions to undefined
                    // and call loadRelations again, this time options will contain the stored relatedLink and the load function will not get re-called as we have removed it
                    // Then after loadRelations completes or fails, restore the load function once again
                    relationDef.load = (
                        Resource: JSData.DSResourceDefinition<any>,
                        relationDef: JSData.RelationDefinition,
                        instance: Object,
                        optionsOrig: JSData.DSAdapterOperationConfiguration) => {

                        var meta = MetaData.TryGetMetaData(instance);
                        if (meta) {
                            var relatedLink = meta.getRelationshipLink(
                                relationDef.localField,
                                (relationDef.type === jsDataBelongsTo) ? JSONAPI_PARENT_LINK : JSONAPI_RELATED_LINK
                            );

                            if (relatedLink) {
                                var options: JsonApiAdapter.DSJsonApiAdapterOptions = DSUTILS.copy<JsonApiAdapter.DSJsonApiAdapterOptions>(<any>optionsOrig);
                                //var options: JsonApiAdapter.DSJsonApiAdapterOptions = <any>optionsOrig;

                                options.jsonApi = options.jsonApi || <JsonApiAdapter.DSJsonApiOptions>{};
                                options.jsonApi.jsonApiPath = options.jsonApi.jsonApiPath || relatedLink.url;
                                options.bypassCache = options.bypassCache || true;

                                // Set the parents foreign key on the children, this is required when the child has no relationship back to the parent.
                                // E.g. there is no localKey defined on the child!!
                                var childResourceDef = <JSData.DSResourceDefinition<any>>Resource.getResource(relationDef.relation);

                                if (relationDef.type === jsDataBelongsTo || relationDef.type === jsDataHasOne) {
                                    // Find single item
                                    //var item = DSUTILS.get(instance, relationDef.localField);
                                    //if (item && !optionsOrig.bypassCache && DSUTILS.get(item, 'isJsonApiReference') === true) {
                                    //    return Promise.resolve(item);
                                    //} else {
                                        // js-data#fine uses the id passed to find as a cache key, so we need a unique key for each request.
                                        var relationId = options.jsonApi.jsonApiPath;
                                        return childResourceDef.find(relationId, <any>options).then((data: any) => {
                                            if (DSUTILS.isArray(data)) {
                                                throw new Error('DSJsonApiAdapter, Load Relations expected non array');
                                            }

                                            if (relationDef.localKey) {
                                                instance[relationDef.localKey] = DSUTILS.resolveId(childResourceDef, data);
                                            } else if (relationDef.foreignKey) {
                                                data[relationDef.foreignKey] = DSUTILS.resolveId(childResourceDef, instance);
                                            } else if (options.error) {
                                                options.error('DSJsonApiAdapter, load relations, relation does not have a key correctly defined', [relationDef]);
                                            }
                                        });
                                    //}
                                } else {
                                    // js-data#findAll uses the params passed to it as a cache key, so we need a unique key for each request.
                                    var relationParam = {__jsDataJsonapi: options.jsonApi.jsonApiPath};
                                    return childResourceDef.findAll(relationParam, <any>options).then((data: any) => {
                                            // Find multiple items
                                            if (!DSUTILS.isArray(data)) {
                                                throw new Error('DSJsonApiAdapter, Load Relations expected array');
                                            }


                                            if (relationDef.localKeys) {
                                                var localKeys = [];
                                                DSUTILS.forEach(data, (item: any) => {
                                                    localKeys.push(DSUTILS.resolveId(childResourceDef, item));
                                                });

                                                // Local keys stored on parent, replace them, as we have just requested the whole relationship
                                                instance[relationDef.localKeys] = localKeys;
                                            } else if (relationDef.foreignKey) {
                                                // Set foreign key on child
                                                var parentId = DSUTILS.resolveId(Resource, instance);

                                                DSUTILS.forEach(data, (item: any) => {
                                                    item[relationDef.foreignKey] = parentId;
                                                });
                                            } else if (options.error) {
                                                options.error('DSJsonApiAdapter, load relations, onToMany relation does not have a keys correctly defined', [relationDef]);
                                            }
                                        });
                                    }
                            }

                        } else {
                            return Promise.reject('DSJsonApiAdapter, Failed to load Relationship, no meta data');
                        }

                        //if (!relationDef || relationDef.localField) {
                            throw new Error(
                                'Failed to load Relationship, relationship does not exist. ' +
                                'Check your call to loadRelations that the relationship name is correct, or that your resource configuration matches your jsonApi data')
                            ;
                        //}
                    };

                    return true;
                }
            });


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
                    var findRelatedFunction = function (relationName: string, options? : any) {
                        var containsReferences = false;
                        var meta = MetaData.TryGetMetaData(this);

                        if (meta && meta.isJsonApiReference === false) {

                            if (this[relationName]) {

                                if (DSUTILS.isArray(this[relationName])) {
                                    DSUTILS.forEach(this[relationName], function (item: Object) {
                                        var relationItemMeta = MetaData.TryGetMetaData(item);
                                        if (relationItemMeta.isJsonApiReference === true) {
                                            containsReferences = true;
                                            // Exit the for loop early
                                            return false;
                                        }
                                    });
                                } else {
                                    var item = this[relationName];
                                    var relationItemMeta = MetaData.TryGetMetaData(item);
                                    if (relationItemMeta.isJsonApiReference === true) {
                                        containsReferences = true;
                                    }
                                }

                            } else {
                                throw new Error('findRelated failed, Relationship name:' + relationName + ' does not exist.');
                            }

                            if (containsReferences === true || this[relationName] === undefined || (options && options.bypassCache === true)) {
                                // Get related link for relationship
                                var relationshipMeta = meta.getRelationshipLink(relationName, JSONAPI_RELATED_LINK);

                                if (relationshipMeta) {
                                    var parentResourceType = new SerializationOptions(resource);
                                    var relation = parentResourceType.getChildRelationWithLocalField(relationshipMeta.type, relationName);
                                    var childResource = parentResourceType.getResource(relation.relation);

                                    var params = { };
                                    //params[relation.foreignKey] = this.Id;

                                    var operationConfig: any = {
                                        bypassCache: true,
                                        jsonApi: { jsonApiPath: relationshipMeta.url }
                                    };

                                    // Resolves promise async
                                    //if (DSUTILS.isArray(this[relationName])) {
                                        return (<JSData.DSResourceDefinition<any>>childResource.def()).findAll(params, operationConfig);
                                    //} else {
                                    //    // We may not know the id? just the url
                                    //    return (<JSData.DSResourceDefinition<any>>childResource.def()).find(0, operationConfig);
                                    //}
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

    private static afterLoadRelations(resource: JSData.DSResourceDefinition<any>, items: any, cb?: (err: Error, data: any) => void): void {
        if (cb) {
            cb(null, items);
        } else {
            // Synchronous call
            // LogInfo('beforeUpdateJsonApiData called without callback', [resource, items]);
            return items;
        }
    }

    public static AssignLifeTimeEvents(resource: JSData.DSResourceDefinitionConfiguration) {
        resource.afterInject = JsonApiHelper.onInjectJsonApiData;
        resource.beforeUpdate = JsonApiHelper.beforeUpdateJsonApiData;

        //resource.afterLoadRelations = JsonApiHelper.afterLoadRelations;
    }
}
