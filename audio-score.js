// Original miniatures for Harvestão: short folk phrases, gently varied over eight bars.
// MIDI notes are absolute. Each theme is 4/4, 32 beats, quantized to eighth notes.
const major=[0,2,4,5,7,9,11],minor=[0,2,3,5,7,8,10],dorian=[0,2,3,5,7,9,10];
const rhythms={2:[[0,1.45],[2,1.7]],3:[[0,1.0],[1.5,.7],[2.5,1.15]],4:[[0,.7],[1,.7],[2,.7],[3,.7]],5:[[0,.35],[.5,.7],[1.5,.35],[2,.7],[3,.7]]};
const tone=(root,scale,degree)=>root+scale[((degree%7)+7)%7]+12*Math.floor(degree/7);
function score(id,title,tempo,key,scale,progression,phrases,soft=false){
 const melody=[];phrases.forEach((phrase,bar)=>phrase.forEach((degree,i)=>{const [offset,duration]=rhythms[phrase.length][i];melody.push(Object.freeze({beat:bar*4+offset,midi:tone(key+12,scale,degree),duration}))}));
 const chords=progression.map(degree=>Object.freeze([tone(key,scale,degree),tone(key,scale,degree+2),tone(key,scale,degree+4)]));
 return Object.freeze({id,title,tempo,key,bars:8,beats:32,soft,chords:Object.freeze(chords),melody:Object.freeze(melody)});
}
export const SCORES=Object.freeze({
 spring:score('spring','Broto da manhã',92,60,major,[0,3,1,4,5,3,4,0],[[2,4,3,1],[0,2,5],[4,6,5,3],[2,1,4],[5,7,6,4],[3,2,0],[1,3,2,1,4],[2,0]]),
 summer:score('summer','Sol no pomar',106,55,major,[0,4,5,3,1,4,3,0],[[4,2,5,4,6],[7,5,4],[2,4,6,7],[5,3,1],[4,6,5,3,2],[1,3,4],[5,4,2,1],[2,0]]),
 autumn:score('autumn','Folhas no caminho',84,53,major,[0,5,3,4,1,5,3,0],[[2,1,4],[5,3,2,0],[1,3,5],[4,2,1],[0,2,4,5],[3,2,5],[4,3,1,2],[1,0]],true),
 winter:score('winter','Luz de inverno',74,62,major,[0,3,5,4,1,3,4,0],[[4,2],[1,3,4],[5,4],[2,0,1],[2,4,5],[3,1],[4,2,1],[2,0]],true),
 village:score('village','Passos na praça',110,60,major,[0,1,4,0,3,5,1,4],[[0,2,4,1,3],[5,3,2,1],[4,6,5],[2,0,1,2],[3,5,4,2,3],[6,4,2],[1,3,5,4],[2,1,0]]),
 interior:score('interior','Lareira acesa',76,57,minor,[0,3,5,2,3,0,4,0],[[2,4,3],[1,0],[2,5,4],[3,1],[0,2,3],[4,2],[1,3,2],[1,0]],true),
 forest:score('forest','Entre galhos',82,62,dorian,[0,3,1,0,5,3,4,0],[[0,3,4],[2,1],[3,5,4],[1,0,2],[4,6,5],[3,1],[2,4,3],[1,0]],true),
 sea:score('sea','Brisa do cais',88,60,major,[0,4,3,0,5,1,4,0],[[4,5,2],[0,2,4,5],[3,1],[2,4,6],[5,3,4],[2,1],[3,4,2,1],[2,0]]),
 night:score('night','Vagalumes',68,57,minor,[0,5,3,4,0,3,5,0],[[4,2],[1,3],[5,4,2],[0,1],[2,4],[3,1],[4,2,1],[2,0]],true),
 rain:score('rain','Chuva no telhado',78,62,minor,[0,3,5,4,1,3,4,0],[[2,4,1],[0,2],[3,5,4],[2,1],[0,3,2],[4,2],[1,3,4],[2,0]],true)
});
export function chooseScore(area='farm',season=0,minutes=360,weather='sun'){
 if(['house','barn','market','chapel','library','clinic','inn','rosaHouse','fisherHouse','smithy','carpenter','mine','lighthouse'].includes(area))return 'interior';
 if(minutes>=1080||minutes<360)return 'night';
 if(weather==='rain')return 'rain';
 if(area==='village')return 'village';
 if(area==='mountain')return 'forest';
 if(area==='beach')return 'sea';
 return ['spring','summer','autumn','winter'][Number.isInteger(season)&&season>=0&&season<4?season:0];
}