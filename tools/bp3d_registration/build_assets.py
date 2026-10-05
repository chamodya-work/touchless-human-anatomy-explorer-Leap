import sys;sys.path.insert(0,'/home/claude')
from apply_reg import *
import fast_simplification, trimesh, json, os
out='/home/claude/newassets';os.makedirs(out,exist_ok=True)
COPY_BP="BodyParts3D, (c) The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan."
def decimate(m,faces):
    v,f=fast_simplification.simplify(np.asarray(m.vertices,np.float32),np.asarray(m.faces,np.uint32),target_reduction=1-faces/len(m.faces))
    return trimesh.Trimesh(v,f,process=True)
def export(mesh,name,path,extra):
    mesh.merge_vertices();mesh.remove_unreferenced_vertices();mesh.fix_normals() if mesh.is_watertight else None
    mesh.vertex_normals  # force smooth normals
    sc=trimesh.Scene();sc.add_geometry(mesh,node_name=name,geom_name=name)
    data=sc.export(file_type='glb')
    # patch asset block with copyright/generator
    import struct
    jl=struct.unpack('<I',data[12:16])[0];j=json.loads(data[20:20+jl]);j['asset']['copyright']=COPY_BP+extra;j['asset']['generator']='BodyExplorer BP3D STL-to-GLB converter (decimated)'
    js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((4-len(js)%4)%4)
    rest=data[20+jl:]
    new=data[:8]+struct.pack('<I',12+8+len(js)+len(rest))+struct.pack('<I',len(js))+b'JSON'+js+rest
    open(path,'wb').write(new);print(name,os.path.getsize(path)//1024,'KB',len(mesh.vertices),'v',len(mesh.faces),'f')
# ---- skin
skin=trimesh.load(BP%'7163',force='mesh')
comps=skin.split(only_watertight=False);comps=sorted(comps,key=lambda c:-len(c.faces));print('skin comps',len(comps),[len(c.faces) for c in comps[:5]])
skin=comps[0]
sk=decimate(skin,70000);export(sk,'skin',out+'/skin.glb','')
# ---- stomach (registered to HuBMAP VH_M space, metres)
st=trimesh.load(BP%'7148',force='mesh');st=trimesh.Trimesh(Tst(st.vertices),st.faces,process=True)
st=trimesh.Trimesh(st.vertices,st.faces)
export(st,'stomach',out+'/stomach.glb',' Registered into the HuBMAP VH_M coordinate frame by BodyExplorer.')
# ---- diaphragm
di=trimesh.load(BP%'13295',force='mesh');di=decimate(di,26000);di=trimesh.Trimesh(Tdi(di.vertices),di.faces,process=True)
# Trim the thin crural tails below y=0.318 m (HuBMAP frame) so the part stays inside the default camera framing.
keep=di.vertices[di.faces][:,:,1].mean(1)>=0.318
print('diaphragm trim: dropped',int((~keep).sum()),'of',len(keep),'faces')
di=trimesh.Trimesh(di.vertices,di.faces[keep],process=True);di.remove_unreferenced_vertices()
export(di,'diaphragm',out+'/diaphragm.glb',' Registered into the HuBMAP VH_M coordinate frame by BodyExplorer.')
