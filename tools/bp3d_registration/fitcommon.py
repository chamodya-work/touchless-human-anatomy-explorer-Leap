import sys;sys.path.insert(0,'/home/claude')
from register import *
from scipy.spatial import cKDTree
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation as R
def tm(ids): return trimesh.util.concatenate([trimesh.load(BP%i,force='mesh') for i in ids])
def sample(mesh,n,seed=1): return trimesh.sample.sample_surface(mesh,n,seed=seed)[0]
def hub_mesh(f,pred):
    ms=meshes(base+f+'.glb',pred)
    return trimesh.util.concatenate([trimesh.Trimesh(v,f_,process=False) for _,v,f_ in ms])
M0=np.array([[1,0,0],[0,0,1],[0,-1,0]],float)
CAP=0.04
def make_apply(C,t0,s0):
    def apply(p,X,axis_scale=False):
        rot=R.from_rotvec(p[:3]).as_matrix()
        s=np.exp(p[3:6]) if axis_scale else np.exp(p[3])*np.ones(3)
        return ((X-C)@rot.T)*s+C*s0+p[(6 if axis_scale else 4):(9 if axis_scale else 7)],s
    return apply
