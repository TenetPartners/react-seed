[![devDependency Status](https://david-dm.org/TenetPartners/react-seed/dev-status.svg)](https://david-dm.org/TenetPartners/react-seed#info=devDependencies)

# react-seed

A set of packages and build scripts to enable test driven development for React apps in ES6.

## Setup
Requires node and npm. `brew install node` gets you both.

1. Download [latest zip](https://github.com/TenetPartners/react-seed/archive/master.zip).
2. Rename folder to project name.
3. `cd [PROJECT NAME]`
4. `npm install`
5. `gulp`

## Build environment
Running `gulp` starts the development environment. All CSS and JS files are monitored and changes will automatically reload the browser via [browser-sync](http://www.browsersync.io/).

### CSS
Place Sass files in `./styles`. Write valid CSS and [autoprefixer](https://github.com/ai/autoprefixer) will take care of any vendor prefixes.

### JavaScript
Place your scripts in `./scripts`. Uses [browserify](http://browserify.org/articles.html) to bundle all client files together.

### Images or other assets
Create a `./assets` folder to place images, downloads, or other miscellaneous files. These will be automatically copied to the `./build` folder.

### Testing
Create a `__tests__` folder next to the scripts that you would like to run tests for. To enter test driven development mode, run `gulp tdd`. This will watch your test files and source files for changes and run tests automatically as a result. Run `gulp test` to run all tests once, or run `gulp test:coverage` for a complete code coverage report.

***
Heavily inspired from [React for Beginners](https://github.com/wesbos/React-For-Beginners-Starter-Files) and [Testing ES6 React components with Gulp + Mocha + Istanbul](https://gist.github.com/yannickcr/6129327b31b27b14efc5).
