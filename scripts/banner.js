var fs = require('fs');
var pkg = require('../package.json');

var banner = '/*!\n' +
  '* js-data-jsonapi\n' +
  '* @version ' + pkg.version + ' - Homepage <https://github.com/BlairAllegroTech/js-data-jsonapi>\n' +
  '* @author Blair Jacobs <blair.jacobs@gmail.com>\n' +
  '* @copyright (c) 2016-2017 Blair Jacobs\n' +
  '* @license MIT <https://github.com/BlairAllegroTech/js-data-jsonapi/blob/master/LICENSE>\n' +
  '*\n' +
  '* @overview JsonApi adapter for js-data.\n' +
  '*/\n';

console.log('Adding banner to dist/ files...');

function addBanner(filepath) {
  var contents = fs.readFileSync(filepath, {
    encoding: 'utf-8'
  });
  if (contents.substr(0, 3) !== '/*!') {
    fs.writeFileSync(filepath, banner + contents, {
      encoding: 'utf-8'
    });
  }
}

addBanner('dist/js-data-jsonapi.js');
addBanner('dist/js-data-jsonapi.min.js');

console.log('Done!');
