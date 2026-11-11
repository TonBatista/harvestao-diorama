export const STARTER_TOOLS=Object.freeze(['hoe','water','sickle','axe','hammer','camera','snowShovel']);
export const PURCHASED_TOOLS=Object.freeze(['milker','shears']);
export const TOOLS=Object.freeze(['hand','hoe','water','seed','sickle','axe','hammer','camera','snowShovel',...PURCHASED_TOOLS]);

export function ownsTool(state,id){
 return STARTER_TOOLS.includes(id)||PURCHASED_TOOLS.includes(id)&&state.gathered?.['rural-economy']?.tools?.[id]===true;
}
export function validPackedTools(value){
 return Array.isArray(value)&&value.length<=STARTER_TOOLS.length+PURCHASED_TOOLS.length
  &&new Set(value).size===value.length&&value.every(id=>STARTER_TOOLS.includes(id)||PURCHASED_TOOLS.includes(id));
}
export function packedTools(state){
 const saved=validPackedTools(state.packedTools)?state.packedTools:STARTER_TOOLS;
 return TOOLS.filter(id=>saved.includes(id)&&ownsTool(state,id));
}
export function usableTools(state){
 const packed=packedTools(state);
 return TOOLS.filter(id=>id==='hand'||id==='seed'&&state.bags?.[state.seed]>0||packed.includes(id));
}
export function setToolPacked(state,id,carry){
 if(!ownsTool(state,id))return false;
 const current=packedTools(state);
 if(current.includes(id)===carry)return false;
 state.packedTools=carry?[...current,id]:current.filter(tool=>tool!==id);
 if(!carry&&state.tool===id)state.tool='hand';
 return true;
}
export function normalizeEquippedTool(state){
 if(!usableTools(state).includes(state.tool))state.tool='hand';
 return state.tool;
}
