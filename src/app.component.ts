import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
type Person={id:string;first:string;last:string;birth:string;death:string;place:string;parent:string;notes:string};
const key='sillage-persons-v1';
const demo:Person[]=[{id:'a',first:'Jeanne',last:'Moreau',birth:'1919',death:'1998',place:'Toulouse',parent:'',notes:'Exemple fictif'},{id:'b',first:'Louis',last:'Moreau',birth:'1947',death:'',place:'Albi',parent:'a',notes:'Exemple fictif'},{id:'c',first:'Camille',last:'Moreau',birth:'1975',death:'',place:'Toulouse',parent:'b',notes:'Exemple fictif'}];
function load():Person[]{try{const v=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(v)?v:demo}catch{return demo}}
@Component({selector:'app-root',standalone:true,imports:[FormsModule],templateUrl:'./app.component.html',styleUrl:'./app.component.css'})
export class AppComponent{
 people=signal<Person[]>(load());query=signal('');selected=signal<string|null>(null);editing=false;draft:Person|null=null;
 active=computed(()=>this.people().find(p=>p.id===this.selected())||null);
 filtered=computed(()=>this.people().filter(p=>(p.first+' '+p.last+' '+p.place).toLowerCase().includes(this.query().toLowerCase())));
 levels=computed(()=>{const depth=(p:Person,seen=new Set<string>()):number=>{if(!p.parent||seen.has(p.id))return 0;const parent=this.people().find(x=>x.id===p.parent);if(!parent)return 0;seen.add(p.id);return Math.min(12,1+depth(parent,seen))};const m=new Map<number,Person[]>();for(const p of this.filtered()){const d=depth(p);m.set(d,[...(m.get(d)||[]),p])}return [...m.entries()].sort((a,b)=>a[0]-b[0])});
 persist(){localStorage.setItem(key,JSON.stringify(this.people()))}
 open(id:string){this.selected.set(id);this.editing=false}
 close(){this.selected.set(null);this.editing=false}
 add(){const p:Person={id:'p'+crypto.randomUUID(),first:'Nouvelle',last:'personne',birth:'',death:'',place:'',parent:'',notes:''};this.people.update(v=>[...v,p]);this.persist();this.open(p.id);this.edit()}
 edit(){const p=this.active();if(p){this.draft={...p};this.editing=true}}
 save(){const p=this.draft;if(!p||!p.first.trim()||!p.last.trim())return;if(p.parent===p.id||p.parent&&!this.people().some(x=>x.id===p.parent)){alert('Parent invalide');return}this.people.update(v=>v.map(x=>x.id===p.id?{...p}:x));this.persist();this.editing=false}
 remove(){const id=this.selected();if(!id||!confirm('Supprimer ?'))return;this.people.update(v=>v.filter(x=>x.id!==id).map(x=>x.parent===id?{...x,parent:''}:x));this.persist();this.close()}
 export(){const url=URL.createObjectURL(new Blob([JSON.stringify({format:'sillage-v1',persons:this.people()},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='sillage.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async import(e:Event){const input=e.target as HTMLInputElement;const f=input.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(data.format!=='sillage-v1'||!Array.isArray(data.persons)||!data.persons.every((p:Person)=>typeof p.id==='string'&&typeof p.first==='string'&&typeof p.last==='string'))throw Error('Format invalide');if(confirm('Remplacer les données locales ?')){this.people.set(data.persons);this.persist();this.close()}}catch{alert('Fichier non compatible')}finally{input.value=''}}
}