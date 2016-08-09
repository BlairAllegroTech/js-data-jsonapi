declare module JSData {

    interface DSHttpAdapterExtended extends JSData.DSHttpAdapter {
        defaults: JsonApiAdapter.DSJsonApiAdapterOptions;
        getPath(method: string, resourceConfig: JSData.DSResourceDefinition<any>, id: Object, options: JSData.DSConfiguration): string;
    }

    interface RelationDefinition {
        /**
        * @name type
        * @desc JsData relationship type, e.g. belongsTo,hasMany, hasOne
        */ 
        type: string; //belongsTo,hasMany, hasOne

        /**
        * @name relation
        * @desc JsData resource name, can pass to getResource
        */
        relation: string; 
        name: string;

        localField?: string;

        localKey?:string
        foreignKey?: string;

        localKeys?: string;
        foreignKeys?: string;

        enumerable?: boolean;
        link?: boolean;

        //Added needs to be added to DefinitelyType
        load?: (Resource: JSData.DSResourceDefinition<any>, relationDef: JSData.RelationDefinition, instance: Object, origGetter: Function) => Promise<any> | void;
    }

    interface PromiseLib {
        resolve<R>(value?: R | Thenable<R>): Promise<R>;
        reject(error: any): Promise<any>;
    }

    // See: https://github.com/js-data/js-data/blob/master/src/utils.js
    interface DSUtil {
        Promise: PromiseLib; //{ <R>(callback: (resolve: (value?: R | Thenable<R>) => void, reject: (error?: any) => void) => void) };
        promisify: (fn: Function, target: Object) => JSDataPromise<void>;
        deepMixIn: (dest: any, source: any) => any;
        equals: (obj1: any, obj2: any) => boolean;
        _sn: (obj: Object) => boolean;
        _o: (obj: Object) => boolean;
        copy: <T>(source: T) => T;
        isArray: (obj: any) => boolean;
        forEach: <T>(source: Array<T>, callback: (item: T, index?: number, source?: Array<T>) => boolean | void) => void;
        forOwn: (source: any, callback: (value: any, key: string) => boolean | void) => void;
        resolveId: (definition, idOrInstance: any) => any;
        isString: (value: any) => boolean;

        // see : http://moutjs.com/docs/v0.1.0/object.html
        get : <T>(obj: Object, prop: string) => T;
        set : (obj: Object, prop: string, value: any) => void;
        contains: (obj1: Object, obj2: Object) => boolean;
        keys: (obj: Object) => any[];

        fillIn: <T>(target:T, obj:any) => T;
        toJson: (data: any) => string;

        makePath(...paths: string[]): string;

    }
}
