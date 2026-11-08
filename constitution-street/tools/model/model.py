# Constitution Street (19 Constitution Street, Aberdeen AB24 5EU) — first-floor flats 19A and 19B.
# Traced by hand from Fairhurst structural overmarks 401918/OM1 (first floor plan) and OM2 (sections), Mar 2026.
# Drawing frame: x right, y down the sheet, metres, origin at the front-left outer corner (street at the top).
# Model frame (viewer): street at +z. X = W - xd, Z = D - yd (a 180° turn, no mirroring).
import json
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
W, D = 12.5, 10.75
def R(r):  # drawing rect -> model rect
    x0, y0, x1, y1 = r; return [round(W - x1, 3), round(D - y1, 3), round(W - x0, 3), round(D - y0, 3)]
def P(pts): return [[round(W - x, 3), round(D - y, 3)] for x, y in pts]
def poly(r): x0, z0, x1, z1 = R(r); return {'o': [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], 'h': []}
SIDE = {0: 2, 2: 0, 1: 3, 3: 1}   # drawing side -> model side (0:-z,1:+x,2:+z,3:-x)

# levels (m), pavement at the front = 0; from the cross section at 1:50
LG, UG, F1, F2, TOP = -1.70, 0.90, 4.07, 7.12, 9.75
EAVES, RIDGE, STACK = 10.12, 11.67, 12.27

FRONT_WIN = [(1.95, 3.08), (5.68, 6.90), (9.55, 10.78)]
REAR_WIN = [(1.66, 2.84), (5.58, 6.95), (7.96, 8.67), (9.65, 10.85)]
FY0, FY1 = 0.0, 0.73          # front wall (outer, inner)
RY0, RY1 = 10.16, 10.75       # rear wall (inner, outer)

def piers(y0, y1, wins, x0=0.0, x1=W):
    out, x = [], x0
    for a, b in wins:
        if a > x: out.append([x, y0, a, y1])
        x = b
    if x1 > x: out.append([x, y0, x1, y1])
    return out
EXT = piers(FY0, FY1, FRONT_WIN) + piers(RY0, RY1, REAR_WIN) + [
    [0, 0.73, 0.93, 3.98], [0, 3.98, 0.75, 10.16],                                     # left party wall
    [12.28, 0.73, 12.5, 1.41], [11.81, 1.41, 12.5, 4.30], [12.27, 4.30, 12.5, 6.45], [11.82, 6.45, 12.5, 10.16],  # right party wall
    [4.96, 6.50, 5.13, 10.16], [7.45, 6.50, 7.60, 10.16]]                               # stair enclosure
PART = [
    # flat 19A
    [0.93, 3.87, 3.24, 3.98], [4.05, 0.73, 4.20, 3.98], [4.20, 3.87, 4.27, 3.98],
    [4.74, 4.74, 4.85, 5.17], [5.60, 3.60, 5.68, 5.17], [6.55, 3.60, 7.18, 3.67],
    [3.03, 3.98, 3.17, 4.25], [3.03, 5.00, 3.17, 6.45], [0.75, 6.00, 3.17, 6.10],
    [3.17, 6.40, 3.40, 6.50], [4.13, 6.40, 4.96, 6.50], [5.13, 6.40, 5.20, 6.50], [5.80, 6.40, 6.17, 6.50],
    [4.05, 5.12, 4.74, 5.22], [5.60, 5.12, 7.18, 5.22],
    # party kit between the flats
    [7.18, 0.73, 7.48, 5.22], [6.17, 5.17, 6.50, 6.45],
    # flat 19B
    [7.48, 4.20, 8.88, 4.30], [9.64, 4.20, 11.81, 4.30],
    [8.73, 4.30, 8.81, 5.22], [7.48, 5.12, 8.81, 5.22],
    [9.67, 4.30, 9.75, 5.22], [9.67, 5.12, 10.47, 5.22], [10.47, 4.30, 10.53, 5.39], [10.47, 6.18, 10.53, 6.45],
    [6.50, 6.40, 6.52, 6.50], [7.35, 6.40, 7.45, 6.50],
    [7.60, 6.45, 8.60, 6.55], [9.33, 6.45, 9.65, 6.55], [10.38, 6.45, 11.82, 6.55], [9.45, 6.55, 9.60, 10.16]]
