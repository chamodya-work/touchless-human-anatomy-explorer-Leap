import fs from "node:fs";
const ROOT="/home/claude/touchless-human-anatomy-explorer-Leap/";
const { GLTFLoader } = await import(ROOT+"lib/three/examples/jsm/loaders/GLTFLoader.js");
const MISSING=new Set(JSON.parse(process.env.MISSING||"[]"));
GLTFLoader.prototype.load=function(path,onLoad,_p,onErr){
  try{ if([...MISSING].some(m=>path.includes(m))) throw new Error("ENOENT "+path);
    const b=fs.readFileSync(ROOT+path); const ab=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
    this.parse(ab,"",onLoad,onErr);}catch(e){onErr(e)}
};
const THREE=await import(ROOT+"lib/three/three.module.min.js");
const {loadAnatomyModel,loadCombinedAnatomyModel,findSourceTag}=await import(ROOT+"src/anatomy/ModelLoader.js");
const {getModelInfo}=await import(ROOT+"src/data/modelManifest.js");
const {classifyDigestivePart}=await import(ROOT+"src/anatomy/digestiveClassifier.js");
const {classifyLungPart}=await import(ROOT+"src/anatomy/lungClassifier.js");
const {loadBodyModel}=await import(ROOT+"src/anatomy/bodyModel.js");
const box=o=>{let r=o;while(r.parent)r=r.parent;r.updateMatrixWorld(true);return new THREE.Box3().setFromObject(o)};
const f=v=>[v.x,v.y,v.z].map(n=>n.toFixed(3)).join(",");
const mode=process.env.MODE||"all";
console.error=()=>{};  // silence expected failure logs
// ---------- digestive
{
 const info=getModelInfo("digestive");
 const m=await loadCombinedAnatomyModel(info.sources,{orient:info.orient,targetSize:2.2});
 console.log("[digestive] skipped:",JSON.stringify(m.userData.skippedSources),"scale",m.scale.x.toFixed(3));
 const counts={};m.traverse(o=>{if(o.isMesh){const p=classifyDigestivePart(o.name,findSourceTag(o));counts[p]=(counts[p]||0)+1}});
 console.log("[digestive] parts:",JSON.stringify(counts));
 const st=[];m.traverse(o=>{if(o.isMesh&&classifyDigestivePart(o.name,findSourceTag(o))==="stomach")st.push(o)});
 if(st.length){const bs=box(st[0]);const all=box(m);console.log("[digestive] stomach box",f(bs.min),f(bs.max),"| whole",f(all.min),f(all.max));}
 // framing parity: without stomach
 const base=await loadCombinedAnatomyModel(info.sources.filter(s=>s.tag!=="stomach"),{orient:info.orient,targetSize:2.2});
 console.log("[digestive] scale w/ vs w/o stomach",m.scale.x.toFixed(4),base.scale.x.toFixed(4));
}
// ---------- lungs
{
 const info=getModelInfo("lungs");
 const m=await loadCombinedAnatomyModel(info.sources,{orient:info.orient,targetSize:2.0,scaleReferenceTag:info.scaleReferenceTag});
 const old=await loadAnatomyModel("assets/models/lungs.glb",{orient:"none",targetSize:2.0});
 console.log("[lungs] skipped:",JSON.stringify(m.userData.skippedSources),"scale new/old",m.scale.x.toFixed(4),old.scale.x.toFixed(4),"pos new/old",f(m.position),"/",f(old.position));
 const d=m.children.find(c=>c.userData.sourceTag==="diaphragm");
 console.log("[lungs] diaphragm group found:",!!d, d?("world box "+f(box(d).min)+" "+f(box(d).max)):"");
 const lb=box(m.children.find(c=>c.userData.sourceTag==="lungs"));console.log("[lungs] lung box",f(lb.min),f(lb.max));
 const counts={};m.traverse(o=>{if(o.isMesh){const p=classifyLungPart(o.name,findSourceTag(o));counts[p]=(counts[p]||0)+1}});
 console.log("[lungs] parts:",JSON.stringify(counts));
}
// ---------- body
{
 const b=await loadBodyModel();const bb=box(b);const s=new THREE.Vector3();bb.getSize(s);const c=new THREE.Vector3();bb.getCenter(c);
 console.log("[body] name",b.name,"size",f(s),"center",f(c));
 // facing: nose/toes should be at +z -> centroid of front-most geometry
 let zmax=-1e9,zmin=1e9;b.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();}});
 console.log("[body] z range",bb.min.z.toFixed(3),bb.max.z.toFixed(3));
}
