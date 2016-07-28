// Install, .npm install
// Visual studio build, .npm run build
// Test: npm run test 
// Karma: npm run karma
// To connect browser:  http://localhost:9876
var customLaunchers = {
    bs_ie9_windows7: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '9.0',
        os: 'Windows',
        os_version: '7'
    }
};

// When on CI build we use singleRun and include Chrome
var isCIBuild = (process.env.CI_BUILD) ? true : false;

var browsers = ['PhantomJS'];
if (isCIBuild === true) {
    browsers.push('Chrome');
}



// If we are configured for Browser stack add additional browsers
if (
	process.env.BROWSERSTACK_USERNAME &&
	process.env.BROWSERSTACK_ACCESS_KEY
) {
    browsers = browsers.concat(Object.keys(customLaunchers));
}

module.exports = function (config) {
    
    var settings = {
        // base path, that will be used to resolve files and exclude
        basePath: './',
        frameworks: ['sinon', 'chai', 'mocha'],
        plugins: [
            // these plugins will be require() by Karma
            'karma-sinon',
            'karma-mocha',
            'karma-chai',
            'karma-chrome-launcher',
            'karma-phantomjs-launcher',
            'karma-firefox-launcher',
            'karma-coverage',
            'karma-browserstack-launcher',
            'karma-junit-reporter',
            'karma-html-reporter'
        ],
        autoWatch: true,
        autoWatchBatchDelay: 4000,
        browsers: browsers,
        
        // list of files / patterns to load in the browser
        files: [
            // simple pattern to load the needed testfiles
            // equal to {pattern: 'test/unit/*.spec.js', watched: true, served: true, included: true}

            'node_modules/es6-promise/dist/es6-promise.js',
            'node_modules/axios/dist/axios.js',
            'node_modules/js-data/dist/js-data.js',
            'node_modules/js-data-http/dist/js-data-http.js',
            'dist/js-data-jsonapi.js',

            'karma.start.js',
            'test/*.js',

            'examples/**/*.js',

            // fixtures
            { pattern: 'examples/**/*.json', watched: true, served: true, included: false }
        ],
        
        reporters: ['dots', 'progress', 'coverage', 'junit', 'html'],
        
        preprocessors: {
            'dist/js-data-jsonapi.js': ['coverage']
        },
        
        // optionally, configure the reporter
        coverageReporter: {
            type: 'lcov',
            dir: 'coverage/'
        },
        
        // the default configuration
        junitReporter: {
            outputDir: process.env.CIRCLE_TEST_REPORTS || 'junit',
            outputFile: undefined,
            suite: 'js-data-jsonapi',
            useBrowserName: false
        },
        
        // the default configuration 
        htmlReporter: {
            outputDir: 'karma_html', // where to put the reports  
            templatePath: null, // set if you moved jasmine_template.html 
            focusOnFailures: true, // reports show failures on start 
            namedFiles: false, // name files instead of creating sub-directories 
            pageTitle: null, // page title for reports; browser info by default 
            urlFriendlyName: false, // simply replaces spaces with _ for files/dirs 
            reportName: 'unit_test_results', // report summary filename; browser info by default 
            
            
            // experimental 
            preserveDescribeNesting: false, // folded suites stay folded  
            foldAll: false, // reports start folded (only with preserveDescribeNesting) 
        },
        
        browserStack: {
            username: process.env.BROWSERSTACK_USERNAME,
            accessKey: process.env.BROWSERSTACK_ACCESS_KEY
        },
        
        customLaunchers: customLaunchers,
        
        browserNoActivityTimeout: 30000,
        
        // web server port
        port: 9876,
        
        // cli runner port
        runnerPort: 9100,
        
        // enable / disable colors in the output (reporters and logs)
        colors: true,
        
        // level of logging
        logLevel: config.LOG_INFO,
        
        client: { captureConsole: false },
        
        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 30000,
        
        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false
    };
    
    
    // Modify configuration ...
    if (isCIBuild === false) {
        // Disable code coverage on local builds
        settings.preprocessors = {};
        // Run continuously on local build
        settings.singleRun = false;
    } else {
        settings.singleRun = true;
    }
    config.set(settings);
};