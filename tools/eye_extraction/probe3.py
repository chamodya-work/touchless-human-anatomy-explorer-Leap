import bpy,re,mathutils
SRC='/tmp/zb/Z-Anatomy/Startup.blend'
want=['Vitreous body.r','Optic nerve (II).r','Zonular fibres.r','Zonular fibers-curve.r','Ciliary body-curve.r','Sclera.r','Cornea.r','Iris.r','Lens.r','Retina.r','Anterior chamber of eyeball.r','Posterior segment of eyeball.r','Lateral rectus muscle.r','Lacrimal gland.r','Lacrimal sac.r','Nasolacrimal duct.r']
with bpy.data.libraries.load(SRC) as (src,dst):
    dst.objects=[n for n in want if n in src.objects]
sc=bpy.context.scene
for o in dst.objects:
    if o: 
        sc.collection.objects.link(o)
bpy.context.view_layer.update()
dg=bpy.context.evaluated_depsgraph_get()
for o in dst.objects:
    if o is None: continue
    ev=o.evaluated_get(dg)
    try: m=ev.to_mesh()
    except Exception as e: print(o.name,'no mesh',e);continue
    ws=[o.matrix_world@v.co for v in m.vertices]
    if not ws: print(o.name,'empty');continue
    mn=[min(w[i] for w in ws) for i in range(3)];mx=[max(w[i] for w in ws) for i in range(3)]
    print(f'{o.name:34s} {o.type:6s} rawV={len(o.data.vertices) if o.type=="MESH" else "-"} evalV={len(m.vertices)} F={len(m.polygons)} min=({mn[0]*1000:.1f},{mn[1]*1000:.1f},{mn[2]*1000:.1f}) max=({mx[0]*1000:.1f},{mx[1]*1000:.1f},{mx[2]*1000:.1f}) mm  parent={o.parent.name if o.parent else None} mw_t={tuple(round(x*1000,1) for x in o.matrix_world.translation)}')
