export async function resolve(spec, ctx, next){
  if(spec==="three") return {url:"file:///home/claude/touchless-human-anatomy-explorer-Leap/lib/three/three.module.min.js",shortCircuit:true};
  return next(spec,ctx);
}
