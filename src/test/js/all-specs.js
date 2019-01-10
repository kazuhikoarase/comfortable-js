const baseDir = '../../..';

window.jQuery = window.$ = require(`../../../test/node_modules/jquery/dist/jquery.js`);

window.comfortable = require(`../../../src/main/ts/core/_node.ts`);

require(`../../../src/main/ts/core/style.css`);
require(`../../../src/main/ts/template-support/TemplateSupport.css`);


require('./specs/misc.js');

require('./style.css');


