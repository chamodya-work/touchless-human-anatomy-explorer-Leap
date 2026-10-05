import numpy as np, trimesh, json, struct, os
z=np.load('/home/claude/eye_raw.npz')
out='/home/claude/newassets';os.makedirs(out,exist_ok=True)
COPY=("Z-Anatomy (Gauthier Kervyn and contributors), CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/), "
      "which includes models derived from BodyParts3D, (c) The Database Center for Life Science, CC BY-SA 2.1 Japan. "
      "Eye structures extracted from the Z-Anatomy Blender template, modifiers applied, recentred on the globe rotation centre "
      "and converted to Y-up (cornea facing +Z) by BodyExplorer.")
def build(group,path):
    sc=trimesh.Scene()
    for k in sorted({k.rsplit('|',1)[0] for k in z.files if k.startswith(group+'|')}):
        name=k.split('|')[1]
        m=trimesh.Trimesh(z[k+'|v'],z[k+'|f'],process=False);m.vertex_normals
        sc.add_geometry(m,node_name=name,geom_name=name)
    data=sc.export(file_type='glb')
    jl=struct.unpack('<I',data[12:16])[0];j=json.loads(data[20:20+jl]);j['asset']['copyright']=COPY;j['asset']['generator']='BodyExplorer Z-Anatomy eye extraction'
    js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((4-len(js)%4)%4);rest=data[20+jl:]
    new=data[:8]+struct.pack('<I',12+8+len(js)+len(rest))+struct.pack('<I',len(js))+b'JSON'+js+rest
    open(path,'wb').write(new);print(path,os.path.getsize(path)//1024,'KB',len(sc.geometry),'meshes')
build('globe',out+'/eye_globe.glb');build('orbit',out+'/eye_orbit.glb')
