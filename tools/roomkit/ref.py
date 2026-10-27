from PIL import Image
import sys
# left halves (x0..7); mirrored to make 16 wide
L = [
"....OOOO",
"...OHHhh",
"..OHHhhH",
".OHHhhHH",
".OHHHHHH",
".OHHHSSS",
".OHHSSSS",
".OHHSEWS",
".OHHSEES",
".OHHBBSS",
".OOOSSSM",
"....OOOO",
"...OOCCC",
"..OCkcCC",
"..OCkCCC",
"..OCkCCC",
"..OCkCCC",
"..OCkCCC",
"..OSOkCC",
"..OOOkCC",
"...OPPPP",
"...OPPpP",
"...OPPpP",
"...OPPpO",
"...OFFpO",
"...OFFOO",
]
def build(pal, rows=L):
    out=[]
    for r,l in enumerate(rows):
        right=l[::-1]
        if r==7: right=right.replace('E','x').replace('W','E').replace('x','W')
        right=right.replace('h','H')
        # shadow side: last H before O -> d
        right=right.replace('HO','dO') if right.endswith('HO') else right
        if r in (1,2,3,4,5,6,7,8,9): 
            rr=list(right)
            # outermost hair pixel next to O
            for i in range(len(rr)-1,-1,-1):
                if rr[i]=='O' and i>0 and rr[i-1]=='H': rr[i-1]='d'; break
            right=''.join(rr)
        out.append(l+right)
    return out
def render(rows,pal,scale=12):
    h=len(rows); w=16
    im=Image.new('RGBA',(w,h),(0,0,0,0))
    for y,r in enumerate(rows):
        assert len(r)==16,(y,len(r),r)
        for x,c in enumerate(r):
            if c in pal: im.putpixel((x,y),pal[c]+(255,))
    return im
def hx(s): s=s.lstrip('#'); return tuple(int(s[i:i+2],16) for i in (0,2,4))
def pal(hair,hairH,hairD,skin,skinS,shirt,shirtL,shirtD,pants,pantsD,shoe,shoeL=None):
    return {'O':hx('#3b2318'),'H':hx(hair),'h':hx(hairH),'d':hx(hairD),'S':hx(skin),'s':hx(skinS),
            'B':hx('#e79a86'),'E':hx('#2a1810'),'W':hx('#fff6e6'),'M':hx('#b8685a'),
            'C':hx(shirt),'c':hx(shirtL),'k':hx(shirtD),'P':hx(pants),'p':hx(pantsD),'F':hx(shoe)}
rows=build(None)
casts=[
 pal('#7a4a2a','#9a6238','#573320','#f5c9a0','#dba37a','#4f86b8','#6fa3d0','#386a98','#6a5a8a','#4e4068','#5a3a28'),
 pal('#cfc8bc','#efe9dd','#a8a094','#f5c9a0','#dba37a','#c8643c','#e0845a','#9e4a2a','#5c7a54','#44603e','#5a3a28'),
 pal('#2b1d18','#4a3328','#1b110e','#c98e62','#a8704a','#5f9a62','#80ba80','#447a48','#4a5a78','#364560','#5a3a28'),
 pal('#8a3c24','#b05a38','#642a18','#f5c9a0','#dba37a','#d8a63a','#ecc460','#b08428','#5a4a3a','#3f3328','#4a2e20'),
]
