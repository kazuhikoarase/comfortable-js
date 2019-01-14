
// globals
window.jQuery = window.$ = require(`../../../test/node_modules/jquery/dist/jquery.js`);
window.comfortable = require(`../../../src/main/ts/core/_node.ts`);

//

require(`../../../src/main/ts/core/style.css`);
require(`../../../src/main/ts/template-support/TemplateSupport.css`);

require('./style.css');

require('./spec-util.js');

require('./specs/misc.js');

require('./specs/table1.js');

require('./specs/template-table1.js');
require('./specs/template-table2.js');
require('./specs/template-table3.js');
require('./specs/template-table4.js');
