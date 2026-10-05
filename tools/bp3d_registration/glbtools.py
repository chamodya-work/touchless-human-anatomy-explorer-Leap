import json,struct,numpy as np
CT={5120:np.int8,5121:np.uint8,5122:np.int16,5123:np.uint16,5125:np.uint32,5126:np.float32}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def load(p):
    d=open(p,'rb').read()
    l=struct.unpack('<I',d[12:16])[0]
    j=json.loads(d[20:20+l])
    off=20+l
    bl=struct.unpack('<I',d[off:off+4])[0]
    bin_=d[off+8:off+8+bl]
    return j,bin_
def acc(j,b,i):
    a=j['accessors'][i];bv=j['bufferViews'][a['bufferView']]
    dt=CT[a['componentType']];n=NC[a['type']]
    s=bv.get('byteStride')
    o=bv.get('byteOffset',0)+a.get('byteOffset',0)
    if s and s!=dt().nbytes*n:
        arr=np.ndarray((a['count'],n),dt,b,o,(s,dt().nbytes))
    else:
        arr=np.frombuffer(b,dt,a['count']*n,o).reshape(a['count'],n)
    return arr
def node_mat(n):
    if 'matrix' in n: return np.array(n['matrix']).reshape(4,4).T
    M=np.eye(4)
    if 'scale' in n: M=np.diag(list(n['scale'])+[1])@M
    if 'rotation' in n:
        x,y,z,w=n['rotation']
        R=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
        T=np.eye(4);T[:3,:3]=R;M=T@M
    if 'translation' in n:
        T=np.eye(4);T[:3,3]=n['translation'];M=T@M
    return M
def meshes(p, include=lambda name:True):
    """yield (name, verts(world, file space), faces)"""
    j,b=load(p)
    out=[]
    def walk(i,parent):
        n=j['nodes'][i];M=parent@node_mat(n)
        if 'mesh' in n and include(n.get('name','')):
            for pr in j['meshes'][n['mesh']]['primitives']:
                v=acc(j,b,pr['attributes']['POSITION']).astype(np.float64)
                v=(M[:3,:3]@v.T).T+M[:3,3]
                f=acc(j,b,pr['indices']).reshape(-1,3).astype(np.int64) if 'indices' in pr else np.arange(len(v)).reshape(-1,3)
                out.append((n.get('name',''),v,f))
        for c in n.get('children',[]): walk(c,M)
    sc=j['scenes'][j.get('scene',0)]
    for r in sc['nodes']: walk(r,np.eye(4))
    return out
def bbox(ms):
    V=np.vstack([m[1] for m in ms]);return V.min(0),V.max(0)
