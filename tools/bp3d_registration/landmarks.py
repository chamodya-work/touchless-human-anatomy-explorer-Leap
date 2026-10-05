import sys;sys.path.insert(0,'/home/claude')
from glbtools import *
import trimesh
np.set_printoptions(precision=4,suppress=True)
BP='/tmp/bp/assets/BodyParts3D_data/stl/FMA%s.stl'
base='/home/claude/touchless-human-anatomy-explorer-Leap/assets/models/'
def bp(ids):
    ms=[trimesh.load(BP%i,force='mesh') for i in ids]
    V=np.vstack([m.vertices for m in ms]);return V
def hub(f,incl=lambda n:True):
    ms=meshes(base+f+'.glb',incl);return np.vstack([m[1] for m in ms])
def lm(V): 
    lo,hi=V.min(0),V.max(0);return lo,hi,(lo+hi)/2
if __name__=="__main__":
    for name,ids in [('liver',['7197']),('gallbladder',['7202']),('duodenum',['7206']),('pancreas',['7198nsn']),('colon',['14543nsn']),('lungR',['7333','7383','7337']),('lungL',['7370','7371']),('trachea',['7394']),('stomach',['7148']),('diaphragm',['13295']),('skin',['7163'])]:
        V=bp(ids);lo,hi,c=lm(V);print(name,len(V),'lo',lo,'hi',hi,'ctr',c)
