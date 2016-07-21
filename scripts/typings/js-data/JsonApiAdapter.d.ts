
declare module JsonApiAdapter {

    export interface DSJsonApiOptions {

        // JsonApi does not support PUT semantics, so use PATCH by default
        usePATCH?: boolean;

        // Set to true to force objects relationships to be sent when updating an objet, default false
        updateRelationships: boolean,

        // Do not set globally, used to override the url for a resource
        // This is set internally using the self link of objects or relationships
        jsonApiPath?: string;
    }

    export interface DSJsonApiAdapterOptions extends JSData.DSHttpAdapterOptions {
        log?: (message?: any, ...optionalParams: any[]) => void;
        error?: (message?: any, ...optionalParams: any[]) => void;

        // Js-data send changes only
        changes?: boolean;

        // DSHTTPSpecific Options
        http?: any;
        headers?: { [name: string]: string };
        method?: string;

        // If required pass json api specific options on here
        jsonApi?: DSJsonApiOptions,

        // We can pass in an existing adapter rather than creating internally.
        // This can work better with js-data-angular
        adapter?: JSData.DSHttpAdapter
    }

    export interface DSJsonApiAdapter extends JSData.IDSAdapter {
        new (options: DSJsonApiAdapterOptions): DSJsonApiAdapter;

        // DSHttpAdapter uses axios so options are axios config objects.
        HTTP(options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType>;
        //DEL(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType>;
        //GET(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType>;
        //POST(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType>;
        //PUT(url: string, data?: Object, options?: Object): JSData.JSDataPromise<JSData.DSHttpAdapterPromiseResolveType>;
    }

    export interface MetaLinkData {
        type: string;
        url: string;
    }

    export interface MetaLink {
        [relatioType: string]: MetaLinkData;
    }

    export interface JsonApiMetaData {
        isJsonApiReference: boolean;
        selfLink: string;
        relationships: { [relation: string]: MetaLink };
        getLinks(linkName:string): MetaLinkData ;
        getRelationshipLink(relationName: string, linkType:string): JsonApiAdapter.MetaLinkData;
    }
}