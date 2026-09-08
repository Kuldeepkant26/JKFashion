"""Key the baked-in checkerboard out of a HeroSection*.png and emit a
transparent, palette-quantised cut-out sized for the web."""
import sys
from collections import deque
from PIL import Image

def bgish(p):
    r, g, b = p
    if not (r >= 196 and g >= 200 and b >= 204):
        return False
    if b < r:                      # warm white = fabric, keep it
        return False
    return (max(p) - min(p)) <= 16

def cut(src, dst, width=1200, colors=256):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    dq = deque()

    def push(x, y):
        i = y * w + x
        if not seen[i] and bgish(px[x, y]):
            seen[i] = 1
            dq.append((x, y))

    for x in range(w):
        push(x, 0); push(x, h - 1)
    for y in range(h):
        push(0, y); push(w - 1, y)
    while dq:
        x, y = dq.popleft()
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                push(nx, ny)

    # Enclosed checker pockets the border fill cannot reach.
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0*w+x0] or not bgish(px[x0, y0]):
                continue
            comp = []; q = deque([(x0, y0)]); seen[y0*w+x0] = 2
            lo = hi = None
            while q:
                x, y = q.popleft(); comp.append((x, y))
                s = sum(px[x, y])
                lo = s if lo is None else min(lo, s)
                hi = s if hi is None else max(hi, s)
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        i = ny*w+nx
                        if not seen[i] and bgish(px[nx, ny]):
                            seen[i] = 2; q.append((nx, ny))
            mark = 1 if (len(comp) >= 400 and (hi - lo) >= 90) else 0
            for x, y in comp:
                seen[y*w+x] = mark

    # Checker that survives INSIDE fine subjects (gypsophila, foliage) is real
    # background the border fill could not squeeze into: the gaps between the
    # sprigs are only a pixel or two wide. Sweep any remaining bg-coloured pixel
    # that is reachable from an already-cleared one through such a gap, so those
    # pockets clear without touching the flowers themselves.
    for _ in range(6):
        grew = 0
        for y in range(h):
            r = y * w
            for x in range(w):
                if seen[r + x] or not bgish(px[x, y]):
                    continue
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and seen[ny*w+nx] == 1:
                        seen[r + x] = 1
                        grew += 1
                        break
        if not grew:
            break

    im.putalpha(Image.frombytes('L', (w, h), bytes(0 if m == 1 else 255 for m in seen)))

    # Drop tiny opaque islands left behind by the light checker squares.
    a = bytearray(im.split()[3].tobytes())
    done = bytearray(w * h)
    for y0 in range(h):
        for x0 in range(w):
            i0 = y0*w+x0
            if done[i0] or a[i0] == 0:
                continue
            comp = []; q = deque([(x0, y0)]); done[i0] = 1; border = False
            while q:
                x, y = q.popleft(); comp.append((x, y))
                if x in (0, w-1) or y in (0, h-1):
                    border = True
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        i = ny*w+nx
                        if not done[i] and a[i] != 0:
                            done[i] = 1; q.append((nx, ny))
                if len(comp) > 4000:
                    break
            if len(comp) < 600 and not border:
                for x, y in comp:
                    a[y*w+x] = 0
    im.putalpha(Image.frombytes('L', (w, h), bytes(a)))

    # Fine subjects (gypsophila, foliage) are ANTI-ALIASED against the
    # checkerboard: their edge pixels are a blend of flower and checker, so no
    # binary keep/drop can separate them — leave them opaque and the checker
    # shows through as grey haze; drop them and the flowers lose their edges.
    #
    # Instead, recover the true alpha. Where a still-opaque pixel is neutral and
    # sits next to cleared background, treat it as `subject over checker` and
    # solve for coverage: the further it is from the checker's tone, the more
    # subject it holds. The colour is un-premultiplied to match, so compositing
    # over ANY page background reproduces the original edge.
    CHK = 233.0                      # mean checker luminance (253 and 212)
    a2 = bytearray(im.split()[3].tobytes())
    px2 = im.load()
    edge = [(x, y) for y in range(h) for x in range(w)
            if a2[y*w+x] and bgish(px2[x, y][:3])
            and any(0 <= x+dx < w and 0 <= y+dy < h and a2[(y+dy)*w+x+dx] == 0
                    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)))]
    for x, y in edge:
        r, g, b = px2[x, y][:3]
        lum = (r + g + b) / 3.0
        cov = min(1.0, abs(lum - CHK) / CHK)      # 0 = pure checker, 1 = subject
        if cov < 0.02:
            a2[y*w+x] = 0
            continue
        # un-premultiply: recover the subject colour hidden under the blend
        un = lambda c: max(0, min(255, round((c - CHK * (1 - cov)) / cov)))
        px2[x, y] = (un(r), un(g), un(b), int(round(cov * 255)))
        a2[y*w+x] = int(round(cov * 255))
    im.putalpha(Image.frombytes('L', (w, h), bytes(a2)))

    im = im.crop(im.getbbox())
    if im.size[0] > width:
        im = im.resize((width, round(im.size[1] * width / im.size[0])), Image.LANCZOS)
    im.quantize(colors=colors, method=Image.FASTOCTREE,
                dither=Image.FLOYDSTEINBERG).save(dst, optimize=True)
    return im.size

if __name__ == '__main__':
    print(cut(sys.argv[1], sys.argv[2]))
