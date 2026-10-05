import bpy, numpy as np
SRC='/tmp/zb/Z-Anatomy/Startup.blend'
GLOBE={'Sclera.r':'sclera','Cornea.r':'cornea','Iris.r':'iris','Lens.r':'lens','Retina.r':'retina','Vitreous body.r':'vitreous body',
       'Anterior chamber of eyeball.r':'anterior chamber','Zonular fibres.r':'zonular fibres'}
ORBIT={'Superior rectus muscle.r':'superior rectus','Inferior rectus muscle.r':'inferior rectus','Medial rectus muscle.r':'medial rectus',
       'Lateral rectus muscle.r':'lateral rectus','Superior oblique muscle.r':'superior oblique','Inferior oblique muscle.r':'inferior oblique',
       'Levator palpebrae superioris.r':'levator palpebrae superioris','Common tendinous ring.r':'common tendinous ring','Optic nerve (II).r':'optic nerve',
       'Lacrimal gland.r':'lacrimal gland','Lacrimal canaliculus.r':'lacrimal canaliculus','Lacrimal sac.r':'lacrimal sac','Nasolacrimal duct.r':'nasolacrimal duct'}
want=list(GLOBE)+list(ORBIT)+['Zonular fibers-curve.r']
with bpy.data.libraries.load(SRC) as (src,dst):
    missing=[n for n in want if n not in src.objects]; print('missing',missing)
    dst.objects=[n for n in want if n in src.objects]
sc=bpy.context.scene
for o in dst.objects:
    if o: sc.collection.objects.link(o)
bpy.context.view_layer.update()
dg=bpy.context.evaluated_depsgraph_get()
byname={o.name:o for o in dst.objects if o}
C=np.array(byname['Sclera.r'].matrix_world.translation,float)   # globe rotation centre (Blender world, m)
print('centre mm',C*1000)
out={}
for group,table in (('globe',GLOBE),('orbit',ORBIT)):
    for bn,clean in table.items():
        o=byname[bn];ev=o.evaluated_get(dg);m=ev.to_mesh();m.calc_loop_triangles()
        n=len(m.vertices);v=np.empty(n*3);m.vertices.foreach_get('co',v);v=v.reshape(n,3)
        mw=np.array(o.matrix_world);v=(mw[:3,:3]@v.T).T+mw[:3,3]
        t=len(m.loop_triangles);f=np.empty(t*3,np.int64);m.loop_triangles.foreach_get('vertices',f);f=f.reshape(t,3)
        v=v-C; v=np.stack([v[:,0],v[:,2],-v[:,1]],1)       # Blender Z-up,front=-Y  ->  glTF Y-up, front=+Z (handedness preserved)
        out[f'{group}|{clean}|v']=v;out[f'{group}|{clean}|f']=f
        print(f'{group:5s} {clean:30s} V{n:6d} F{t:6d} min(mm)={np.round(v.min(0)*1000,1)} max(mm)={np.round(v.max(0)*1000,1)}')
np.savez('/home/claude/eye_raw.npz',**out)
