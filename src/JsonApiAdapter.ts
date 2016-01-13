/// <reference path="../scripts/typings/js-data/js-data.d.ts" />
/// <reference path="../scripts/typings/js-data-http/js-data-http.d.ts" />
/// <reference path="../scripts/typings/Common/E6Promise.d.ts" />
/// <reference path="../scripts/typings/js-data/DSUtil.d.ts" />
/// <reference path="../scripts/typings/js-data/JsonApiAdapter.d.ts" />
/// <reference path="JsonApiSerializer.ts" />

// Required dependancies
import JSDataLib = require('js-data');
import JSDataHttp = require('js-data-http');
//export import * as JsonApi  from './JsonApiSerializer';
import Helper = require('./JsonApiSerializer');
export import JsonApi = require('./JsonApi');

class Headers {
    common: { [name: string]: string };

    constructor() {
        this.common = {};
    }
}

const HttpNoContent: Number = 204;

export class JsonApiAdapter implements JSData.IDSAdapter {

    //TODO Add typings, see: https://github.com/js-data/js-data/blob/master/src/utils.js
    private DSUtils: JSData.DSUtil;
    private adapter: JSData.DSHttpAdapterExtended;
    private adapterGetPath: Function;
    adapterHTTP: Function;
    // adapterPOST: Function;

    get defaults(): JsonApiAdapter.DSJsonApiAdapterOptions {
        return this.adapter.defaults;
    }

    private serialize: (resourceConfig: JSData.DSResourceDefinition<any>, attrs: Object) => any;
    private deserialize: (resourceConfig: JSData.DSResourceDefinition<any>, data: JSData.DSHttpAdapterPromiseResolveType) => any;

