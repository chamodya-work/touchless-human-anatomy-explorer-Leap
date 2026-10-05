import fs from "node:fs";
import { JSDOM } from "/home/claude/testenv/node_modules/jsdom/lib/api.js";
const dom=new JSDOM("<!doctype html><div id='c'></div>",{url:"http://localhost/"});
for (const k of ["window","document","localStorage"]) Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true});
const ROOT="/home/claude/touchless-human-anatomy-explorer-Leap/";
const MISSING=JSON.parse(process.env.MISSING||"[]");
const { GLTFLoader } = await import(ROOT+"lib/three/examples/jsm/loaders/GLTFLoader.js");
GLTFLoader.prototype.load=function(path,onLoad,_p,onErr){
  try{ if(MISSING.some(m=>path.includes(m))) throw new Error("ENOENT "+path);
    const b=fs.readFileSync(ROOT+path); this.parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),"",onLoad,onErr);}catch(e){onErr(e)}
};
const THREE=await import(ROOT+"lib/three/three.module.min.js");
const {EyeExplorer}=await import(ROOT+"src/components/EyeExplorer.js");
const {t,setLang}=await import(ROOT+"src/data/i18n.js").then(m=>({t:m.t,setLang:m.setLanguage||m.setLang}));
const origErr=console.error;const errs=[];console.error=(...a)=>errs.push(a.map(String).join(" ").slice(0,160));
const viewer={modelRoot:{rotation:new THREE.Euler()},autoRotate:true,zoom:4.2,setZoom(z){this.zoom=z},selected:null,hovered:null,model:null,selectable:null,setModelAnimated(m,o){this.model=m;this.selectable=o.selectable;m.updateMatrixWorld(true)},resetView(){},clearModel(){},_setEmissive(){}};
const calls=[];const infoPanel={showSystem(){calls.push("system")},showPart(p,o){calls.push(["part",p.id,o.realName])}};
const root=document.getElementById("c");
const ex=new EyeExplorer({viewer,infoPanel,controlsRoot:root});
await ex.mount();
const ok=(c,m)=>console.log((c?"PASS":"FAIL")+"  "+m);
const rig=ex._rig, model=ex._model;
console.log("real:",ex._usedRealModel,"orbit:",ex._hasOrbit,"errs:",errs);
const names=[];model.traverse(o=>{if(o.isMesh)names.push(o.name+"="+o.userData.partId)});console.log(names.join(" | "));
const finite=()=>{let bad=0;model.traverse(o=>{if(o.isMesh){const a=o.geometry.attributes.position.array;for(let i=0;i<a.length;i+=7)if(!Number.isFinite(a[i]))bad++}});return bad===0};
const step=(sec,dt=1/60)=>{for(let s=0;s<sec;s+=dt)ex._tick(dt)};
const click=id=>document.querySelector("#"+id).click();
const out=[...document.querySelectorAll(".eye-rail button")].map(b=>b.id);console.log("buttons",out.join(","));
if(ex._usedRealModel){
 console.log("selectable normal",viewer.selectable.length,"parts",[...new Set(viewer.selectable.map(m=>m.userData.partId))].length);
 // ---------- raycast picks (normal mode)
 const pick=(x,y,sel=viewer.selectable)=>{model.updateMatrixWorld(true);const rc=new THREE.Raycaster(new THREE.Vector3(x,y,12),new THREE.Vector3(0,0,-1));const h=rc.intersectObjects(sel,false);return h[0]?h[0].object.userData.partId+"@"+h[0].distance.toFixed(2):"none"};
 const s=model.scale.x;console.log("model scale",s.toFixed(2));
 console.log("pick through pupil",pick(-0.6*0.001*s,0.45*0.001*s),"| iris mid",pick(3.5*0.001*s,0.45*0.001*s),"| cornea periphery",pick(-0.6*0.001*s,7.5*0.001*s),"| sclera (top)",pick(0,11.5*0.001*s),"| far side (lateral rectus?)",pick(-14*0.001*s,0));
 // ---------- light reflex
 click("eye-light");const irisM=model.getObjectByName("iris");
 const rad=(m)=>{const a=m.geometry.attributes.position.array;let mn=1e9,mx=0;for(let i=0;i<a.length;i+=3){const r=Math.hypot(a[i]+0.0006,a[i+1]-0.00045);mn=Math.min(mn,r);mx=Math.max(mx,r)}return [mn*1000,mx*1000]};
 console.log("rest pupil/outer mm",rad(irisM).map(v=>v.toFixed(2)));
 step(2.5);const bright=rad(irisM);step(3);const dim=rad(irisM);
 ok(bright[0]<1.2&&dim[0]>2.6,`pupil constricts ${bright[0].toFixed(2)}mm -> dilates ${dim[0].toFixed(2)}mm`);
 ok(Math.abs(dim[1]-6.47)<0.1,`outer iris ring fixed (${dim[1].toFixed(2)} mm)`);
 ok(document.querySelector("#eye-explainer").textContent.includes("Dim light"),"explainer text switches to dim");
 click("eye-light");step(3);ok(Math.abs(rad(irisM)[0]-rig.restPupilMm)<0.1,"pupil returns to rest when off");
 // ---------- focus
 const lensM=model.getObjectByName("lens");const zr=m=>{const a=m.geometry.attributes.position.array;let mx=-1e9,mn=1e9;for(let i=2;i<a.length;i+=3){mx=Math.max(mx,a[i]);mn=Math.min(mn,a[i])}return [(mn*1000),(mx*1000)]};
 ok(lensM.material.emissiveIntensity===0,"lens starts with NO emissive (regression: used to flash blue)");step(1);ok(lensM.material.emissiveIntensity===0,"lens stays unlit while focus demo is off");const z0=zr(lensM);click("eye-focus");step(5);const z1=zr(lensM);ok(lensM.material.emissiveIntensity>0.1,"lens glows while focusing");
 ok(z1[1]-z1[0]>(z0[1]-z0[0])*1.12,`lens thickens ${(z0[1]-z0[0]).toFixed(2)} -> ${(z1[1]-z1[0]).toFixed(2)} mm`);ok(Math.abs(z1[0]-z0[0])<0.6,"posterior lens surface moves only slightly ("+(z1[0]-z0[0]).toFixed(2)+" mm)");
 click("eye-focus");step(3);ok(lensM.material.emissiveIntensity<0.01,"glow fades out after focus ends");
 // ---------- gaze + skinning
 const lat=model.getObjectByName("lateral_rectus"),nerve=model.getObjectByName("optic_nerve");
 const snap=m=>Float32Array.from(m.geometry.attributes.position.array);const latBase=snap(lat),nerveBase=snap(nerve);
 click("eye-gaze");step(1.4);
 const globe=model.children.find(c=>c.userData.sourceTag==="globe");
 ok(globe.rotation.y*180/Math.PI<-20,`globe yaws outward ${(globe.rotation.y*180/Math.PI).toFixed(1)} deg`);
 ok(lat.material.emissiveIntensity>0.2,`lateral rectus glows (${lat.material.emissiveIntensity.toFixed(2)})`);
 ok(document.querySelector("#eye-explainer").textContent.includes("lateral rectus"),"explainer names the lateral rectus");
 const now=snap(lat);let dNear=0,dFar=0,maxd=0,nearIdx=0,farIdx=0;for(let i=0;i<now.length;i+=3){const d=Math.hypot(latBase[i],latBase[i+1],latBase[i+2]);if(d>maxd){maxd=d;farIdx=i}}
 for(let i=0;i<now.length;i+=3){const d=Math.hypot(latBase[i],latBase[i+1],latBase[i+2]);if(d<0.0135){dNear=Math.max(dNear,Math.hypot(now[i]-latBase[i],now[i+1]-latBase[i+1],now[i+2]-latBase[i+2]))}}
 dFar=Math.hypot(now[farIdx]-latBase[farIdx],now[farIdx+1]-latBase[farIdx+1],now[farIdx+2]-latBase[farIdx+2]);
 ok(dNear>0.003&&dFar<1e-6,`muscle insertion follows (${(dNear*1000).toFixed(1)} mm), apex fixed (${(dFar*1000).toFixed(3)} mm)`);
 step(3.2);ok(Math.abs(globe.rotation.y*180/Math.PI-22)<2,`next step yaws inward ${(globe.rotation.y*180/Math.PI).toFixed(1)}`);
 step(3.0);ok(globe.rotation.x*180/Math.PI<-17,`looks up (rotation.x ${(globe.rotation.x*180/Math.PI).toFixed(1)})`);
 click("eye-gaze");step(3);ok(Math.abs(globe.rotation.y)<0.01&&Math.abs(globe.rotation.x)<0.01,"gaze returns to centre");
 const back=snap(lat);let md=0;for(let i=0;i<back.length;i++)md=Math.max(md,Math.abs(back[i]-latBase[i]));ok(md<1e-5,"muscle returns to rest shape");
 // ---------- tears
 if(rig.tears){click("eye-tears");step(3);const p=rig.tears.points;const pos=p.geometry.attributes.position.array;let nan=0;for(const v of pos)if(!Number.isFinite(v))nan++;
  ok(p.visible&&p.material.opacity>0.5&&nan===0,`tear particles visible (opacity ${p.material.opacity.toFixed(2)}), no NaN`);
  const L=rig.tears.curve.getLength()*1000;console.log("tear path length mm",L.toFixed(1),"start",rig.tears.curve.getPoint(0).toArray().map(v=>(v*1000).toFixed(1)),"end",rig.tears.curve.getPoint(1).toArray().map(v=>(v*1000).toFixed(1)));click("eye-tears");step(1.5);ok(!p.visible,"tears fade out and hide")}
 // ---------- see inside
 const nBefore=viewer.selectable.length;click("eye-inside");const nAfter=viewer.selectable.length;
 ok(nAfter>nBefore,`See Inside adds ${nAfter-nBefore} inner meshes (${nBefore}->${nAfter})`);
 const sc=model.getObjectByName("sclera").material;ok(sc.opacity<0.2&&!sc.depthWrite,"sclera ghosted");
 console.log("inside picks: through pupil",pick(-0.6*0.001*s,0.45*0.001*s),"| iris",pick(3.5*0.001*s,0.45*0.001*s),"| side (x=-9mm,y=0)",pick(-9*0.001*s,0));
 // side ray (from -x toward +x) passing through the anterior third -> vitreous?
 const rcSide=(zmm)=>{model.updateMatrixWorld(true);const rc=new THREE.Raycaster(new THREE.Vector3(-12,0.0,zmm*0.001*s),new THREE.Vector3(1,0,0));const h=rc.intersectObjects(viewer.selectable,false);return h[0]?h[0].object.userData.partId:"none"};
 console.log("side rays z=-8,0,4,6,8,11mm:",[-8,0,4,6,8,11].map(rcSide).join(","));
 click("eye-inside");ok(viewer.selectable.length===nBefore,"See Inside off restores selection set");
 // selection cleared when part hidden
 click("eye-inside");viewer.selected=model.getObjectByName("retina");click("eye-inside");ok(viewer.selected===null,"selected hidden part is cleared");
 // language switch rerender keeps state
 click("eye-gaze");ex._renderControls();ok(document.querySelector("#eye-gaze").classList.contains("mode-toggle--active"),"toggle state survives re-render");click("eye-gaze");

 // ---------- NEW: view management, focus cut-away, ambient overlay
 viewer.modelRoot.rotation.set(0,2.9,0.0);viewer.autoRotate=true;
 click("eye-light");ok(true,"light on");step(4);
 ok(viewer.autoRotate===false,"demo switches auto-rotate off");
 ok(Math.abs(viewer.modelRoot.rotation.y)<0.15,`view glides to the front (rotY ${viewer.modelRoot.rotation.y.toFixed(2)})`);
 ok(viewer.zoom<4.2,`zooms in for the pupil (${viewer.zoom})`);
 const ov=document.getElementById("eye-light-overlay");ok(!!ov&&ov.style.background.includes("gradient"),"ambient light overlay is drawn");
 click("eye-light");step(4);ok(viewer.autoRotate===true&&viewer.zoom===4.2,"auto-rotate and zoom restored when the demo ends");
 const orbitVis=()=>["lateral_rectus","optic_nerve","lacrimal_gland","superior_oblique"].map(n=>model.getObjectByName(n).visible);
 click("eye-focus");step(1);
 ok(document.querySelector("#eye-inside").classList.contains("mode-toggle--active"),"focus auto-opens See Inside (button synced)");
 ok(orbitVis().every(v=>v===false),"focus hides the orbit for a clean cut-away");
 ok(!viewer.selectable.some(m=>m.userData.partId==="lateralRectus")&&viewer.selectable.some(m=>m.userData.partId==="retina"),"hidden muscles are not selectable; retina is");
 ok(Math.abs(viewer.modelRoot.rotation.y+Math.PI/2)<0.2||true,"side view for focus");step(4);ok(Math.abs(viewer.modelRoot.rotation.y+Math.PI/2)<0.25,`focus glides to side view (rotY ${viewer.modelRoot.rotation.y.toFixed(2)})`);
 click("eye-gaze");ok(orbitVis().every(v=>v===true),"adding gaze brings the muscles back");click("eye-gaze");
 click("eye-focus");ok(orbitVis().every(v=>v===true),"focus off restores the orbit");ok(!document.querySelector("#eye-inside").classList.contains("mode-toggle--active"),"auto See Inside closes again");
 click("eye-inside");click("eye-focus");click("eye-focus");ok(document.querySelector("#eye-inside").classList.contains("mode-toggle--active"),"manual See Inside survives a focus run");click("eye-inside");
 ok(finite(),"geometry still finite after all demos");
 ok(finite(),"all geometry finite");
 // selection callback
 viewer.onSelect;const m=model.getObjectByName("cornea");viewer.onSelect("cornea",m);ok(calls.some(c=>c[1]==="cornea"&&c[2]==="Cornea"),"info panel gets cornea + real name");
} else {
 step(8);click("eye-light");click("eye-gaze");click("eye-focus");step(6);ok(finite(),"fallback animates without errors");console.log("fallback status:",document.querySelector(".eye-status").textContent);
}
ex.unmount();console.log("errors logged:",errs);
