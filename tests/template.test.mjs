import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseTemplate} from '@angular/compiler';
const html=readFileSync(new URL('../src/app.component.html',import.meta.url),'utf8');
test('Angular template parses without control-flow or HTML errors',()=>{
 const result=parseTemplate(html,'src/app.component.html');
 assert.equal(result.errors?.length||0,0,(result.errors||[]).map(e=>e.toString()).join('\n'));
});
test('Explorer and tree navigation remain available',()=>{
 assert.match(html,/mode\(\)==='explore'/);
 assert.match(html,/treeRows\(\)/);
 assert.match(html,/parents\(p\)/);
 assert.match(html,/children\(p\)/);
 assert.match(html,/partners\(p\)/);
});
