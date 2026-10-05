from fitcommon import *
import json
bp_ref={'liver':tm(['7197']),'gallbladder':tm(['7202']),'duodenum':tm(['7206']),'pancreas':tm(['7198nsn']),'colon':tm(['14543nsn'])}
hub_ref={
 'liver':hub_mesh('liver',lambda n:n=='VH_M_liver_capsule'),
 'gallbladder':hub_mesh('gallbladder',lambda n:True),
 'duodenum':hub_mesh('small_intestine',lambda n:n in {'VH_M_duodenum_ascending','VH_M_duodenum_descending','VH_M_duodenum_horizonal','VH_M_duodenum_superior'}),
 'pancreas':hub_mesh('pancreas',lambda n:True),
 'colon':hub_mesh('large_intestine',lambda n:n in {'VH_M_ascending_colon','VH_M_descending_colon','VH_M_transverse_colon','VH_M_sigmoid_colon','VH_M_caecum','VH_M_rectum'})}
GIp=sample(hub_mesh('liver',lambda n:n=='VH_M_gastric_impression_of_liver'),800)
S=sample(tm(['7148']),1500);Qm=(S@M0.T)*0.001;C=Qm.mean(0)
bt={k:cKDTree(sample(v,8000)) for k,v in bp_ref.items()};ht={k:cKDTree(sample(v,8000)) for k,v in hub_ref.items()}
dbp={k:np.minimum(t.query(S)[0]*0.001,CAP) for k,t in bt.items()}
W={'liver':1.0,'gallbladder':0.3,'duodenum':1.0,'pancreas':1.0,'colon':0.5}
t0=np.array([-0.0018,-0.6943,-0.0959]);s0=0.9665
apply=make_apply(C,t0,s0)
def resid(p):
    Y,s=apply(p,Qm);out=[]
    for k in ht:
        d=np.minimum(ht[k].query(Y)[0],CAP);out.append(W[k]*(d-np.minimum(dbp[k]*s[0],CAP)))
    out.append(2.0*np.minimum(cKDTree(Y).query(GIp)[0]-0.004,CAP).clip(0))
    # keep clear of pancreas (4 mm margin) -> repulsion
    dp=ht['pancreas'].query(Y)[0];out.append(3.0*(0.004-dp).clip(0))
    dl=ht['liver'].query(Y)[0];out.append(1.0*(0.002-dl).clip(0))
    return np.concatenate(out)
p0=np.r_[0,0,0,np.log(s0),t0]
lo=np.r_[[-0.2]*3,np.log(0.9),t0-0.05];hi=np.r_[[0.2]*3,np.log(1.2),t0+0.05]
best=None
for dy in (-0.01,0,0.01):
  for dz in (0,0.015):
    p=p0.copy();p[5]+=dy;p[6]+=dz
    r=least_squares(resid,p,bounds=(lo,hi),loss='soft_l1',f_scale=0.01,x_scale=[0.05,0.05,0.05,0.05,0.01,0.01,0.01])
    if best is None or r.cost<best.cost: best=r
p=best.x;Y,s=apply(p,Qm)
print('stomach rot deg',np.degrees(p[:3]).round(2),'scale',s[0].round(4),'t',p[4:].round(4),'cost',round(best.cost,5))
for k in ht: print(k,'min d mm',(ht[k].query(Y)[0]*1000).min().round(1),'p5',np.percentile(ht[k].query(Y)[0]*1000,5).round(1))
print('GI median dist mm',np.median(cKDTree(Y).query(GIp)[0]*1000).round(1))
print('bbox',Y.min(0).round(3),Y.max(0).round(3))
json.dump({'C':C.tolist(),'s0':s0,'p':p.tolist()},open('/home/claude/stomach_reg.json','w'))
