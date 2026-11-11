import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
type Person={id:string;first:string;last:string;birth:string;death:string;place:string;parent:string;notes:string;father?:string;mother?:string;partners?:string[]};
const KEY='sillage-persons-v1';
const demo:Person[]=[{id:'a',first:'Jeanne',last:'Moreau',birth:'1919',death:'1998',place:'Toulouse',parent:'',notes:'Exemple fictif'},{id:'b',first:'Louis',last:'Moreau',birth:'1947',death:'',place:'Albi',parent:'a',notes:'Exemple fictif'},{id:'c',first:'Camille',last:'Moreau',birth:'1975',death:'',place:'Toulouse',parent:'b',notes:'Exemple fictif'}];
function normalize(p:Person):Person{return {...p,parent:p.parent||'',father:p.father||'',mother:p.mother||'',partners:Array.isArray(p.partners)?p.partners:[]}}
function load():Person[]{try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');return (Array.isArray(raw)?raw:demo).map(normalize)}catch{return demo.map(normalize)}}
@Component({selector:'app-root',standalone:true,imports:[FormsModule],templateUrl:'./app.component.html',styleUrl:'./app.component.css'})
export class AppComponent {
 people=signal<Person[]>(load());query=signal('');selected=signal<string|null>(null);mode=signal<'explore'|'tree'>('explore');collapsed=signal<string[]>([]);history=signal<string[]>([]);editing=false;draft:Person|null=null;
 active=computed(()=>this.people().find(p=>p.id===this.selected())||null);
 filtered=computed(()=>this.people().filter(p=>(p.first+' '+p.last+' '+p.place).toLocaleLowerCase('fr').includes(this.query().toLocaleLowerCase('fr'))));
 name(p:Person){return p.first+' '+p.last}
 byId(id?:string){return this.people().find(p=>p.id===id)}
 parents(p:Person){const ids=[p.father,p.mother,p.parent].filter((x):x is string=>!!x);return [...new Set(ids)].map(id=>this.byId(id)).filter((x):x is Person=>!!x)}
 children(p:Person){return this.people().filter(x=>[x.father,x.mother,x.parent].includes(p.id))}
 partners(p:Person){return (p.partners||[]).map(id=>this.byId(id)).filter((x):x is Person=>!!x)}
 roots=computed(()=>{const all=this.filtered();return all.filter(p=>!this.parents(p).some(x=>all.includes(x)))});
 treeRows=computed(()=>{const matches=this.filtered();const result:{person:Person;depth:number;hasChildren:boolean}[]=[];const visited=new Set<string>();const walk=(p:Person,depth:number)=>{if(visited.has(p.id))return;visited.add(p.id);const children=this.children(p).filter(x=>matches.includes(x));result.push({person:p,depth,hasChildren:children.length>0});if(!this.collapsed().includes(p.id))children.forEach(x=>walk(x,Math.min(depth+1,10)))};this.roots().forEach(p=>walk(p,0));matches.filter(p=>!visited.has(p.id)).forEach(p=>walk(p,0));return result});
 open(id:string){if(this.selected()!==id){const old=this.selected();if(old)this.history.update(h=>[...h,old])}this.selected.set(id);this.editing=false}
 back(){const h=[...this.history()];const id=h.pop();this.history.set(h);if(id)this.selected.set(id);else this.selected.set(null);this.editing=false}
 close(){this.selected.set(null);this.editing=false;this.history.set([])}
 toggle(id:string){this.collapsed.update(a=>a.includes(id)?a.filter(x=>x!==id):[...a,id])}
 persist(){localStorage.setItem(KEY,JSON.stringify(this.people()))}
 add(){const p=normalize({id:'p'+crypto.randomUUID(),first:'Nouvelle',last:'personne',birth:'',death:'',place:'',parent:'',notes:''});this.people.update(v=>[...v,p]);this.persist();this.open(p.id);this.edit()}
 edit(){const p=this.active();if(p){this.draft={...p,partners:[...(p.partners||[])]};this.editing=true}}
 save(){const p=this.draft;if(!p||!p.first.trim()||!p.last.trim())return;const ids=[p.parent,p.father,p.mother].filter(Boolean);if(ids.some(id=>id===p.id||!this.byId(id))){alert('Un parent est invalide');return}if(p.father&&p.father===p.mother){alert('Les deux parents doivent être distincts');return}if((p.partners||[]).some(id=>id===p.id||!this.byId(id))){alert('Conjoint invalide');return}this.people.update(v=>v.map(x=>x.id===p.id?normalize(p):x));this.persist();this.editing=false}
 setPartner(id:string){if(!this.draft)return;this.draft.partners=id?[id]:[]}
 remove(){const id=this.selected();if(!id||!confirm('Supprimer cette personne ?'))return;this.people.update(v=>v.filter(x=>x.id!==id).map(x=>({...x,parent:x.parent===id?'':x.parent,father:x.father===id?'':x.father,mother:x.mother===id?'':x.mother,partners:(x.partners||[]).filter(y=>y!==id)})));this.persist();this.close()}
 export(){const url=URL.createObjectURL(new Blob([JSON.stringify({format:'sillage-v1',persons:this.people()},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='sillage-famille.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async import(e:Event){const input=e.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.format!=='sillage-v1'||!Array.isArray(data.persons)||!data.persons.every((p:Person)=>typeof p.id==='string'&&typeof p.first==='string'&&typeof p.last==='string'))throw Error('Format invalide');if(confirm('Remplacer les données locales ? Exportez une sauvegarde si nécessaire.')){this.people.set(data.persons.map(normalize));this.persist();this.close()}}catch{alert('Fichier incompatible')}finally{input.value=''}}
}