DIAG = [((4.74, 4.74), (5.60, 3.82))]       # angled cupboard wall beside the bedroom 2 door (19A)
TALL = [[3.45, 0.73, 4.05, 2.38], [4.20, 0.73, 4.86, 2.38], [10.55, 6.55, 11.81, 7.20], [7.48, 4.30, 8.73, 5.12],
        [11.18, 2.15, 11.81, 3.60]]
# fittings: drawing bbox + side of the wall they stand against
FIX = [('shower', [0.97, 4.03, 2.00, 4.75], 0), ('wc', [0.80, 5.40, 1.40, 5.75], 3), ('basin', [2.15, 5.70, 2.65, 6.00], 2),
       ('shower', [6.37, 4.35, 7.13, 5.04], 1), ('wc', [5.70, 4.40, 6.17, 4.90], 3), ('basin', [6.88, 3.70, 7.16, 4.15], 1),
       ('shower', [10.60, 4.38, 11.76, 5.04], 0), ('wc', [11.62, 5.55, 12.22, 5.95], 1), ('basin', [10.85, 6.10, 11.35, 6.43], 2),
       ('sink', [1.80, 6.12, 2.50, 6.70], 0), ('sink', [10.10, 3.62, 10.70, 4.18], 2)]
KIT = [(1, [1.33, 6.10, 3.03, 6.72], 'n'), (1, [0.75, 6.10, 1.33, 8.39], 'w'), (2, [9.67, 3.60, 11.18, 4.20], 's')]
HOBS = [[0.78, 7.25, 1.30, 7.82], [10.70, 3.65, 11.15, 4.15]]
# furniture (drawing centre, size along x/y, wall side)
FURN = [(1, 'bed2', 1.95, 2.55, 2.0, 1.5, 3), (1, 'bedside', 1.05, 1.55, .45, .4, 3), (1, 'bedside', 1.05, 3.55, .45, .25, 3),
        (1, 'bed2', 6.15, 2.10, 2.0, 1.45, 1), (1, 'bedside', 7.0, 1.12, .3, .4, 1),
        (1, 'sofa', 4.45, 8.35, .9, 2.2, 1), (1, 'coffee', 3.55, 8.35, .6, 1.0, 1), (1, 'dining', 2.25, 9.25, 1.1, 1.1, 0),
        (2, 'sofa', 7.95, 2.15, .9, 2.2, 3), (2, 'coffee', 8.85, 2.15, .6, 1.0, 3), (2, 'dining', 10.15, 1.75, 1.1, 1.1, 0),
        (2, 'bed1', 8.42, 9.05, 1.35, 2.0, 2), (2, 'bed2', 10.85, 8.65, 1.95, 1.45, 1), (2, 'bedside', 11.55, 7.55, .4, .4, 1)]
ROOMS = [(1, 'Bedroom 1', 2.3, 1.6), (1, 'Bedroom 2', 5.7, 1.55), (1, 'En-suite', 6.3, 4.4), (1, 'Shower room', 2.3, 5.1),
         (1, 'Hall', 3.6, 5.6), (1, 'Kitchen', 1.95, 7.1), (1, 'Lounge and dining', 3.0, 8.9),
         (2, 'Lounge', 8.6, 1.4), (2, 'Kitchen and dining', 10.4, 2.9), (2, 'Hall', 9.2, 5.75), (2, 'Shower room', 11.35, 5.5),
         (2, 'Bedroom 1', 8.5, 7.6), (2, 'Bedroom 2', 10.7, 7.75), (0, 'Landing', 6.3, 7.2)]
FLATPOLY = {1: [(0.93, 0.73), (7.18, 0.73), (7.18, 5.17), (6.17, 5.17), (6.17, 6.45), (4.96, 6.45), (4.96, 10.16), (0.75, 10.16), (0.75, 3.98), (0.93, 3.98)],
            2: [(7.48, 0.73), (12.28, 0.73), (12.28, 1.41), (11.81, 1.41), (11.81, 4.30), (12.27, 4.30), (12.27, 6.45), (11.82, 6.45), (11.82, 10.16),
                (7.60, 10.16), (7.60, 6.45), (6.50, 6.45), (6.50, 5.17), (7.48, 5.17)]}
