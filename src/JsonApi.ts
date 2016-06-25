

export class JsonApiRequest {
    data: JsonApiData[];
    errors: JsonApiError[];
    included: JsonApiData[];
    links: { [key: string]: MetaLink };
    //model: any;
    meta: Meta;
    jsonapi: JsonApiVersion;

    constructor() {
        //this.data = new Array<JsonApiData>();
        //this.included = new Array<JsonApiData>();
        //this.errors = new Array<JsonApiError>();
        //this.links = {};
    }

    GetErrorsAsString(): string {

        var err: string = '';
        if (this.errors && this.errors.length) {
            for (var i = 0; i < this.errors.length; i++) {
                err += this.errors[i].detail + ' ';
            }
            err = err.trim();
        } else {
            //Should not ever happen
            err = 'No response from server';
        }
        return err;
    }

    WithError(error: JsonApiError): JsonApiRequest {
        this.errors = this.errors || new Array<JsonApiError>();
        this.errors.push(error);
        return this;
    }

    WithData(data: JsonApiData): JsonApiRequest {
        this.data = this.data || new Array<JsonApiData>();
        this.data.push(data);
        return this;
    }

    WithIncluded(data: JsonApiData): JsonApiRequest {
        this.included = this.included || new Array<JsonApiData>();
        this.included.push(data);
        return this;
    }

    WithLink(linkType: string, uri: string): JsonApiRequest {
        this.links = this.links || {};
        this.links[linkType] = new MetaLink(uri);
        return this;
    }

    AddLink(linkType: string, link: MetaLink): JsonApiRequest {
        this.links = this.links || {};
        this.links[linkType] = link;
        return this;
    }
}

export class JsonApiData {
    id: string;
    type: string;

    attributes: { [key: string]: any; };
    links: { [key: string]: MetaLink };
    relationships: { [key: string]: JsonApiRelationship };


    constructor(type: string) {
        this.id = undefined;
        this.type = type;
        this.attributes = {};
        this.links = {};
        this.relationships = {};
    }


    WithAttribute(key: string, value: string): JsonApiData {
        this.attributes[key] = value;
        return this;
    }

    AddLink(linkType: string, link: MetaLink): JsonApiData {
        this.links[linkType] = link;
        return this;
    }

    WithLink(linkType: string, uri: string): JsonApiData {
        this.links[linkType] = new MetaLink(uri);
        return this;
    }

    WithId(id: string): JsonApiData {
        this.id = id;
        return this;
    }

    WithType(type: string): JsonApiData {
        this.type = type;
        return this;
    }

    WithRelationship(relationName: string, relation: JsonApiRelationship) {
        this.relationships = this.relationships || {};
        this.relationships[relationName] = relation;
        return this;
    }

    GetSelfLink(): string {
        if (this.links && this.links['self']) {
            return this.links['self'].href;
        } else {
            return null;
        }
    }
}

export class JsonApiRelationship {
    links: { [key: string]: MetaLink };
    data: JsonApiData[];
    meta: Meta;

    constructor() {
        this.links = {};
        this.data = new Array<JsonApiData>();
    }

    WithData(type: string, id: string): JsonApiRelationship {
        this.data.push(new JsonApiData(type).WithId(id));
        return this;
    }

    AddLink(linkType: string, link: MetaLink): JsonApiRelationship {
        this.links[linkType] = link;
        return this;
    }

    WithLink(linkType: string, url: string): JsonApiRelationship {
        this.links[linkType] =  new MetaLink(url);
        return this;
    }

    FindLinkType(linkType: string): string {
        return (this.links && this.links[linkType]) ? this.links[linkType].href : null;
    }
}

export class MetaLink {
    href: string;
    meta: Meta;

    constructor(href: string, meta?: Meta) {
        this.href = href;
        this.meta = meta || new Meta();
    }
}

export class Meta {
    fields: { [key: string]: string; };

    constructor() {
        this.fields = {};
    }
}

export class JsonApiError {
    id: string;
    links: { [key: string]: MetaLink };
    status: number;
    code: number;
    title: string;
    detail: string;
    //source: Source;

    AddLink(linkType: string, link: MetaLink): JsonApiError {
        this.links[linkType] = link;
        return this;
    }
}

export class JsonApiVersion {
    version: string;
    meta: Meta;
}