    constructor(options?: JsonApiAdapter.DSJsonApiAdapterOptions) {
        var httpAdapter: typeof DSHttpAdapter = JSDataHttp;
        this.DSUtils = JSDataLib['DSUtils'];

        //TODO : Set defaults on options        
        this.serialize = this.SerializeJsonResponse;
        this.deserialize = this.DeSerializeJsonResponse;

        //var defaults = new Defaults();
        //if (console) {
        //    defaults.log = (a, b) => console[typeof console.info === 'function' ? 'info' : 'log'](a, b)
        //}
        //if (console) {
        //    defaults.error = (a, b) => console[typeof console.error === 'function' ? 'error' : 'log'](a, b)
        //}

        //options = options || {};
        //this.DSUtils.deepMixIn(options, defaults);            
        this.adapter = <JSData.DSHttpAdapterExtended> (new httpAdapter(options));

        // Override default get path implementation
        this.adapterGetPath = this.adapter.getPath;
        this.adapterHTTP = this.adapter.HTTP;
        //this.adapterPOST = this.adapterPOST;


        this.adapter.getPath = (method: string, resourceConfig: JSData.DSResourceDefinition<any>, id: Object, options: JSData.DSConfiguration): string => {
            return this.getPath(method, resourceConfig, id, options);
        };
        this.adapter.HTTP = (options: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType> => {
            return this.HTTP(options);
        };
        //this.adapter.POST = this.POST;
    }

    SerializeJsonResponse(resourceConfig: JSData.DSResourceDefinition<any>, attrs: Object): any {
        var serializationOptions = new Helper.SerializationOptions(resourceConfig);
        return Helper.JsonApiHelper.Serialize(serializationOptions, attrs);
    }

    DeSerializeJsonResponse(resourceConfig: JSData.DSResourceDefinition<any>, response: JSData.DSHttpAdapterPromiseResolveType): any {
        //Only process JSON Api responses!!
        if (Helper.JsonApiHelper.ContainsJsonApiContentTypeHeader(response.headers)) {
            // TODO : Decode Json API Error response                
            if (response.data.errors) {
                response.data = Helper.JsonApiHelper.FromJsonApiError(response.data);
            } else {
                if (response.status !== HttpNoContent && response.data.data) {
                    if (this.DSUtils.isArray(response.data.data)) {
                        this.DSUtils.forEach<JsonApi.JsonApiData>(response.data.data, (item: JsonApi.JsonApiData) => {
                            if (item.type !== resourceConfig.name && this.defaults.log) {
                                this.defaults.log(
                                    'Warning: Json Api resource name missmatch, ' +
                                    'JsonApi:' + (item.type || 'missing') +
                                    ', js-data:',  [resourceConfig.name]);

                                item.type = resourceConfig.name;
                            }
                        });
                    } else {
                        var data: JsonApi.JsonApiData = response.data.data;
                        if (data.type !== resourceConfig.name && this.defaults.log) {
                            this.defaults.log(
                                'Warning: Json Api resource name missmatch, ' +
                                'JsonApi:' + (response.data.data['type'] || 'missing') +
                                ', js-data:',  resourceConfig.name);

                            data.type = resourceConfig.name;
                        }
                    }

                    // Response should contain data and model. 
                    var obj = Helper.JsonApiHelper.DeSerialize(new Helper.SerializationOptions(resourceConfig), response.data);

                    // Return just the object graph to js data
                    // Maybe this could be an options to return eithere JsoinApiReposne or a js-dataized object
                    response.data = obj.data;
                }
            }
        }
        return response;
    }

    HandleError(config: JSData.DSResourceDefinition<any>, options: JsonApiAdapter.DSJsonApiAdapterOptions, error: any) : any {
        return options.deserialize(config, error);
    }

    /**
        * @name getPath
        * @desc Override DSHttpAdapter get path to use stored JsonApi self link if available
        * @param {string} method Http Method name
        * @param {JSData.DSResourceDefinition} Resourceconfigurations
        * @param {Object} id Resource ID, primary key Number or query parameters
        * @param {JSData.DSConfiguration} options override default configuration options
        * @returns {string} JsonApi rest service Url
        * @memberOf JsonApiAdapter
        */
    getPath(method: string, resourceConfig: JSData.DSResourceDefinition<any>, id: Object, options: JSData.DSConfiguration): string {

        //Get the resource item
        var item: JsonApi.JsonApiData;
        if (this.DSUtils._sn(id)) {
            item = resourceConfig.get(<any>id);
        } else if (this.DSUtils._o(id)) {
            item = <any>id;
        }

        if (method === 'findAll') {
            // EXPERIMENTAL CODE
            // Here id is a params object that contains aprent id., actuallly options.params
            // The resource is the definition of the child items of the parent that will be returned.
            // We want the parent so that we can get the related link from it of the relationship originally passed to loadRelations
            // ANOTHER options is to pass the relationship self link in options, but would prefer to be able to obtains this transparently!!

            //[1] Get back the parent object referenced in finaAll / loadRelations
            let parentResourceName = (<any>resourceConfig).parent;
            let foreignKeyName = (<any>resourceConfig).parentKey;
            if (parentResourceName && foreignKeyName && (<any>options).params && ((<any>options).params)[foreignKeyName]) {
                let pk = ((<any>options).params)[foreignKeyName];
                let parentResource: JSData.DSResourceDefinition<any> = (<any>resourceConfig.getResource(parentResourceName));
                var parentItem = parentResource.get(pk);
                if (parentItem) {
                    var metaData = Helper.MetaData.TryGetMetaData(parentItem);
                    if (metaData) {
                        var relationLink = metaData.relationships[resourceConfig.name];
                        if (relationLink) {
                            (<any>options).params = {};
                            return relationLink;
                        }
                    }
                }
            }
        }

        //var pk = this.DSUtils.resolveId(resourceConfig, id);
        //rejectvar item = resourceConfig.get(<any>pk);

        // See if we have the item self link stored, if so useit directly
        var url = (item && item.GetSelfLink)
            ? item.GetSelfLink()
            : null;

        return url ? url : this.adapterGetPath.apply(this.adapter, [method, resourceConfig, id, options]);
    }

    /**
        * @name configureSerializers
        * @desc Configure serialization and deserialization for the request using 
        * either axios or $http configuration options
        * @param {object} options axios or $http config options
        * @returns {object} options copy of options with serializers configured
        * @memberOf JsonApiAdapter
        */
    configureSerializers(options: JSData.DSConfiguration): any {
        options = this.DSUtils.copy(options) || {};
        options['headers'] = options['headers'] || {};

        //Jsoin Api requires accept header
        Helper.JsonApiHelper.AddJsonApiAcceptHeader(options['headers']);
        Helper.JsonApiHelper.AddJsonApiContentTypeHeader(options['headers']);

        // Ensure that we always call the JsonApi serializer first then any other serializers                
        var serialize = options['serialize'] || this.defaults.serialize;
        if (serialize) {
            options['serialize'] = (resourceConfig: JSData.DSResourceDefinition<any>, attrs: Object) => {
                return serialize(resourceConfig, this.serialize(resourceConfig, attrs));
            };
        } else {
            options['serialize'] = (resourceConfig: JSData.DSResourceDefinition<any>, attrs: Object) => {
                return this.serialize(resourceConfig, attrs);
            };
        }

        // Ensure that we always call the JsonApi deserializer first then any other deserializers                
        var deserialize = options['deserialize'] || this.defaults.deserialize;
        if (deserialize) {
            options['deserialize'] = (resourceConfig: JSData.DSResourceDefinition<any>, data: JSData.DSHttpAdapterPromiseResolveType) => {
                return deserialize(resourceConfig, this.deserialize(resourceConfig, data));
            };
        } else {
            options['deserialize'] = (resourceConfig: JSData.DSResourceDefinition<any>, data: JSData.DSHttpAdapterPromiseResolveType) => {
                return this.deserialize(resourceConfig, data);
            };
        }

        return options;
    }

    // DSHttpAdapter uses axios or $http, so options are axios config objects or $http config options.
    public HTTP(options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType> {
        return this.adapterHTTP.apply(this.adapter, [options])
            .then((response: JSData.DSHttpAdapterPromiseResolveType) => {

                // Need to handle server 204 no content
                // In the case where the server saves exactly what was sent it is possible that the server will not reply with data
                // but instead reply with 204, NoContent
                if (response.status === HttpNoContent && options['method'] && (options['method'] === 'put' || options['method'] === 'patch')) {

                    // Just return original request data, so that js-data will update data store in case it has chnages but
                    // those changes happens to be the same as whats on the server
                    if (options['data']) {
                        response.status = 200;
                        response['statusText'] = 'Ok';
                        response.headers = response.headers || {};
                        Helper.JsonApiHelper.AddJsonApiContentTypeHeader(response.headers);
                        response.data = options['data'];
                    }
                }
            return response;
          });
    }

    //public DEL(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType> {                        
    //    return this.adapter.DEL(url, data, this.configureSerializers(options));
    //}

    //public GET(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType> {        
    //    return this.adapter.GET(url, data, this.configureSerializers(options));
    //}

    //public POST(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType> {        
    //    return this.adapter.POST(url, data, this.configureSerializers(options));
    //}

    //public PUT(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType> {                    
    //    return this.adapter.PUT(url, data, this.configureSerializers(options));
    //}


    //IDSAdapter
    public create(config: JSData.DSResourceDefinition<any>, attrs: Object, options?: JSData.DSConfiguration): JSData.JSDataPromise<any> {
        let localOptions = this.configureSerializers(options);
        return this.adapter.create(config, attrs, localOptions).then(
            null,
            (error: any) => {
                if (this.defaults.log) { this.defaults.log('create Failure', error); }

                return this.DSUtils.Promise.reject(this.HandleError(config, localOptions, error));
            }
        );
    }

    public destroy(config: JSData.DSResourceDefinition<any>, id: string | number, options?: JSData.DSConfiguration): JSData.JSDataPromise<void> {
        let localOptions = this.configureSerializers(options);
        return this.adapter.destroy(config, id, localOptions).then(
            null,
            (error : any) => {
                return this.DSUtils.Promise.reject(this.HandleError(config, localOptions, error));
            }
        );
    }

    public destroyAll(config: JSData.DSResourceDefinition<any>, params: JSData.DSFilterArg, options?: JSData.DSConfiguration): JSData.JSDataPromise<void> {
        let localOptions = this.configureSerializers(options);
        return this.adapter.destroyAll(config, params, localOptions).then(
            null,
            (error: any) => {
                return this.DSUtils.Promise.reject(this.HandleError(config, localOptions, error));
            }
        );
    }

    public find(config: JSData.DSResourceDefinition<any>, id: string | number, options?: JSData.DSConfiguration): JSData.JSDataPromise<any> {
        let localOptions = this.configureSerializers(options);
        return this.adapter.find(config, id, localOptions).then(
            null,
            (error : any) => {
                return this.DSUtils.Promise.reject(this.HandleError(config, localOptions, error));
            }
        );
    }
    public findAll(config: JSData.DSResourceDefinition<any>, params?: JSData.DSFilterArg, options?: JSData.DSConfiguration): JSData.JSDataPromise<any> {
        let localOptions = this.configureSerializers(options);
        return this.adapter.findAll(config, params, localOptions).then(
            null,
            (error: any) => {
                return this.DSUtils.Promise.reject(this.HandleError(config, localOptions, error));
            }
        );
    }

    public update(config: JSData.DSResourceDefinition<any>, id: string | number, attrs: Object, options?: JSData.DSConfiguration): JSData.JSDataPromise<any> {
        if (attrs[config.idAttribute]) {
            if (attrs[config.idAttribute] !== id) {
                throw new Error(
                    'Json Api update expected supplied id and the primary key attribute "' + config.idAttribute +
                    '" to be the same, you may have called update on the wrong id?');
            }
        } else {
            attrs[config.idAttribute] = id;
        }
        let localOptions = this.configureSerializers(options);
        return this.adapter.update(config, id, attrs, localOptions).then(
            null,
            (error: any) => {
                return this.DSUtils.Promise.reject(this.HandleError(config, localOptions, error));
            }
        );
    }

    public updateAll(config: JSData.DSResourceDefinition<any>, attrs: Object, params?: JSData.DSFilterArg, options?: JSData.DSConfiguration): JSData.JSDataPromise<any> {
        let localOptions = this.configureSerializers(options);
        return this.adapter.updateAll(config, attrs, params, localOptions).then(
            null,
            (error: any) => {
                return this.DSUtils.Promise.reject(this.HandleError(config, localOptions, error));
            }
        );
    }
}

export var version = {
    full: '<%= pkg.version %>',
    major: parseInt('<%= major %>', 10),
    minor: parseInt('<%= minor %>', 10),
    patch: parseInt('<%= patch %>', 10),
    alpha: '<%= alpha %>' !== 'false' ? '<%= alpha %>' : false,
    beta: '<%= beta %>' !== 'false' ? '<%= beta %>' : false
};
