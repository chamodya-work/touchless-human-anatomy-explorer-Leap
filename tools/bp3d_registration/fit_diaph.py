from fitcommon import *
import json
lungs=hub_mesh('lungs',lambda n:n.endswith('bronchopulmonary_segment'))
LP=sample(lungs,6000);ltree=cKDTree(LP)
# lung base points: lowest 30% of lung height
lo_y,hi_y=LP[:,1].min(),LP[:,1].max();LB=LP[LP[:,1]<lo_y+0.3*(hi_y-lo_y)]
DSp=sample(hub_mesh('liver',lambda n:n=='VH_M_diaphragmatic_surface'),1500)
liver=hub_mesh('liver',lambda n:n=='VH_M_liver_capsule');
D=sample(tm(['13295']),2500);Qm=(D@M0.T)*0.001;C=Qm.mean(0)
lung_xz=(LP[:,[0,2]].min(0),LP[:,[0,2]].max(0))
t0=np.array([-0.0018,-0.6943,-0.0959]);s0=0.9665
apply=make_apply(C,t0,s0)
def resid(p):
    Y,s=apply(p,Qm,True);out=[]
    dt=cKDTree(Y)
    out.append(2.0*(dt.query(DSp)[0]-0.003).clip(0))            # liver dome touches diaphragm
    # lung bases rest on / just above the diaphragm: distance to surface small; penalise lung-base points BELOW diaphragm top surface (approx: nearest diaphragm vertex above lung point)
    dd,ii=dt.query(LB);out.append(1.5*(dd-0.005).clip(0))
    below=(Y[ii,1]>LB[:,1]+0.002)  # nearest diaphragm vertex higher than lung point -> lung sinks into diaphragm
    out.append(1.0*(Y[ii,1]-LB[:,1]-0.002).clip(0)*below)
    # width match: diaphragm x/z extents ~ lung extents (+/-10mm margin)
    lo,hi=Y[:,[0,2]].min(0),Y[:,[0,2]].max(0)
    out.append(np.r_[(lo-(lung_xz[0]-0.012)),((lung_xz[1]+0.012)-hi)]*0.5)
    return np.concatenate(out)
p0=np.r_[0,0,0,np.log(s0)*np.ones(3),t0]
lo=np.r_[[-0.15]*3,np.log([0.9]*3),t0-0.05];hi=np.r_[[0.15]*3,np.log([1.2]*3),t0+0.05]
best=None
for dy in (-0.01,0,0.012,0.025):
    p=p0.copy();p[7]+=dy
    r=least_squares(resid,p,bounds=(lo,hi),loss='soft_l1',f_scale=0.01,x_scale=[0.05]*6+[0.01]*3)
    if best is None or r.cost<best.cost: best=r
p=best.x;Y,s=apply(p,Qm,True)
print('diaph rot deg',np.degrees(p[:3]).round(2),'scale',s.round(4),'t',p[6:].round(4),'cost',round(best.cost,5))
print('bbox',Y.min(0).round(3),Y.max(0).round(3),'lung bbox',LP.min(0).round(3),LP.max(0).round(3))
print('DS median d mm',np.median(cKDTree(Y).query(DSp)[0]*1000).round(1),'LB median d mm',np.median(cKDTree(Y).query(LB)[0]*1000).round(1))
json.dump({'C':C.tolist(),'s0':s0,'p':p.tolist()},open('/home/claude/diaph_reg.json','w'))
