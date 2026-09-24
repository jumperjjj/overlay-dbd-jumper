let state; const $=s=>document.querySelector(s);
async function load(){state=await (await fetch('/state')).json();render();}
function save(){fetch('/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});render();}
function n(side,key,d){const limits={gen:5,hook:12,first:4};state[side][key]=Math.min(limits[key],Math.max(0,state[side][key]+d));save()}
function score(side,d){let k='score'+side;state[k]=Math.max(0,state[k]+d);save()}
function resetPos(group){const m={nameA:['nameAX','nameAY'],roleA:['roleAX','roleAY'],statsA:['statsAX','statsAY'],nameB:['nameBX','nameBY'],roleB:['roleBX','roleBY'],statsB:['statsBX','statsBY']};for(const k of m[group]||[])state[k]=0;render();save()}
function resetAppearance(){Object.assign(state,{accentColor:'#ffffff',nameColor:'#ffffff',numberColor:'#ffffff',textFont:'Arial',numberFont:'Arial',bgOpacity:88,showBorder:true,textOutline:true,hudScale:100,hudY:78,outlineSize:2,shadowSize:4});render();save()}
function defaults(){
 const d={championship:'DBD CHAMPIONSHIP',teamA:'TIME A',teamB:'TIME B',overlayStyle:1,accentColor:'#ffffff',nameColor:'#ffffff',numberColor:'#ffffff',textFont:'Arial',numberFont:'Arial',bgOpacity:88,showBorder:true,textOutline:true,showRoles:true,showRoleLabels:true,killerSide:'A',showSet:true,hudScale:100,hudY:78,outlineSize:2,shadowSize:4,nameAX:0,nameAY:0,nameBX:0,nameBY:0,roleAX:0,roleAY:0,roleBX:0,roleBY:0,statsAX:0,statsAY:0,statsBX:0,statsBY:0};
 for(const [k,v] of Object.entries(d))if(state[k]===undefined)state[k]=v;
}
function render(){
 defaults();
 $('#championship').value=state.championship;$('#overlayStyle').value=state.overlayStyle;$('#accentColor').value=state.accentColor;$('#nameColor').value=state.nameColor;$('#numberColor').value=state.numberColor;
 const textFont=$('#textFont'),numberFont=$('#numberFont');if(textFont)textFont.value=state.textFont||'Arial';if(numberFont)numberFont.value=state.numberFont||'Arial';
 for(const [id,key,suffix] of [['bgOpacity','bgOpacity','%'],['hudScale','hudScale','%'],['hudY','hudY',' px'],['outlineSize','outlineSize',' px'],['shadowSize','shadowSize',' px']]){$('#'+id).value=state[key];$('#'+id+'Value').textContent=state[key]+suffix;}
 $('#showBorder').checked=state.showBorder;$('#textOutline').checked=state.textOutline;$('#showRoles').checked=state.showRoles;$('#showRoleLabels').checked=state.showRoleLabels;$('#showSet').checked=state.showSet;const kr=document.querySelector('input[name=\"killerSide\"][value=\"'+state.killerSide+'\"]');if(kr)kr.checked=true;
 $('#teamA').value=state.teamA;$('#teamB').value=state.teamB;$('#scoreA').textContent=state.scoreA;$('#scoreB').textContent=state.scoreB;
 for(const s of ['a','b'])for(const k of ['gen','hook','first'])$('#'+s+k).textContent=state[s][k];
 $('#currentSet').value=Math.max(1,Math.min(9,+state.currentSet||1));
 const posKeys=['nameAX','nameAY','roleAX','roleAY','statsAX','statsAY','nameBX','nameBY','roleBX','roleBY','statsBX','statsBY'];
 for(const key of posKeys){const el=$('#'+key);if(el){el.value=state[key]||0;const v=$('#'+key+'Value');if(v)v.textContent=(state[key]||0)+' px';}}
}
window.onload=load;
