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

        localField?: string;

        localKey?:string
        foreignKey?: string;

        localKeys?: string;
        foreignKeys?: string;

        enumerable?: boolean;
        link?: boolean;
    }

    interface PromiseLib {
        resolve<R>(value?: R | Thenable<R>): Promise<R>;
        reject(error: any): Promise<any>;
    }

    interface DSUtil {
        Promise: PromiseLib; //{ <R>(callback: (resolve: (value?: R | Thenable<R>) => void, reject: (error?: any) => void) => void) };
        deepMixIn: (dest: any, source: any) => any;
        equals: (obj1: any, obj2: any) => boolean;
        _sn: (obj: Object) => boolean;
        _o: (obj: Object) => boolean;
        copy: <T>(source: T) => T;
        isArray: (obj: any) => boolean;
        forEach: <T>(source: Array<T>, item: (item: T, index?: number, source?: Array<T>) => boolean | void) => void;
        resolveId: (definition, idOrInstance: any) => any;
        isString: (value: any) => boolean;

        // see : http://moutjs.com/docs/v0.1.0/object.html
        get : <T>(obj: Object, prop: string) => T;
        set : (obj: Object, prop: string, value: any) => void;
        contains: (obj1: Object, obj2: Object) => boolean;
        keys: (obj: Object) => any[];
    }
}
