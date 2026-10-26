export const DEFAULT_PROFILE=Object.freeze({playerName:'Alex',farmName:'Fazenda Girassol',sex:'male',hairColor:'#6c492d'});
export const HAIR_COLORS=Object.freeze([{value:'#3b2b23',label:'Preto'},{value:'#6c492d',label:'Castanho'},{value:'#a76a3f',label:'Ruivo'},{value:'#cfad6a',label:'Loiro'},{value:'#b8b3a8',label:'Grisalho'},{value:'#79657e',label:'Ameixa'}]);
const cleanName=(value,fallback)=>{const text=typeof value==='string'?value.replace(/[<>\u0000-\u001f\u007f]/gu,'').replace(/\s+/gu,' ').trim():'';return text?Array.from(text).slice(0,24).join(''):fallback};
const validColor=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
function normalized(value={},legacy={}){return {playerName:cleanName(value.playerName??legacy.playerName,DEFAULT_PROFILE.playerName),farmName:cleanName(value.farmName??legacy.farmName,DEFAULT_PROFILE.farmName),sex:value.sex==='female'?'female':'male',hairColor:validColor(value.hairColor)?value.hairColor.toLowerCase():DEFAULT_PROFILE.hairColor}}
export function migrateProfile(state){const value=state.profile&&typeof state.profile==='object'&&!Array.isArray(state.profile)?state.profile:{};state.profile={...value,...normalized(value,state)};return state.profile}
export function applyProfile(state,draft){
 if(!draft||typeof draft!=='object'||Array.isArray(draft))return {changed:false,message:'Preencha seu perfil para continuar.'};
 for(const [key,label]of[['playerName','Seu nome'],['farmName','Nome da fazenda']]){const v=draft[key];if(typeof v!=='string'||!v.trim())return {changed:false,message:label+' não pode ficar vazio.'};if(/[<>\u0000-\u001f\u007f]/u.test(v)||Array.from(v.trim().replace(/\s+/gu,' ')).length>24)return {changed:false,message:label+' deve ter até 24 caracteres, sem sinais < ou >.'}}
 if(!['male','female'].includes(draft.sex))return {changed:false,message:'Escolha Masculino ou Feminino.'};
 if(!validColor(draft.hairColor))return {changed:false,message:'Escolha uma cor de cabelo válida.'};
 const next=normalized(draft),current=normalized(state.profile||{},state),changed=Object.keys(next).some(key=>next[key]!==current[key]);
 state.profile={...(state.profile&&typeof state.profile==='object'&&!Array.isArray(state.profile)?state.profile:{}),...next};return {changed,message:changed?'Seu perfil está pronto. Boa vida no campo!':'Seu perfil está pronto.'};
}