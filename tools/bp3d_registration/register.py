import sys;sys.path.insert(0,'/home/claude')
from landmarks import *
def H(f,names): 
    ms=meshes(base+f+'.glb',(lambda n:n in names) if isinstance(names,set) else names)
    assert ms,(f,names)
    return np.vstack([m[1] for m in ms])
pairs={
 'liver':(bp(['7197']),H('liver',{'VH_M_right_lobe_of_liver','VH_M_left_lobe_of_liver','VH_M_quadrate_lobe_of_liver','VH_M_caudate_lobe_of_liver'}) ),
 'gallbladder':(bp(['7202']),hub('gallbladder')),
 'duodenum':(bp(['7206']),H('small_intestine',{'VH_M_duodenum_ascending','VH_M_duodenum_descending','VH_M_duodenum_horizonal','VH_M_duodenum_superior'})),
 'pancreas':(bp(['7198nsn']),hub('pancreas')),
 'colon':(bp(['14543nsn']),H('large_intestine',{'VH_M_ascending_colon','VH_M_descending_colon','VH_M_transverse_colon','VH_M_sigmoid_colon','VH_M_caecum','VH_M_rectum'})),
 'lungR':(bp(['7333','7383','7337']),H('lungs',lambda n:n.startswith('VH_M_right_') and n.endswith('bronchopulmonary_segment'))),
 'lungL':(bp(['7370','7371']),H('lungs',lambda n:n.startswith('VH_M_left_') and n.endswith('bronchopulmonary_segment'))),
}
M0=np.array([[1,0,0],[0,0,1],[0,-1,0]],float)   # bp3d (x,y,z)->(x,z,-y)
def feats(V): lo,hi=V.min(0),V.max(0);return np.stack([lo,hi,(lo+hi)/2])  # 3x3
def fit(uniform=False,keys=None):
    keys=keys or list(pairs)
    A=np.vstack([feats(pairs[k][0]@M0.T)*0.001 for k in keys]);B=np.vstack([feats(pairs[k][1]) for k in keys])
    if uniform:
        # B = s*A + t  (all axes)
        n=len(A);X=np.zeros((n*3,4));y=B.reshape(-1)
        for i in range(n):
            for ax in range(3):
                X[i*3+ax,0]=A[i,ax];X[i*3+ax,1+ax]=1
        sol=np.linalg.lstsq(X,y,rcond=None)[0];s=np.array([sol[0]]*3);t=sol[1:]
    else:
        s=np.zeros(3);t=np.zeros(3)
        for ax in range(3):
            X=np.stack([A[:,ax],np.ones(len(A))],1);sol=np.linalg.lstsq(X,B[:,ax],rcond=None)[0];s[ax],t[ax]=sol
    res=B-(A*s+t)
    return s,t,res
if __name__=="__main__":
    for u in (True,False):
        s,t,res=fit(u);print('uniform' if u else 'per-axis','s',s,'t',t,'rms mm',np.sqrt((res**2).mean(0))*1000)
    s,t,_=fit(False)
    # per-organ residual (centroid)
    for k in pairs:
        a=feats(pairs[k][0]@M0.T)*0.001*s+t;b=feats(pairs[k][1]);print(k,'ctr err mm',(a[2]-b[2])*1000,'lo err',(a[0]-b[0])*1000,'hi err',(a[1]-b[1])*1000)
