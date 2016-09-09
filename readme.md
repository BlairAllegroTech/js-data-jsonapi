﻿#js-data-jsonapi

[![npm version][npm_v_badge]][npm_link]
[![npm downloads][npm_dwn_badge]][npm_link]
[![cicleci build][circleci_badge]][circleci_link]
[![Coveralls][coverage_badge]][coverage_link]

###JsonApi Adapter for [js-data](http://www.js-data.io) 
This adapter implements the [JsonApi Protocol](http://jsonapi.org/) and ties it to a js-data data store.

It ties 
- JsonApi **types** to js-data **resource**
- JsonApi **relations** to js-data **toOne, toMany Relationships**

See the [Project Wiki](https://github.com/BlairAllegroTech/js-data-jsonapi/wiki) site for more information and examples (under construction)


##Goals
|Goal|Status|
|----|------|
|Serialize JsonApi requests|code complete, some tests|
|When deserializing JsonApi data add 'ParentIds' so that js-data **belongsTo** relationships can work|code complete, some tests|
|When deserializing JsonApi data add **'LocalKey/LocalKeys'** or **'ForeignKeys'** depending on js-data configurations so that js-data **hasOne** and **hasMany** relationships can work|code complete, some tests|
|Add metadata to indicate if an object is a jsonApi reference, indicating that it is partially populated only|code complete, some tests|
|Transparently request full objects when requested from js-data cache and object is a jsonApi reference only, e.g. Not fully populated| code complete, some tests|
|Store hyperlinking data within metadata of stored data|code complete, some tests|
|Use metadata hyperlinks to request related data from JsonApi data store|code complete, some tests|
|Use metadata hyperlinks to add new items to relationships|Not started|

### Known Issues
1. Testing is by no means complete, there are many more scenarios that need to be covered off.
1. None of the xxxxAll adapter methods have been tested yet. e.g  findAll, destroyAll, updateAll
1. Bower package has not been tested
1. The code creates the DSHttpDataAdapter internally
- Allow the adapter to be injected or a constructor function passed via constructor options.
1. Code is some what brittle in terms of requiring your js-data configuration to match very closely your jsonApi
- Could look at adding additional configuration to allow flexible mapping between js-data and jsonapi
- Further documentation required illustrating the relationships between JsonApi data structure and js-data configuration
1. I haven't actually tested this against a jsonApi implementation yet like ember, but i have had previous experience with jsonApi and am fairly confident that this implementation is good.
- More testing to be done......


### Quick Start
`npm install --save js-data js-data-http js-data-jsonapi` or `bower install --save js-data js-data-http js-data-jsonapi`.

Load `js-data-jsonapi.js` after  `js-data-http.js` and after `js-data.js`.

```js
var adapter = new DSJsonApiAdapter.JsonApiAdapter();

var store = new JSData.DS();
store.registerAdapter('jsonApi', adapter, { default: true });

// "store" will now use the jsonApi adapter for all async operations
```

Or alternatively to use an existing HttpAdapter for example when using js-data-angular

```js
.run(function(DS, DSHttpAdapter) {
    
    var options = {adapter:DSHttpAdapter};
    var adapter = new DSJsonApiAdapter.JsonApiAdapter(options);
    DS.registerAdapter('jsonApi', adapter, { default: true });
    ....
}
```

### Version
0.0.0-alpha.19

### Tech

js-data-jsonapi uses a number of open source projects to work properly:

* [js-data](https://github.com/js-data/js-data) - makes use of js-data apis for integration
* [js-data-http](https://github.com/js-data/js-data-http) - Provides HTTP services!

### License

The MIT License (MIT)

Copyright (c) 2015-2016 Blair Jacobs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[npm_link]: https://www.npmjs.com/package/js-data-jsonapi
[npm_v_badge]: https://img.shields.io/npm/v/js-data-jsonapi.svg
[npm_dwn_badge]: https://img.shields.io/npm/dm/js-data-jsonapi.svg
[circleci_link]: https://circleci.com/gh/BlairAllegroTech/js-data-jsonapi/tree/master
[circleci_badge]: https://circleci.com/gh/BlairAllegroTech/js-data-jsonapi.svg?style=shield
[coverage_badge]: https://coveralls.io/repos/github/BlairAllegroTech/js-data-jsonapi/badge.svg?branch=js-data-jsonapi
[coverage_link]: https://coveralls.io/github/BlairAllegroTech/js-data-jsonapi?branch=js-data-jsonapi
