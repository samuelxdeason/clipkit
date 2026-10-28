const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const postcss = require('postcss');
const root = path.resolve(__dirname, '..');
const css = postcss.parse(fs.readFileSync(path.join(root, 'packages/design-tokens/tokens.css'), 'utf8'));
const actual = [];
css.walkRules(rule => actual.push({
  selector: rule.selector,
  media: rule.parent.type === 'atrule' ? rule.parent.params : null,
  values: Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value])),
}));
const expected = JSON.parse(fs.readFileSync(path.join(root, 'packages/design-tokens/test/legacy-contract.json')));
assert.deepEqual(actual, expected, 'Legacy token values, scopes and responsive rules must remain unchanged during extraction');
console.log('Legacy token parity passed: all values and responsive scopes preserved.');
