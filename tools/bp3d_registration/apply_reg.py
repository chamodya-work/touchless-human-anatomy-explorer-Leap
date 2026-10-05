from fitcommon import *
import json
def load_T(fn,axis):
    d=json.load(open(fn));C=np.array(d['C']);p=np.array(d['p']);ap=make_apply(C,None,d['s0'])
    return lambda V:ap(p,(V@M0.T)*0.001,axis)[0]
Tst=load_T('/home/claude/stomach_reg.json',False);Tdi=load_T('/home/claude/diaph_reg.json',True)
