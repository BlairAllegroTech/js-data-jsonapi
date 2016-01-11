declare module JsonApiAdapter {
    export interface DSJsonApiAdapterOptions extends JSData.DSHttpAdapterOptions {
        //serialize?: (resourceName: string, data: any) => any;
        //deserialize?: (resourceName: string, data: any) => any;
        //queryTransform?: (resourceName: string, params: JSData.DSFilterParams) => any;
        //httpConfig?: any;
        //forceTrailingSlash?: boolean;
        //log?: boolean | ((message?: any, ...optionalParams: any[]) => void);
        //error?: boolean | ((message?: any, ...optionalParams: any[]) => void);

        http?: any;
        headers: any;
        log?: (a: any, b?: any) => void;
        error?: (a: any, b?: any) => void;
    }

    export interface DSJsonApiAdapter extends JSData.IDSAdapter {
        // new (adapter: JSData.DSHttpAdapter): DSJsonApiAdapter;
        // new (options: DSJsonApiAdapterOptions): DSJsonApiAdapter;

        // DSHttpAdapter uses axios so options are axios config objects.
        HTTP(options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType>;
        //DEL(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType>;
        //GET(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType>;
        //POST(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType>;
        //PUT(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType>;
    }
}