CARPET = {1: [[0.93, 0.73, 4.05, 3.87], [4.20, 0.73, 7.18, 3.60]], 2: [[7.60, 6.55, 9.45, 10.16], [9.60, 6.55, 11.82, 10.16]]}
WET = {1: [[0.75, 3.98, 3.03, 6.00], [5.68, 3.67, 7.18, 5.12]], 2: [[10.53, 4.30, 12.27, 6.45]]}
LAMPS = [(1, 0.98, 1.85, 3), (1, 0.98, 3.25, 3), (1, 7.13, 1.45, 1), (1, 7.13, 2.75, 1), (2, 11.77, 7.95, 1), (2, 11.77, 9.35, 1), (2, 7.75, 10.1, 2), (2, 9.1, 10.1, 2)]

walls = [box(*r) for r in EXT + PART]
def flat_area(n):
    p = Polygon(FLATPOLY[n]); return round(p.area, 1)
def floor_minus(n):
    p = Polygon(FLATPOLY[n]).difference(unary_union([box(*r) for r in PART]))
    return p
L1 = {'y': F1, 'ceil': 2.6, 'top': F2, 'ext': [poly(r) for r in EXT], 'part': [poly(r) for r in PART],
      'diag': [P(list(d)) for d in DIAG], 'tall': [R(r) for r in TALL],
      'fix': [{'t': t, 'b': R(b), 'r': SIDE[s]} for t, b, s in FIX], 'hob': [R(h) for h in HOBS],
      'kit': [{'flat': f, 'b': R(b), 'side': {'n': 's', 's': 'n', 'w': 'e', 'e': 'w'}[s]} for f, b, s in KIT],
      'furn': [{'flat': f, 't': t, 'x': round(W - x, 3), 'z': round(D - y, 3), 'w': w, 'd': d, 'r': SIDE[r]} for f, t, x, y, w, d, r in FURN],
      'rooms': [{'flat': f, 'name': n, 'x': round(W - x, 2), 'z': round(D - y, 2)} for f, n, x, y in ROOMS],
      'flatFloor': {str(n): [{'o': P(FLATPOLY[n]), 'h': []}] for n in FLATPOLY},
      'carpet': {str(n): [R(r) for r in v] for n, v in CARPET.items()},
      'wet': {str(n): [R(r) for r in v] for n, v in WET.items()},
      'lamps': [{'flat': f, 'x': round(W - x, 3), 'z': round(D - y, 3), 'r': SIDE[r]} for f, x, y, r in LAMPS],
      'common': [poly([5.13, 6.50, 7.45, 7.95])], 'flats': [1, 2]}
def openings(wins, y0, y1, face, s, h):
    out = []
    for a, b in wins:
        x0, z0, x1, z1 = R([a, y0, b, y1])
        out.append({'f': face, 'x0': x0, 'x1': x1, 'k': 'win', 's': s, 'h': h, 'q': [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]})
    return out
L1['open'] = openings(FRONT_WIN, FY0, FY1, 'f', .72, 2.55) + openings(REAR_WIN, RY0, RY1, 'r', .85, 2.45)
area = {n: flat_area(n) for n in FLATPOLY}
M = {'name': 'Constitution Street', 'address': '19 Constitution Street, Aberdeen AB24 5EU', 'W': W, 'D': D,
     'lv': {'LG': LG, 'UG': UG, 'F1': F1, 'F2': F2, 'TOP': TOP, 'EAVES': EAVES, 'RIDGE': RIDGE, 'STACK': STACK},
     'frontWin': [[round(W - b, 3), round(W - a, 3)] for a, b in FRONT_WIN], 'rearWin': [[round(W - b, 3), round(W - a, 3)] for a, b in REAR_WIN],
     'front': [round(D - FY1, 3), D], 'rear': [0, round(D - RY0, 3)],
     'stair': R([5.13, 6.50, 7.45, 10.16]), 'north': 315,
     'levels': {'1': L1},
     'flats': [
        {'n': 1, 'label': '19A', 'side': 'First floor right', 'level': 1, 'beds': 2, 'area': area[1], 'bath': 'Shower room and en-suite',
         'aspect': 'Bedrooms to the street, living room to the garden', 'outside': 'Shared rear garden'},
        {'n': 2, 'label': '19B', 'side': 'First floor left', 'level': 1, 'beds': 2, 'area': area[2], 'bath': 'Shower room',
         'aspect': 'Living room to the street, bedrooms to the garden', 'outside': 'Shared rear garden'}]}
json.dump(M, open('../build/model.json', 'w'), indent=0)
open('../build/model.js', 'w').write('window.CS_MODEL=' + json.dumps(M, separators=(',', ':')) + ';\n')
print(area, {n: round(floor_minus(n).area, 1) for n in FLATPOLY})
