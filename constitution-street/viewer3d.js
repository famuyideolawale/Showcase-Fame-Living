/* Constitution Street 3D viewer — 19 Constitution Street, Aberdeen (first-floor flats 19A and 19B).
   Geometry comes from window.CS_MODEL, traced from Fairhurst's structural overmarks 401918/OM1–OM2 (Mar 2026)
   for LAS Architecture. Units: metres. Constitution Street is at +z; the rear garden at -z. */
(function () {
  const M = window.CS_MODEL;
  if (!M) return;
  const LV = M.levels, CX = M.W / 2, CZ = M.D / 2 + .6, V = M.lv;
  /* ---------------- geometry helpers ---------------- */
  function Boxes() { this.p = []; this.n = []; this.i = []; this.v = 0; }
  Boxes.prototype.add = function (x0, y0, z0, x1, y1, z1) {
    if (x1 < x0) [x0, x1] = [x1, x0]; if (y1 < y0) [y0, y1] = [y1, y0]; if (z1 < z0) [z0, z1] = [z1, z0];
    if (x1 - x0 < 1e-4 || y1 - y0 < 1e-4 || z1 - z0 < 1e-4) return;
    x0 -= CX; x1 -= CX; z0 -= CZ; z1 -= CZ;
    const F = [
      [[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]],
      [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]],
      [[0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]],
      [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]],
      [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]],
      [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]]
    ];
    for (const [nn, q] of F) {
      for (const c of q) { this.p.push(c[0], c[1], c[2]); this.n.push(nn[0], nn[1], nn[2]); }
      const v = this.v; this.i.push(v, v + 1, v + 2, v, v + 2, v + 3); this.v += 4;
    }
  };
  Boxes.prototype.rect = function (r, y0, y1) { this.add(r[0], y0, r[1], r[2], y1, r[3]); };
  Boxes.prototype.mesh = function (mat) {
    if (!this.v) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setIndex(this.v > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    const m = new THREE.Mesh(g, mat); m.castShadow = false; m.receiveShadow = false; return m;
  };
  // subtract hole rects from a list of rects
  function subtract(rs, holes) {
    let out = rs.slice();
    for (const h of holes) {
      const nx = [];
      for (const r of out) {
        if (r[2] <= h[0] || r[0] >= h[2] || r[3] <= h[1] || r[1] >= h[3]) { nx.push(r); continue; }
        if (r[1] < h[1]) nx.push([r[0], r[1], r[2], h[1]]);
        if (r[3] > h[3]) nx.push([r[0], h[3], r[2], r[3]]);
        const z0 = Math.max(r[1], h[1]), z1 = Math.min(r[3], h[3]);
        if (r[0] < h[0]) nx.push([r[0], z0, h[0], z1]);
        if (r[2] > h[2]) nx.push([h[2], z0, r[2], z1]);
      }
      out = nx;
    }
    return out;
  }

  /* ---------------- materials ---------------- */
  const std = (c, o) => { const m = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .88, metalness: 0 }, o || {})); m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); return m; };
  function makeMats() {
    const m = {
      render: std('#a3a5a6', { roughness: .92 }), granite: std('#a7a9aa', { roughness: .92 }), rubble: std('#8f8e8a', { roughness: .95 }), dressed: std('#b9babb', { roughness: .85 }),
      core: std('#f3f1ed'), part: std('#f7f5f1'), slab: std('#c9c6c0'), voidM: std('#15181c', { roughness: 1 }),
      fascia: std('#3a3f45', { roughness: .6 }), doorGrey: std('#1f2a26', { roughness: .45 }), sill: std('#c4c5c5'), lead: std('#5d6268', { roughness: .5 }),
      slate: std('#4a5056', { roughness: .75 }), chimney: std('#9d9fa0'), pot: std('#a8603f', { roughness: .8 }), iron: std('#16181a', { roughness: .5, metalness: .4 }),
      wood: std('#c8a57c', { roughness: .7 }), woodMuted: std('#d9d6d0'), carpet: std('#9c9187', { roughness: 1 }), carpetMuted: std('#d3d0cb'),
      wetFloor: std('#5b4a3c', { roughness: .6 }), terrazzo: std('#ece6df', { roughness: .45 }), tile: std('#d3dadd', { roughness: .5 }), stone: std('#d4d0c9'),
      glass: std('#a9cbe0', { transparent: true, opacity: .26, roughness: .05, metalness: .1, depthWrite: false }),
      frame: std('#f4f4f2', { roughness: .5 }), unit: std('#eeeeec', { roughness: .4 }), top: std('#2f3338', { roughness: .4 }), black: std('#16191c', { roughness: .3 }),
      steel: std('#c9a55a', { roughness: .3, metalness: .7 }), white: std('#f8f7f4', { roughness: .35 }),
      sofa: std('#5b6670'), linen: std('#f2efea'), throw: std('#8a5a7a'), furnWood: std('#b48a5c', { roughness: .7 }),
      chair: std('#2e3338', { roughness: .6 }), rug: std('#cbc3b6'), stair: std('#bcb6ac'), rail: std('#2a2f34', { roughness: .4, metalness: .4 }),
      paving: std('#a29f98'), kerb: std('#8d8a84'), road: std('#4c5156'), yard: std('#8f8b84'), grass: std('#7f9470'),
      shrub: std('#5f7a52'), shrub2: std('#6d8a5c'), stoneL: std('#9fa09f'), stoneR: std('#a8a7a3'), shop: std('#2d3d4a'), nbWin: std('#3f474f', { roughness: .3 }),
      bulb: new THREE.MeshBasicMaterial({ color: 0xffd9a0 })
    };
    m.renderDS = std('#a3a5a6', { side: THREE.DoubleSide });
    m.slate.side = THREE.DoubleSide; m.granite.side = THREE.DoubleSide; m.rubble.side = THREE.DoubleSide;
    return m;
  }

  /* ---------------- canvas textures ---------------- */
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function signTex(text) {
    return canvasTex(1024, 76, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.fillStyle = '#e9dcc0'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '600 56px Georgia, "Times New Roman", serif'; g.fillText(text.split('').join(String.fromCharCode(8202)), w / 2, h / 2 + 2);
    });
  }
  function panoramaTex() {
    // Aberdeen's granite tenements and spires, with the harbour and the sea beyond
    return canvasTex(4096, 512, (g, w, h) => {
      const sky = g.createLinearGradient(0, 0, 0, 300); sky.addColorStop(0, '#93aec2'); sky.addColorStop(1, '#e4e9ec');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#8a97a3'; g.beginPath(); g.moveTo(0, 300); for (let x = 0; x <= w; x += 40) g.lineTo(x, 286 - 16 * Math.sin(x / 260) - 8 * Math.sin(x / 90)); g.lineTo(w, 340); g.lineTo(0, 340); g.fill();
      g.fillStyle = '#6f8ea4'; g.fillRect(0, 300, w, 22);
      for (let i = 0; i < 90; i++) {
        const x = (i * 47) % w, bw = 40 + (i * 37) % 60, bh = 30 + (i * 53) % 80;
        g.fillStyle = ['#a9abad', '#9a9c9e', '#8c8e90'][i % 3]; g.fillRect(x, 340 - bh, bw, bh + 200);
        g.fillStyle = '#5d676f'; for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) g.fillRect(x + 6 + k * (bw / 3.4), 350 - bh + r * 24, 8, 13);
        if (i % 17 === 3) { g.fillStyle = '#7f7a74'; g.beginPath(); g.moveTo(x + bw / 2 - 6, 340 - bh); g.lineTo(x + bw / 2, 270 - bh); g.lineTo(x + bw / 2 + 6, 340 - bh); g.fill(); }
      }
      g.fillStyle = '#7d858b'; g.fillRect(0, 470, w, 42);
    });
  }
  /* ---------------- polygon prisms (walls traced from the drawings are not axis-aligned) ---------------- */
  function Prisms() { this.p = []; this.n = []; }
  Prisms.prototype.tri = function (a, b, c, n) {
    // a,b,c: [x,y,z] in plan metres; n: outward normal; winding fixed to match n
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (!n) { const l = Math.hypot(cx, cy, cz) || 1; n = [cx / l, cy / l, cz / l]; }
    if (cx * n[0] + cy * n[1] + cz * n[2] < 0) { const t = b; b = c; c = t; }
    for (const q of [a, b, c]) { this.p.push(q[0] - CX, q[1], q[2] - CZ); this.n.push(n[0], n[1], n[2]); }
  };
  Prisms.prototype.poly = function (ring, holes, y0, y1) {
    if (!ring || ring.length < 3 || y1 - y0 < 1e-4) return;
    const V2 = p => new THREE.Vector2(p[0], p[1]);
    let C = ring.map(V2); if (THREE.ShapeUtils.isClockWise(C)) C.reverse();
    const Hs = (holes || []).filter(h => h.length > 2).map(h => { const a = h.map(V2); if (!THREE.ShapeUtils.isClockWise(a)) a.reverse(); return a; });
    const all = C.concat(...Hs), tris = THREE.ShapeUtils.triangulateShape(C, Hs);
    for (const t of tris) {
      const [a, b, c] = t.map(i => all[i]);
      this.tri([a.x, y1, a.y], [b.x, y1, b.y], [c.x, y1, c.y], [0, 1, 0]);
      this.tri([a.x, y0, a.y], [b.x, y0, b.y], [c.x, y0, c.y], [0, -1, 0]);
    }
    const loops = [C].concat(Hs), test = [ring].concat(holes || []);
    for (const lp of loops) for (let i = 0; i < lp.length; i++) {
      const p = lp[i], q = lp[(i + 1) % lp.length], dx = q.x - p.x, dz = q.y - p.y, l = Math.hypot(dx, dz); if (l < 1e-5) continue;
      let n = [dz / l, 0, -dx / l];
      const mx = (p.x + q.x) / 2 + n[0] * .004, mz = (p.y + q.y) / 2 + n[2] * .004;
      if (inPoly(mx, mz, ring, holes)) n = [-n[0], 0, -n[2]];
      this.tri([p.x, y0, p.y], [q.x, y0, q.y], [q.x, y1, q.y], n); this.tri([p.x, y0, p.y], [q.x, y1, q.y], [p.x, y1, p.y], n);
    }
  };
  Prisms.prototype.face = function (pts, flipUp) {   // planar convex 3D polygon [[x,y,z]…], normal points up (or out)
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[0], b = pts[i], c = pts[i + 1];
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; const l = Math.hypot(...n) || 1; n = n.map(v => v / l);
      if ((flipUp !== false) && n[1] < 0) n = n.map(v => -v);
      this.tri(a, b, c, n);
    }
  };
  Prisms.prototype.quadBox = function (p0, p1, th, y0, y1, off) {   // box along segment p0→p1 with thickness th, offset sideways by off
    const dx = p1[0] - p0[0], dz = p1[1] - p0[1], l = Math.hypot(dx, dz); if (l < 1e-4) return;
    const nx = -dz / l, nz = dx / l, o = off || 0, h = th / 2;
    const q = [[p0[0] + nx * (o - h), p0[1] + nz * (o - h)], [p1[0] + nx * (o - h), p1[1] + nz * (o - h)], [p1[0] + nx * (o + h), p1[1] + nz * (o + h)], [p0[0] + nx * (o + h), p0[1] + nz * (o + h)]];
    this.poly(q, [], y0, y1);
  };
  Prisms.prototype.mesh = function (mat) {
    if (!this.p.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    return new THREE.Mesh(g, mat);
  };
  function inPoly(x, z, ring, holes) {
    const inside = r => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, zi] = r[i], [xj, zj] = r[j]; if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) c = !c; } return c; };
    if (!inside(ring)) return false; for (const h of holes || []) if (inside(h)) return false; return true;
  }
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const centroid = r => r.reduce((s, p) => [s[0] + p[0] / r.length, s[1] + p[1] / r.length], [0, 0]);
  function distToFoot(x, z) {
    const F = M.foot; let d = 1e9;
    for (let i = 0; i < F.length; i++) { const a = F[i], b = F[(i + 1) % F.length], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); d = Math.min(d, Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz)); }
    return d;
  }


  /* ---------------- the tenement ---------------- */
  const W = M.W, D = M.D, FZ = M.front, RZ = M.rear;            // front wall z (inner, outer), rear wall z (outer, inner)
  const add = (P, k) => P[k] || (P[k] = new Prisms());
  const rect = (pr, r, y0, y1) => pr.poly([[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]], [], y0, y1);
  const meshAll = (P, mats, g) => { for (const k in P) { const m = P[k].mesh(mats[k]); if (m) { m.userData.kind = k; g.add(m); } } };
  // one storey of a facade: piers between the windows, sills, heads, frames and glass. face: 'f' front, 'r' rear
  function facade(P, face, y0, y1, wins, s, h, opt) {
    opt = opt || {};
    const [z0, z1] = face === 'f' ? FZ : RZ, mat = face === 'f' ? 'granite' : 'rubble', zg = face === 'f' ? z0 + .18 : z1 - .18, out = face === 'f' ? 1 : -1;
    let x = 0;
    wins = wins.slice().sort((p, q) => p[0] - q[0]);
    wins.forEach(([a, b], i) => {
      if (a > x) rect(add(P, mat), [x, z0, a, z1], y0, y1);
      x = b;
      const door = opt.door === i, sh = door ? 0 : s, hh = door ? opt.doorH : h;
      if (sh > 0) rect(add(P, mat), [a, z0, b, z1], y0, y0 + sh);
      rect(add(P, mat), [a, z0, b, z1], y0 + hh, y1);
      if (face === 'f') {   // dressed granite margins and a projecting sill
        rect(add(P, 'dressed'), [a - .14, z1 - .02, a, z1 + .04], y0 + sh, y0 + hh + .14); rect(add(P, 'dressed'), [b, z1 - .02, b + .14, z1 + .04], y0 + sh, y0 + hh + .14);
        rect(add(P, 'dressed'), [a - .14, z1 - .02, b + .14, z1 + .04], y0 + hh, y0 + hh + .14);
      }
      if (sh > 0) rect(add(P, 'sill'), [a - .08, zg - .1 * out, b + .08, face === 'f' ? z1 + .08 : z0 - .08], y0 + sh - .08, y0 + sh);
      if (door) {
        rect(add(P, 'doorGrey'), [a + .12, zg - .03, b - .12, zg + .03], y0, y0 + 2.35);
        rect(add(P, 'glass'), [a + .12, zg - .01, b - .12, zg + .01], y0 + 2.45, y0 + hh - .05);
        rect(add(P, 'frame'), [a + .05, zg - .04, b - .05, zg + .04], y0 + 2.35, y0 + 2.45);
        return;
      }
      if (opt.voidBehind) rect(add(P, 'voidM'), [a, face === 'f' ? z0 - .25 : z1 + .2, b, face === 'f' ? z0 - .2 : z1 + .25], y0 + sh, y0 + hh);
      rect(add(P, 'glass'), [a + .06, zg - .01, b - .06, zg + .01], y0 + sh + .05, y0 + hh - .05);
      // white uPVC sash: frame, meeting rail and side jambs
      const fr = (r, yy0, yy1) => rect(add(P, 'frame'), r, yy0, yy1);
      fr([a, zg - .04, b, zg + .04], y0 + sh, y0 + sh + .07); fr([a, zg - .04, b, zg + .04], y0 + hh - .07, y0 + hh);
      const mid = y0 + sh + (hh - sh) * .52; fr([a, zg - .04, b, zg + .04], mid - .035, mid + .035);
      fr([a, zg - .04, a + .07, zg + .04], y0 + sh, y0 + hh); fr([b - .07, zg - .04, b, zg + .04], y0 + sh, y0 + hh);
    });
    if (W > x) rect(add(P, mat), [x, z0, W, z1], y0, y1);
  }
  // party (gable) walls, the floor slab and a dark interior so the windows of the other flats read as rooms
  function storeyShell(P, y0, y1, opt) {
    rect(add(P, 'rubble'), [0, RZ[1], .75, FZ[0]], y0, y1); rect(add(P, 'rubble'), [W - .7, RZ[1], W, FZ[0]], y0, y1);
    rect(add(P, 'slab'), [.75, RZ[1], W - .7, FZ[0]], y0 - .3, y0);
    if (opt && opt.solid) rect(add(P, 'voidM'), [.95, RZ[1] + .3, W - .9, FZ[0] - .3], y0 + .02, y1 - .32);
  }
  const STOREYS = [
    { k: 'LG', y0: V.LG, y1: V.UG, s: .95, h: 2.25 },
    { k: 'UG', y0: V.UG, y1: V.F1, s: .75, h: 2.75, door: 1, doorH: 2.95 },
    { k: 'F2', y0: V.F2, y1: V.TOP, s: .72, h: 2.45 }];
  function buildStorey(st, mats) {
    const g = new THREE.Group(), P = {};
    storeyShell(P, st.y0, st.y1, { solid: true });
    facade(P, 'f', st.y0, st.y1, M.frontWin, st.s, st.h, { door: st.door, doorH: st.doorH, voidBehind: true });
    facade(P, 'r', st.y0, st.y1, M.rearWin, st.s + .1, st.h - .1, { voidBehind: true });
    if (st.k === 'F2') { rect(add(P, 'slab'), [.75, RZ[1], W - .7, FZ[0]], st.y1 - .3, st.y1); }
    meshAll(P, mats, g); g.userData.storey = st.k; return g;
  }

  /* ---------------- the first floor: flats 19A and 19B ---------------- */
  function buildLevel(L, mats, opt) {
    opt = opt || {};
    const lv = LV[L], y = lv.y, top = lv.top, grp = new THREE.Group(); grp.userData.level = L;
    const P = {}, p = k => add(P, k), B = {}, b = k => (B[k] = B[k] || new Boxes());
    storeyShell(P, y, top);
    facade(P, 'f', y, top, M.frontWin, .72, 2.55); facade(P, 'r', y, top, M.rearWin, .85, 2.45);
    lv.ext.forEach(w => { const c = centroid(w.o); if (c[1] > 1 && c[1] < D - 1 && c[0] > 1 && c[0] < W - 1) p('core').poly(w.o, w.h, y, y + lv.ceil); });   // stair enclosure walls
    lv.part.forEach(w => p('part').poly(w.o, w.h, y, y + lv.ceil));
    (lv.diag || []).forEach(([a, c]) => p('part').quadBox(a, c, .1, y, y + lv.ceil, 0));
    // linings: party-wall faces inside the flats
    rect(p('part'), [.75, RZ[1], .95, FZ[0]], y, y + lv.ceil); rect(p('part'), [W - .95, RZ[1], W - .7, FZ[0]], y, y + lv.ceil);
    // floors: oak in living rooms and halls, carpet in the bedrooms, wood-effect vinyl in the shower rooms
    const focus = opt.focusFlat || 0, fg = new THREE.Group(); fg.userData.floors = true;
    for (const n in lv.flatFloor) {
      const fp = new Prisms(); lv.flatFloor[n].forEach(s => fp.poly(s.o, s.h, y + .001, y + .014));
      const m = fp.mesh(focus && +n !== focus ? mats.woodMuted : mats.wood); if (m) { m.userData.flat = +n; m.userData.level = L; fg.add(m); }
      const cp = new Prisms(); (lv.carpet[n] || []).forEach(r => rect(cp, r, y + .014, y + .024));
      const cm = cp.mesh(focus && +n !== focus ? mats.carpetMuted : mats.carpet); if (cm) { cm.userData.flat = +n; cm.userData.level = L; fg.add(cm); }
      const wp = new Prisms(); (lv.wet[n] || []).forEach(r => rect(wp, r, y + .014, y + .022));
      const wm = wp.mesh(focus && +n !== focus ? mats.woodMuted : mats.wetFloor); if (wm) { wm.userData.flat = +n; wm.userData.level = L; fg.add(wm); }
    }
    grp.add(fg); grp.userData.floorGroup = fg;
    lv.common.forEach(s => p('stone').poly(s.o, s.h, y + .001, y + .012));
    if (opt.detail !== false) {
      // terrazzo-panelled shower rooms (as finished): wall linings up to the ceiling
      for (const n in lv.wet) lv.wet[n].forEach(r => {
        const t = .025, h0 = y + .02, h1 = y + lv.ceil - .02;
        rect(p('terrazzo'), [r[0], r[1], r[2], r[1] + t], h0, h1); rect(p('terrazzo'), [r[0], r[3] - t, r[2], r[3]], h0, h1);
        rect(p('terrazzo'), [r[0], r[1], r[0] + t, r[3]], h0, h1); rect(p('terrazzo'), [r[2] - t, r[1], r[2], r[3]], h0, h1);
      });
      lv.fix.forEach(f => {
        const [x0, z0, x1, z1] = f.b; const g = { x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, r: f.r, t: f.t };
        if (f.t === 'sink') { b('steel').rect([g.x - .22, g.z - .18, g.x + .22, g.z + .18], y + .9, y + .915); return; }
        fixture(g, y, b);
        if (f.t === 'shower') { const s = sideRect(g, .04); b('steel').rect([s[0], s[1], s[2], s[3]], y + 1.0, y + 1.04); }   // brass rail
      });
      (lv.hob || []).forEach(r => b('black').rect([r[0] + .03, r[1] + .03, r[2] - .03, r[3] - .03], y + .9, y + .912));
      lv.kit.forEach(k => {
        const r = k.b; b('unit').rect(r, y, y + .86); b('top').rect([r[0] - .01, r[1] - .01, r[2] + .01, r[3] + .01], y + .86, y + .9);
        const back = .35, wu = k.side === 'n' ? [r[0], r[1], r[2], r[1] + back] : k.side === 's' ? [r[0], r[3] - back, r[2], r[3]] : k.side === 'e' ? [r[2] - back, r[1], r[2], r[3]] : k.side === 'w' ? [r[0], r[1], r[0] + back, r[3]] : null;
        if (wu) b('unit').rect(wu, y + 1.45, y + 2.15);
      });
      lv.tall.forEach(r => b('unit').rect(r, y, y + 2.2));
      lv.furn.forEach(f => furniture(f, y, b));
      // black cage wall lights over the beds, as fitted
      (lv.lamps || []).forEach(l => {
        const o = { 0: [0, .1], 2: [0, -.1], 1: [-.1, 0], 3: [.1, 0] }[l.r] || [0, 0];
        b('iron').rect([l.x - .06 + o[0] * .3, l.z - .06 + o[1] * .3, l.x + .06 + o[0] * .3, l.z + .06 + o[1] * .3], y + 1.42, y + 1.62);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), mats.bulb); bulb.position.set(l.x + o[0] * .3 - CX, y + 1.5, l.z + o[1] * .3 - CZ); grp.add(bulb);
      });
    }
    meshAll(P, mats, grp);
    for (const k in B) { const m = B[k].mesh(mats[k]); if (m) { m.userData.kind = k; grp.add(m); } }
    return grp;
  }

  /* common stair: scale-and-platt flights round a well, lit from the rear window */
  function buildStair(mats, maxY) {
    const g = new THREE.Group(), st = new Boxes(), [sx0, sz0, sx1, sz1] = M.stair, mid = (sx0 + sx1) / 2;
    const flight = (xa, xb, ya, yb, za, zb) => { const n = 12; for (let k = 0; k < n; k++) { const t = ya + (k + 1) * (yb - ya) / n, z = za + (zb - za) * k / n, z2 = za + (zb - za) * (k + 1) / n; st.add(xa, t - .32, Math.min(z, z2), xb, t, Math.max(z, z2)); } };
    const F1 = V.F1, down = (V.UG + F1) / 2, up = (F1 + V.F2) / 2;
    flight(mid + .08, sx1, F1, down, sz1 - 1.5, sz0 + .85);              // down to the half landing behind
    st.add(sx0, down - .2, sz0, sx1, down, sz0 + .85);
    if (maxY > F1 + .5) { flight(sx0, mid - .08, F1, Math.min(up, maxY), sz1 - 1.5, sz0 + .85); if (maxY >= up) st.add(sx0, up - .2, sz0, sx1, up, sz0 + .85); }
    const m = st.mesh(mats.stair); if (m) g.add(m);
    const rl = new Boxes(); rl.add(mid - .05, F1, sz0 + .85, mid + .05, F1 + .95, sz1 - 1.5); g.add(rl.mesh(mats.rail));
    return g;
  }

  /* slate roof between the granite gables, with the chimney stacks on the party walls */
  function buildRoof(mats) {
    const g = new THREE.Group(), s = new Prisms(), gw = new Prisms(), c = new Prisms(), zr = D / 2, ov = .3;
    s.face([[-.05, V.EAVES, D + ov], [W + .05, V.EAVES, D + ov], [W + .05, V.RIDGE, zr], [-.05, V.RIDGE, zr]]);
    s.face([[-.05, V.RIDGE, zr], [W + .05, V.RIDGE, zr], [W + .05, V.EAVES, -ov], [-.05, V.EAVES, -ov]]);
    [[-.02, .72], [W - .72, W + .02]].forEach(([x0, x1]) => {
      gw.poly([[x0, -ov], [x1, -ov], [x1, D + ov], [x0, D + ov]], [], V.TOP, V.EAVES + .05);
      [x0, x1].forEach(x => gw.face([[x, V.EAVES + .05, D + ov], [x, V.RIDGE + .12, zr], [x, V.EAVES + .05, -ov]], false));
      gw.face([[x0, V.EAVES + .05, D + ov], [x1, V.EAVES + .05, D + ov], [x1, V.RIDGE + .12, zr], [x0, V.RIDGE + .12, zr]]);
      gw.face([[x0, V.RIDGE + .12, zr], [x1, V.RIDGE + .12, zr], [x1, V.EAVES + .05, -ov], [x0, V.EAVES + .05, -ov]]);
      c.poly([[x0, 3.46], [x1, 3.46], [x1, 6.45], [x0, 6.45]], [], V.RIDGE - .6, V.STACK);
      c.poly([[x0 - .06, 3.4], [x1 + .06, 3.4], [x1 + .06, 6.51], [x0 - .06, 6.51]], [], V.STACK - .12, V.STACK);
    });
    // cornice and cast-iron gutter along both eaves
    const cr = new Prisms(); rect(cr, [.7, D - .05, W - .7, D + .32], V.TOP, V.EAVES - .02); rect(cr, [.7, -.32, W - .7, .05], V.TOP, V.EAVES - .02);
    const gu = new Prisms(); rect(gu, [.7, D + .3, W - .7, D + .42], V.EAVES - .14, V.EAVES); rect(gu, [.7, -.42, W - .7, -.3], V.EAVES - .14, V.EAVES);
    [[s, mats.slate], [gw, mats.rubble], [c, mats.chimney], [cr, mats.dressed], [gu, mats.iron]].forEach(([q, m]) => { const me = q.mesh(m); if (me) g.add(me); });
    // ridge capping and the pots on each stack
    const rc = new Prisms(); rc.quadBox([.7, zr], [W - .7, zr], .22, V.RIDGE - .04, V.RIDGE + .08, 0); const rm = rc.mesh(mats.fascia); if (rm) g.add(rm);
    const pg = new THREE.CylinderGeometry(.11, .13, .5, 12);
    [.36, W - .36].forEach(x => { for (let i = 0; i < 6; i++) { const pt = new THREE.Mesh(pg, mats.pot); pt.position.set(x - CX, V.STACK + .25, 3.75 + i * .48 - CZ); g.add(pt); } });
    return g;
  }

  /* street, basement area with railings, front steps, rear garden and the neighbouring tenements */
  function buildSite(mats) {
    const g = new THREE.Group(), P = {}, A = .0, AREA = D + 1.5, X0 = -14, X1 = W + 14;
    rect(add(P, 'paving'), [X0, AREA, X1, AREA + 2.6], -.15, A);
    rect(add(P, 'kerb'), [X0, AREA + 2.6, X1, AREA + 2.75], -.27, -.03);
    rect(add(P, 'road'), [X0, AREA + 2.75, X1, AREA + 10], -.32, -.15);
    rect(add(P, 'paving'), [X0, AREA + 10, X1, AREA + 12], -.15, A);
    rect(add(P, 'yard'), [-.2, D, W + .2, AREA], V.LG - .3, V.LG);                       // sunken basement area
    rect(add(P, 'rubble'), [-.2, AREA - .3, W + .2, AREA], V.LG, A - .02);              // area retaining wall
    rect(add(P, 'dressed'), [-.2, AREA - .34, W + .2, AREA + .02], A - .02, A + .3);     // cope with railings on top
    // front steps up to the close door, bridging the area
    const [da, db] = M.frontWin.slice().sort((p, q) => p[0] - q[0])[1], n = 5;
    rect(add(P, 'dressed'), [da - .3, D, db + .3, AREA + .02], V.UG - .2, V.UG);
    for (let k = 0; k < n; k++) rect(add(P, 'dressed'), [da - .3, AREA + k * .3, db + .3, AREA + (k + 1) * .3], A, V.UG - (k + 1) * (V.UG / (n + 1)));
    // rear garden at basement level, with rubble boundary walls
    rect(add(P, 'grass'), [-.2, -14, W + .2, 0], V.LG - .3, V.LG);
    rect(add(P, 'rubble'), [-.45, -14, -.2, 0], V.LG, V.LG + 1.8); rect(add(P, 'rubble'), [W + .2, -14, W + .45, 0], V.LG, V.LG + 1.8); rect(add(P, 'rubble'), [-.45, -14.25, W + .45, -14], V.LG, V.LG + 1.8);
    meshAll(P, mats, g);
    // cast-iron railings along the area
    const rl = new Boxes(); for (let x = -.1; x < W + .1; x += .14) if (x < da - .35 || x > db + .35) rl.add(x, A + .3, AREA - .19, x + .025, A + 1.25, AREA - .165);
    rl.add(-.15, A + 1.18, AREA - .2, da - .32, A + 1.24, AREA - .15); rl.add(db + .32, A + 1.18, AREA - .2, W + .15, A + 1.24, AREA - .15);
    for (let k = -1; k <= 1; k += 2) { const x = k < 0 ? da - .28 : db + .25; for (let z = D + .15; z < AREA + 1.4; z += .14) { const yb = z < AREA ? V.UG : V.UG - (z - AREA) / .3 * (V.UG / 6); rl.add(x, yb, z, x + .025, yb + .95, z + .025); } rl.add(x - .01, V.UG + .9, D + .1, x + .035, V.UG + .96, AREA); }
    g.add(rl.mesh(mats.iron));
    // neighbouring tenements in the same granite terrace, hidden until asked for
    const nb = new Prisms(), nw = new Boxes(); g.userData.nb = [];
    [[-11.5, -.02], [W + .02, W + 11.5]].forEach(([x0, x1]) => {
      nb.poly([[x0, 0], [x1, 0], [x1, D], [x0, D]], [], V.LG, V.TOP);
      nb.face([[x0, V.EAVES, D + .3], [x1, V.EAVES, D + .3], [x1, V.RIDGE, D / 2], [x0, V.RIDGE, D / 2]]);
      nb.face([[x0, V.RIDGE, D / 2], [x1, V.RIDGE, D / 2], [x1, V.EAVES, -.3], [x0, V.EAVES, -.3]]);
      [V.LG + .95, V.UG + .75, V.F1 + .72, V.F2 + .72].forEach(yy => { for (let x = x0 + 1.6; x < x1 - 1.2; x += 3.7) nw.add(x, yy, D - .02, x + 1.15, yy + 1.85, D + .03); });
    });
    const nm = nb.mesh(mats.stoneL), wm = nw.mesh(mats.nbWin); [nm, wm].forEach(m => { if (m) { g.add(m); g.userData.nb.push(m); } });
    // street lamp
    const lamp = new Boxes(); lamp.add(-1.6, 0, AREA + 2.2, -1.48, 6.5, AREA + 2.32); lamp.add(-1.6, 6.4, AREA + 1.4, -1.48, 6.52, AREA + 2.32); g.add(lamp.mesh(mats.iron));
    return g;
  }
  // r: side of the nearest wall (0:-z, 1:+x, 2:+z, 3:-x)
  function sideRect(f, depth, from) { // strip of given depth along the wall side of f's bbox
    const x0 = f.x - f.w / 2, x1 = f.x + f.w / 2, z0 = f.z - f.d / 2, z1 = f.z + f.d / 2;
    from = from || 0;
    if (f.r === 0) return [x0, z0 + from, x1, z0 + from + depth];
    if (f.r === 2) return [x0, z1 - from - depth, x1, z1 - from];
    if (f.r === 1) return [x1 - from - depth, z0, x1 - from, z1];
    return [x0 + from, z0, x0 + from + depth, z1];
  }
  const bbox = f => [f.x - f.w / 2, f.z - f.d / 2, f.x + f.w / 2, f.z + f.d / 2];
  function fixture(f, y, b) {
    const R = bbox(f);
    if (f.t === 'shower') {
      b('white').rect(R, y, y + .06);
      const long = f.w > f.d;  // glass screen along the open long side, opposite the wall
      const opp = { 0: 2, 2: 0, 1: 3, 3: 1 }[f.r];
      const s = sideRect(Object.assign({}, f, { r: opp }), .015, .0);
      if ((long && (opp === 0 || opp === 2)) || (!long && (opp === 1 || opp === 3))) b('glass').rect(s, y + .06, y + 2.0);
      const p = sideRect(f, .04); b('steel').rect([(p[0] + p[2]) / 2 - .03, (p[1] + p[3]) / 2 - .03, (p[0] + p[2]) / 2 + .03, (p[1] + p[3]) / 2 + .03], y + 1.9, y + 2.1);
    } else if (f.t === 'wc') {
      b('white').rect(sideRect(f, .17), y, y + .82);
      const pan = sideRect(f, Math.max(f.w, f.d) - .17, .17);
      const sh = .06; b('white').rect([pan[0] + sh, pan[1] + sh, pan[2] - sh, pan[3] - sh], y, y + .41);
    } else if (f.t === 'basin') {
      b('furnWood').rect(R, y + .3, y + .78); b('white').rect(R, y + .78, y + .86);
      const m = sideRect(f, .04); b('steel').rect([(m[0] + m[2]) / 2 - .02, (m[1] + m[3]) / 2 - .02, (m[0] + m[2]) / 2 + .02, (m[1] + m[3]) / 2 + .02], y + .86, y + 1.0);
      b('steel').rect(sideRect(f, .02), y + 1.05, y + 1.75);   // mirror cabinet face
    } else if (f.t === 'hob') {
      b('black').rect([R[0] + .03, R[1] + .03, R[2] - .03, R[3] - .03], y + .9, y + .912);
    } else if (f.t === 'sink') {
      b('steel').rect([R[0] - .05, R[1] - .02, R[2] + .05, R[3] + .02], y + .9, y + .908);
    }
  }
  function furniture(f, y, b) {
    const R = bbox(f), t = f.t;
    if (t === 'bed2' || t === 'bed1') {
      b('furnWood').rect(R, y + .05, y + .3); b('linen').rect([R[0] + .02, R[1] + .02, R[2] - .02, R[3] - .02], y + .3, y + .52);
      b('furnWood').rect(sideRect(f, .07), y + .05, y + 1.05);
      const pl = sideRect(f, .38, .1), ins = .12;
      const across = f.r === 0 || f.r === 2;
      if (t === 'bed2') {
        if (across) { const m = (pl[0] + pl[2]) / 2; b('white').rect([pl[0] + ins, pl[1], m - .05, pl[3]], y + .52, y + .64); b('white').rect([m + .05, pl[1], pl[2] - ins, pl[3]], y + .52, y + .64); }
        else { const m = (pl[1] + pl[3]) / 2; b('white').rect([pl[0], pl[1] + ins, pl[2], m - .05], y + .52, y + .64); b('white').rect([pl[0], m + .05, pl[2], pl[3] - ins], y + .52, y + .64); }
      } else b('white').rect(across ? [pl[0] + .1, pl[1], pl[2] - .1, pl[3]] : [pl[0], pl[1] + .1, pl[2], pl[3] - .1], y + .52, y + .64);
      const opp = { 0: 2, 2: 0, 1: 3, 3: 1 }[f.r];
      b('throw').rect(sideRect(Object.assign({}, f, { r: opp }), .55, .05), y + .52, y + .56);
    } else if (t === 'bedside') {
      b('furnWood').rect([R[0] + .02, R[1] + .02, R[2] - .02, R[3] - .02], y, y + .52);
    } else if (t === 'sofa') {
      b('sofa').rect(R, y + .1, y + .44); b('sofa').rect(sideRect(f, .22), y + .44, y + .82);
      const across = f.r === 0 || f.r === 2;
      if (across) { b('sofa').rect([R[0], R[1], R[0] + .18, R[3]], y + .44, y + .62); b('sofa').rect([R[2] - .18, R[1], R[2], R[3]], y + .44, y + .62); }
      else { b('sofa').rect([R[0], R[1], R[2], R[1] + .18], y + .44, y + .62); b('sofa').rect([R[0], R[3] - .18, R[2], R[3]], y + .44, y + .62); }
    } else if (t === 'sofaL') {
      const dpt = .9, c = f.corner || 0;   // filled quadrant: 0 TL,1 TR,2 BR,3 BL
      const top = c === 0 || c === 1, left = c === 0 || c === 3;
      const a = top ? [R[0], R[1], R[2], R[1] + dpt] : [R[0], R[3] - dpt, R[2], R[3]];
      const s = left ? [R[0], R[1], R[0] + dpt, R[3]] : [R[2] - dpt, R[1], R[2], R[3]];
      [a, s].forEach(r => b('sofa').rect(r, y + .1, y + .44));
      b('sofa').rect(top ? [R[0], R[1], R[2], R[1] + .22] : [R[0], R[3] - .22, R[2], R[3]], y + .44, y + .82);
      b('sofa').rect(left ? [R[0], R[1], R[0] + .22, R[3]] : [R[2] - .22, R[1], R[2], R[3]], y + .44, y + .82);
    } else if (t === 'coffee') {
      b('furnWood').rect(R, y + .32, y + .4); b('furnWood').rect([R[0] + .05, R[1] + .05, R[2] - .05, R[3] - .05], y, y + .32);
      b('rug').rect([R[0] - .6, R[1] - .6, R[2] + .6, R[3] + .6], y + .014, y + .022);
    } else if (t === 'unit') {
      b('furnWood').rect(R, y, y + .5);
      const tv = sideRect(f, .05, .12); const along = f.r === 0 || f.r === 2;
      const c = along ? [(R[0] + R[2]) / 2 - .55, tv[1], (R[0] + R[2]) / 2 + .55, tv[3]] : [tv[0], (R[1] + R[3]) / 2 - .55, tv[2], (R[1] + R[3]) / 2 + .55];
      b('black').rect(c, y + .62, y + 1.25);
    } else if (t === 'desk') {
      b('furnWood').rect(R, y + .72, y + .76); b('furnWood').rect(sideRect(f, .06), y, y + .72);
      const opp = { 0: 2, 2: 0, 1: 3, 3: 1 }[f.r]; const c = sideRect(Object.assign({}, f, { r: opp }), .42, -.3);
      const cx = (c[0] + c[2]) / 2, cz = (c[1] + c[3]) / 2; b('chair').rect([cx - .21, cz - .21, cx + .21, cz + .21], y + .42, y + .47);
    } else if (t === 'table' || t === 'dining') {
      const cx = f.x, cz = f.z, w = Math.min(f.w, 1.3), d = Math.min(f.d, 1.3);
      if (t === 'dining') {
        const tw = Math.min(w, d) > 1.0 ? .8 : Math.min(w, d) - .45;
        b('furnWood').rect([cx - tw / 2 - .1, cz - tw / 2, cx + tw / 2 + .1, cz + tw / 2], y + .72, y + .76); b('furnWood').rect([cx - .05, cz - .05, cx + .05, cz + .05], y, y + .72);
        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([i, j]) => { const px = cx + i * (tw / 2 + .32), pz = cz + j * (tw / 2 + .28); b('chair').rect([px - .2, pz - .2, px + .2, pz + .2], y + .43, y + .48); b('chair').rect([px - .03, pz - .03, px + .03, pz + .03], y, y + .43); });
      } else {
        b('furnWood').rect([cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2], y + .72, y + .76); b('furnWood').rect([cx - .05, cz - .05, cx + .05, cz + .05], y, y + .72);
      }
    } else if (t === 'chair') {
      b('chair').rect([R[0] + .03, R[1] + .03, R[2] - .03, R[3] - .03], y + .4, y + .46); b('chair').rect(sideRect(f, .06), y + .46, y + .85);
      b('chair').rect([f.x - .03, f.z - .03, f.x + .03, f.z + .03], y, y + .4);
    }
  }

  /* ---------------- viewer ---------------- */
  const flatBox = n => { let b = [1e9, 1e9, -1e9, -1e9]; for (const L in LV) (LV[L].flatFloor[n] || []).forEach(s => s.o.forEach(([x, z]) => { b = [Math.min(b[0], x), Math.min(b[1], z), Math.max(b[2], x), Math.max(b[3], z)]; })); return b; };
  const flatLevel = n => (M.flats.find(f => f.n === n) || {}).level;
  const flatLabel = n => 'Flat ' + ((M.flats.find(f => f.n === n) || {}).label || n);
  function Viewer(host, opts) {
    this.host = host; this.opts = opts = opts || {}; this.mode = opts.mode || 'building'; this.spin = opts.spin !== false;
    const W0 = host.clientWidth || 800, H0 = host.clientHeight || 500;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: !!opts.capture });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(W0, H0); r.outputEncoding = THREE.sRGBEncoding;
    host.appendChild(r.domElement); r.domElement.style.touchAction = 'none';
    r.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; if (opts.onLost) setTimeout(() => opts.onLost(), 50); }, false);
    const sc = this.scene = new THREE.Scene();
    sc.background = new THREE.Color(opts.bg || '#e9e5ec');
    this.cam = new THREE.PerspectiveCamera(this.mode === 'tour' ? 76 : 40, W0 / H0, .05, 600);
    this.mats = makeMats();
    sc.add(this.hemi = new THREE.HemisphereLight(0xf6f2ea, 0x6d655a, this.mode === 'tour' ? .72 : .85));
    const sun = this.sun = new THREE.DirectionalLight(0xfff4e2, .62); sun.position.set(-30, 60, -40); sc.add(sun); sc.add(sun.target);
    const fill = this.fill = new THREE.DirectionalLight(0xdfe8f0, .25); fill.position.set(30, 25, 40); sc.add(fill);
    this.bg0 = opts.bg || '#e9e5ec';
    if (this.mode !== 'tour') {
      r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
      sun.castShadow = true; const sz = (window.innerWidth < 700 ? 1024 : 2048); sun.shadow.mapSize.set(sz, sz);
      const c = sun.shadow.camera, ext = 30; c.left = -ext; c.right = ext; c.top = ext; c.bottom = -ext; c.near = 1; c.far = 220; sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
    }
    this.labels = document.createElement('div'); this.labels.className = 'v3-labels'; host.appendChild(this.labels);
    this.anchors = []; this.levels = {};
    if (this.mode === 'building') this.initBuilding(); else this.initFloor();
    this.bindControls();
    this.scene.traverse(o => { if (o.isMesh) { o.castShadow = !(o.material && o.material.transparent); o.receiveShadow = true; } });
    this.setTime(opts.hour != null ? opts.hour : 13, opts.season || 'summer');
    if (opts.styleName) this.setStyle(opts.styleName);
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
    this.loop = this.loop.bind(this); this.raf = requestAnimationFrame(this.loop);
  }
  Viewer.prototype.initBuilding = function () {
    const sc = this.scene, mats = this.mats;
    sc.add(this.site = buildSite(mats));
    this.storeys = STOREYS.map(st => { const g = buildStorey(st, mats); sc.add(g); return g; });
    const g1 = buildLevel(1, mats, {}); this.levels[1] = g1; sc.add(g1);
    sc.add(this.roof = buildRoof(mats));
    this.showNb = !!this.opts.neighbours; this.target = new THREE.Vector3(0, 4.5, 2); this.theta = .5; this.phi = 1.2; this.rad = 30; this.minR = 8; this.maxR = 90;
    this.setFloor('all');
  };
  Viewer.prototype.setFloor = function (f) {
    this.floor = f;
    this.storeys.forEach(g => g.visible = f === 'all' || g.userData.storey !== 'F2');
    this.roof.visible = f === 'all';
    (this.site.userData.nb || []).forEach(m => m.visible = f === 'all' && !!this.showNb);
    const sc = this.scene;
    if (this.stair) { sc.remove(this.stair); this.stair.traverse(q => q.geometry && q.geometry.dispose()); }
    sc.add(this.stair = buildStair(this.mats, f === 'all' ? 99 : LV[f].y + LV[f].ceil));
    this.stair.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const y = f === 'all' ? 4.5 : LV[f].y + 1;
    this.targetGoal = new THREE.Vector3(0, y, f === 'all' ? 2 : 0);
    this.radGoal = f === 'all' ? 30 : 22; this.phiGoal = f === 'all' ? 1.18 : .7;
    this.setAnchors(); this.occluders = null;
    this.idle = 0;
  };
  /* sun over Aberdeen (57.15 N); M.north is the bearing of -z */
  Viewer.prototype.setTime = function (hour, season) {
    this.hour = hour; this.season = season = season || this.season || 'summer';
    const N = season === 'winter' ? 355 : 172, lat = 57.15 * Math.PI / 180;
    const decl = 23.44 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + N) / 365);
    const solar = hour - (season === 'summer' ? 1 : 0) - .2, HA = (solar - 12) * 15 * Math.PI / 180;
    const sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(HA), alt = Math.asin(sinAlt);
    const az = Math.atan2(Math.sin(HA), Math.cos(HA) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)) + Math.PI;
    const a2 = az - (M.north - 180) * Math.PI / 180;
    const dir = new THREE.Vector3(-Math.cos(alt) * Math.sin(a2), Math.sin(alt), Math.cos(alt) * Math.cos(a2));
    this.sunAlt = alt * 180 / Math.PI; this.sunAz = az * 180 / Math.PI;
    const day = Math.max(0, Math.min(1, (this.sunAlt + 4) / 14)), lowSun = Math.max(0, 1 - Math.abs(this.sunAlt - 6) / 10) * day;
    const tgt = this.target ? this.target.clone() : new THREE.Vector3();
    this.sun.position.copy(tgt).addScaledVector(dir.y > 0 ? dir : new THREE.Vector3(dir.x, .05, dir.z).normalize(), 110);
    this.sun.target.position.copy(tgt); this.sun.target.updateMatrixWorld();
    this.sun.intensity = .78 * day * (this.mode === 'tour' ? .35 : 1); this.sun.color.setHSL(.09, .2 + .5 * lowSun, .9 - .15 * lowSun);
    this.sun.visible = day > .02;
    this.fill.intensity = .1 + .18 * day;
    this.hemi.intensity = this.mode === 'tour' ? .5 + .2 * day : .22 + .63 * day;
    if (this.mode === 'tour') this.hemi.color.set(day < .5 ? '#ffe2b8' : '#f6f2ea');
    const night = new THREE.Color('#162030'), dusk = new THREE.Color('#e7c7a6'), base = new THREE.Color(this.bg0);
    this.scene.background = night.clone().lerp(base, day).lerp(dusk, lowSun * .55);
    const g = this.mats.glass; g.emissive = g.emissive || new THREE.Color(); g.emissive.set('#ffbe6b').convertSRGBToLinear(); const outside = this.mode !== 'tour'; g.emissiveIntensity = outside ? 1.4 * (1 - day) : 0; g.opacity = outside ? .26 + .5 * (1 - day) : .26;
    if (this.pano) this.pano.material.color.setRGB(.08 + .92 * day, .1 + .9 * day, .16 + .84 * day).lerp(new THREE.Color(1, .82, .66), lowSun * .5);
    return { alt: this.sunAlt, az: this.sunAz };
  };
  const STYLES = {
    oak: { wood: '#b98f63', part: '#f6f3ee', core: '#efebe4', sofa: '#4a6072', unit: '#e8e4dd', top: '#353a40', furnWood: '#8b6446', throw: '#c2601a' },
    walnut: { wood: '#6e4a32', part: '#ede7dd', core: '#e6dfd4', sofa: '#2f3b45', unit: '#2f3438', top: '#d8d2c8', furnWood: '#4a3224', throw: '#b08a4a' },
    scandi: { wood: '#dccaa9', part: '#fbfaf7', core: '#f5f3ee', sofa: '#a7b0b3', unit: '#ffffff', top: '#c3c8cc', furnWood: '#c9ad85', throw: '#7d9a8a' }
  };
  Viewer.prototype.setStyle = function (name) {
    const st = STYLES[name]; if (!st) return; this.styleName = name;
    for (const k in st) if (this.mats[k]) this.mats[k].color.set(st[k]).convertSRGBToLinear();
  };
  Viewer.prototype.setNeighbours = function (on) { this.showNb = !!on; (this.site && this.site.userData.nb || []).forEach(m => m.visible = this.floor === 'all' && this.showNb); this.occluders = null; };
  Viewer.prototype.setSpin = function (on) { this.spin = !!on; this.idle = on ? 9999 : 0; };
  Viewer.prototype.showRear = function () {
    this.setFloor('all'); this.thetaGoal = Math.PI - .5; this.phiGoal = 1.15; this.radGoal = 40; this.targetGoal = new THREE.Vector3(0, 5, 0);
  };
  Viewer.prototype.setAnchors = function () {
    const f = this.floor, A = [];
    const add = (x, y, z, t, k) => A.push({ p: new THREE.Vector3(x - CX, y, z - CZ), t, k });
    if (f === 'all') {
      const d = M.frontWin[1];
      add((d[0] + d[1]) / 2, V.UG + 3.2, M.D + .4, 'Close entrance', 'core');
      M.flats.forEach(fl => { const bb = flatBox(fl.n); add((bb[0] + bb[2]) / 2, V.F1 + 1.5, M.D + .4, flatLabel(fl.n) + ' · first floor', 'flat'); });
      add(M.W / 2, V.LG + 1, -4, 'Shared rear garden', 'room');
    } else {
      const lv = LV[f], y = lv.y;
      lv.rooms.forEach(r => {
        if (r.flat === 0) { if (r.name !== 'Terrace' && r.name !== 'Stair') add(r.x, y + 1.3, r.z, r.name, 'room'); return; }
        if (/^Lounge/.test(r.name)) add(r.x, y + 1.5, r.z, flatLabel(r.flat), 'flat');
      });
      add((M.stair[0] + M.stair[2]) / 2, y + 2.2, M.stair[1] + 1, 'Common stair', 'core');
    }
    this.anchors = A; this.labels.innerHTML = ''; this.occluders = null;
    A.forEach(a => { const d = document.createElement('span'); d.className = 'v3-tag v3-' + a.k; d.textContent = a.t; this.labels.appendChild(d); a.el = d; });
  };
  Viewer.prototype.initFloor = function () {
    const sc = this.scene, mats = this.mats, o = this.opts, pos = o.pos || 1, L = o.level != null ? o.level : flatLevel(pos), host = this.host, lvd = LV[L];
    STOREYS.filter(st => st.k !== 'F2').forEach(st => sc.add(buildStorey(st, mats)));
    { const g = buildLevel(L, mats, { focusFlat: this.mode === 'floor' ? pos : 0, detail: true }); sc.add(g); this.levels[L] = g; }
    sc.add(buildStair(mats, lvd.y + lvd.ceil));
    const rooms = lvd.rooms.filter(r => r.flat === pos && r.name !== 'Balcony'), bb = flatBox(pos);
    const cx = (bb[0] + bb[2]) / 2 - CX, cz = (bb[1] + bb[3]) / 2 - CZ, y = lvd.y;
    const site = buildSite(mats); sc.add(site);
    if (this.mode === 'floor') {
      (site.userData.nb || []).forEach(m => m.visible = false);
      this.target = new THREE.Vector3(cx, y + .5, cz); this.theta = Math.atan2(cx, cz) + .4; this.phi = .62;
      this.rad = Math.max(bb[2] - bb[0], bb[3] - bb[1]) * .95 + 7; this.minR = 5; this.maxR = 60;
      this.anchors = lvd.rooms.filter(r => r.flat === pos).map(r => ({ p: new THREE.Vector3(r.x - CX, y + 1.3, r.z - CZ), t: r.name, k: 'room' }));
      this.labels.innerHTML = ''; this.anchors.forEach(a => { const d = document.createElement('span'); d.className = 'v3-tag v3-room'; d.textContent = a.t; this.labels.appendChild(d); a.el = d; });
    } else {
      const c = new Prisms(); (lvd.flatFloor[pos] || []).forEach(s => c.poly(s.o, s.h, y + lvd.ceil - .04, y + lvd.ceil));
      const cm = c.mesh(std('#f1eee8', { side: THREE.DoubleSide, emissive: '#d9d4cc', emissiveIntensity: .45 })); if (cm) sc.add(cm);
      rooms.forEach(r => { const p = new THREE.PointLight(0xfff0dc, .32, 6.5, 1.8); p.position.set(r.x - CX, y + lvd.ceil - .3, r.z - CZ); sc.add(p); });
      const pano = new THREE.Mesh(new THREE.CylinderGeometry(160, 160, 120, 64, 1, true), new THREE.MeshBasicMaterial({ map: panoramaTex(), side: THREE.BackSide, fog: false }));
      pano.material.map.wrapS = THREE.RepeatWrapping; pano.material.map.repeat.x = -1; pano.position.y = 22; sc.add(pano); this.pano = pano;
      sc.background = new THREE.Color('#e4e9ec');
      this.eyeY = y + 1.6; this.yaw = 0; this.pitch = -.05; this.L = L; this.rooms = rooms;
      this.wins = lvd.open.map(q => centroid(q.q));
      this.buildGrid(L, pos);
      this.cam.position.set(0, this.eyeY, 0);
      this.floorPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ visible: false }));
      this.floorPlane.rotation.x = -Math.PI / 2; this.floorPlane.position.y = y; sc.add(this.floorPlane);
      const start = rooms.find(r => /^Lounge/.test(r.name)) || rooms[0], [sx, sz] = this.nearestFree(start.x, start.z);
      this.pos3 = new THREE.Vector3(sx - CX, this.eyeY, sz - CZ); this.goal = this.pos3.clone();
      this.yaw = this.bestYaw(sx, sz); this.cam.position.copy(this.pos3);
      this.fadeEl = document.createElement('div'); this.fadeEl.className = 'v3-fade'; host.appendChild(this.fadeEl);
    }
  };
  /* walk-through collision: walls, glazing and furniture rasterised to 5 cm cells */
  Viewer.prototype.buildGrid = function (L, pos) {
    const lv = LV[L], RES = .05, X0 = -.5, Z0 = -.5, W = Math.ceil(13.5 / RES), Hh = Math.ceil(12 / RES);
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = Hh; const g = c.getContext('2d'); g.setTransform(1 / RES, 0, 0, 1 / RES, -X0 / RES, -Z0 / RES); g.fillStyle = '#000'; return [c, g]; };
    const poly = (g, ring, holes) => { g.beginPath(); [ring].concat(holes || []).forEach(r => { r.forEach(([x, z], i) => i ? g.lineTo(x, z) : g.moveTo(x, z)); g.closePath(); }); g.fill('evenodd'); };
    const [cw, gw] = mk(), [cf, gf] = mk(), [ca, ga] = mk();
    lv.ext.concat(lv.part).forEach(w => poly(gw, w.o, w.h));
    lv.open.forEach(o => poly(gw, o.q));
    (lv.diag || []).forEach(([a, c]) => { gw.lineWidth = .12; gw.beginPath(); gw.moveTo(a[0], a[1]); gw.lineTo(c[0], c[1]); gw.stroke(); });
    const R = r => gf.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
    lv.furn.filter(f => f.flat === pos).forEach(f => { const k = f.t === 'dining' ? .5 : 1; R([f.x - f.w / 2 * k, f.z - f.d / 2 * k, f.x + f.w / 2 * k, f.z + f.d / 2 * k]); });
    lv.fix.filter(f => f.t !== 'sink').forEach(f => R(f.b)); lv.kit.filter(k => k.flat === pos).forEach(k => R(k.b));
    lv.tall.forEach(R);
    // walkable area: this flat's floor (plus its bays)
    (lv.flatFloor[pos] || []).forEach(s => poly(ga, s.o, s.h));
    const dw = gw.getImageData(0, 0, W, Hh).data, df = gf.getImageData(0, 0, W, Hh).data, da = ga.getImageData(0, 0, W, Hh).data;
    this.occ = { X0, Z0, RES, W, Hh, wall: i => dw[i * 4 + 3] > 60, furn: i => df[i * 4 + 3] > 60, area: i => da[i * 4 + 3] > 60 };
    const c = .15, g = this.grid = { x0: X0, z0: Z0, c, nx: Math.ceil(13.5 / c), nz: Math.ceil(12 / c) };
    g.free = new Uint8Array(g.nx * g.nz);
    for (let j = 0; j < g.nz; j++) for (let i = 0; i < g.nx; i++) g.free[j * g.nx + i] = this.blocked(g.x0 + (i + .5) * c, g.z0 + (j + .5) * c, .2) ? 0 : 1;
  };
  Viewer.prototype.blocked = function (x, z, rad, wallsOnly) {
    rad = rad == null ? .22 : rad; const O = this.occ; if (!O) return false;
    const cell = (px, pz) => { const i = Math.floor((px - O.X0) / O.RES), j = Math.floor((pz - O.Z0) / O.RES); return (i < 0 || j < 0 || i >= O.W || j >= O.Hh) ? -1 : j * O.W + i; };
    const c0 = cell(x, z); if (c0 < 0 || !O.area(c0)) return true;
    const n = rad > .06 ? 12 : 1;
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2, rr = n === 1 ? 0 : rad;
      for (const s of n === 1 ? [0] : [1, .5]) {
        const ci = cell(x + Math.cos(a) * rr * s, z + Math.sin(a) * rr * s); if (ci < 0) return true;
        if (O.wall(ci)) return true; if (!wallsOnly && s === 1 && O.furn(cell(x + Math.cos(a) * rr * .6, z + Math.sin(a) * rr * .6))) return true;
      }
    }
    return O.wall(c0) || (!wallsOnly && O.furn(c0));
  };
  Viewer.prototype.nearestFree = function (x, z) {
    const g = this.grid; if (!g) return [x, z];
    let i0 = Math.floor((x - g.x0) / g.c), j0 = Math.floor((z - g.z0) / g.c);
    for (let r = 0; r < 25; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      const i = i0 + di, j = j0 + dj;
      if (i >= 0 && j >= 0 && i < g.nx && j < g.nz && g.free[j * g.nx + i]) return [g.x0 + (i + .5) * g.c, g.z0 + (j + .5) * g.c];
    }
    return [x, z];
  };
  Viewer.prototype.viewYaw = function (x, z) {
    let best = null, bd = 0;
    for (const [wx, wz] of this.wins || []) {
      const d = Math.hypot(wx - x, wz - z); if (d > 8 || d < 1.2) continue;
      let ok = true;
      for (let t = .1; t < d - .5; t += .1) { const px = x + (wx - x) * t / d, pz = z + (wz - z) * t / d, O = this.occ, i = Math.floor((px - O.X0) / O.RES) + Math.floor((pz - O.Z0) / O.RES) * O.W; if (O.wall(i)) { ok = false; break; } }
      if (ok && d > bd) { bd = d; best = Math.atan2(-(wx - x), -(wz - z)); }
    }
    return best == null ? this.bestYaw(x, z) : best;
  };
  Viewer.prototype.bestYaw = function (x, z) {
    const ray = a => { const dx = -Math.sin(a), dz = -Math.cos(a); let d = 0; while (d < 12 && !this.blocked(x + dx * d, z + dz * d, 0, true)) d += .1; return d; };
    let best = 0, bl = -1;
    for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; let sum = 0; for (const o of [-.5, -.25, 0, .25, .5]) sum += Math.min(ray(a + o), 7); if (sum > bl) { bl = sum; best = a; } }
    return best;
  };
  Viewer.prototype.goRoom = function (i) {
    const r = this.rooms[i]; if (!r) return;
    let [px, pz] = this.nearestFree(r.x, r.z);
    const yaw = r.name === 'Hall' ? this.bestYaw(px, pz) : this.viewYaw(px, pz), f = this.fadeEl;
    const bx = Math.sin(yaw), bz = Math.cos(yaw);
    for (let d = 0; d < 1.6; d += .1) { if (this.blocked(px + bx * .1, pz + bz * .1, .3)) break; px += bx * .1; pz += bz * .1; }
    const jump = () => { this.pos3.set(px - CX, this.eyeY, pz - CZ); this.goal = this.pos3.clone(); this.path = null; this.yaw = yaw; this.yawGoal = null; this.pitch = -.05; this.idle = 0; };
    if (!f) return jump();
    f.style.opacity = 1; setTimeout(() => { jump(); f.style.opacity = 0; }, 220);
  };
  Viewer.prototype.findPath = function (x0, z0, x1, z1) {
    const g = this.grid; if (!g) return null;
    const ci = (x, z) => [Math.floor((x - g.x0) / g.c), Math.floor((z - g.z0) / g.c)];
    [x0, z0] = this.nearestFree(x0, z0); [x1, z1] = this.nearestFree(x1, z1);
    const [si, sj] = ci(x0, z0), [ti, tj] = ci(x1, z1);
    const ok = (i, j) => i >= 0 && j >= 0 && i < g.nx && j < g.nz && g.free[j * g.nx + i];
    if (!ok(ti, tj)) return null;
    const prev = new Int32Array(g.nx * g.nz).fill(-1), q = [sj * g.nx + si]; prev[q[0]] = q[0];
    for (let h = 0; h < q.length; h++) {
      const k = q[h]; if (k === tj * g.nx + ti) break;
      const i = k % g.nx, j = (k / g.nx) | 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const a = i + di, b = j + dj, n = b * g.nx + a;
        if (ok(a, b) && prev[n] < 0 && (!di || !dj || (ok(i + di, j) && ok(i, j + dj)))) { prev[n] = k; q.push(n); }
      }
    }
    let k = tj * g.nx + ti; if (prev[k] < 0) return null;
    const pts = []; while (k !== prev[k]) { pts.push(k); k = prev[k]; }
    pts.reverse();
    const out = pts.filter((_, n) => n % 3 === 2 || n === pts.length - 1).map(k => new THREE.Vector3(g.x0 + ((k % g.nx) + .5) * g.c - CX, this.eyeY, g.z0 + (((k / g.nx) | 0) + .5) * g.c - CZ));
    return out;
  };
  Viewer.prototype.bindControls = function () {
    const el = this.renderer.domElement, pts = new Map(); let pinch = 0, moved = 0;
    this.idle = 0; this.keys = {};
    const stop = () => { if (this.spin && this.opts.onSpin) { this.spin = false; this.opts.onSpin(false); } else this.spin = false; };
    el.addEventListener('pointerdown', e => { stop(); el.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; this.idle = 0; });
    el.addEventListener('pointermove', e => {
      if (this.mode !== 'tour' && !pts.size) this.hover(e);
      if (!pts.has(e.pointerId)) return;
      const p = pts.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy); this.idle = 0;
      if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) this.zoom(pinch / d); pinch = d; return; }
      if (this.mode === 'tour') { this.yaw += dx * .005; this.pitch = Math.max(-1, Math.min(1, this.pitch + dy * .004)); this.yawGoal = null; }
      else if (e.buttons === 2 || e.shiftKey) { this.pan(dx, dy); }
      else { this.theta -= dx * .007; this.phi = Math.max(.12, Math.min(1.45, this.phi - dy * .005)); }
    });
    const up = e => {
      if (pts.has(e.pointerId) && moved < 6) this.click(e);
      pts.delete(e.pointerId); pinch = 0;
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', e => { pts.delete(e.pointerId); pinch = 0; });
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('wheel', e => { stop(); e.preventDefault(); this.zoom(e.deltaY > 0 ? 1.08 : .93); this.idle = 0; }, { passive: false });
    el.tabIndex = 0;
    el.addEventListener('keydown', e => { this.keys[e.key.toLowerCase()] = true; if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault(); });
    el.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
  };
  Viewer.prototype.zoom = function (f) {
    if (this.mode === 'tour') { this.cam.fov = Math.max(40, Math.min(90, this.cam.fov * f)); this.cam.updateProjectionMatrix(); }
    else { this.rad = Math.max(this.minR, Math.min(this.maxR, this.rad * f)); this.radGoal = null; }
  };
  Viewer.prototype.pan = function (dx, dy) {
    const s = this.rad * .0016, right = new THREE.Vector3(Math.cos(this.theta), 0, -Math.sin(this.theta)), fwd = new THREE.Vector3(Math.sin(this.theta), 0, Math.cos(this.theta));
    this.target.addScaledVector(right, -dx * s).addScaledVector(fwd, -dy * s); this.targetGoal = null;
  };
  Viewer.prototype.pick = function (e) {
    const rc = new THREE.Raycaster(), r = this.renderer.domElement.getBoundingClientRect();
    rc.setFromCamera({ x: (e.clientX - r.left) / r.width * 2 - 1, y: -(e.clientY - r.top) / r.height * 2 + 1 }, this.cam);
    return rc;
  };
  Viewer.prototype.flatAt = function (e) {
    if (this.mode !== 'building' || this.floor === 'all') return null;
    const lv = this.levels[this.floor]; if (!lv.userData.floorGroup) return null;
    const hit = this.pick(e).intersectObjects(lv.userData.floorGroup.children)[0];
    return hit ? hit.object : null;
  };
  Viewer.prototype.hover = function (e) {
    const o = this.flatAt(e);
    if (this.hovered && this.hovered !== o) { this.hovered.material = this.mats.wood; }
    if (o) { if (!this.hoverMat) this.hoverMat = std('#d9874a', { roughness: .7 }); o.material = this.hoverMat; }
    this.hovered = o; this.renderer.domElement.style.cursor = o ? 'pointer' : 'grab';
  };
  Viewer.prototype.click = function (e) {
    if (this.mode === 'tour') {
      const hit = this.pick(e).intersectObject(this.floorPlane)[0]; if (!hit) return;
      const x = hit.point.x + CX, z = hit.point.z + CZ;
      const path = this.findPath(this.pos3.x + CX, this.pos3.z + CZ, x, z);
      if (path && path.length) { this.path = path; this.goal = path.shift(); this.yawGoal = null; this.idle = 0; }
      return;
    }
    const o = this.flatAt(e);
    if (o && this.opts.onFlat) this.opts.onFlat(o.userData.flat);
  };
  Viewer.prototype.resize = function () {
    const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h); this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
  };
  Viewer.prototype.loop = function () {
    if (this.dead) return; this.raf = requestAnimationFrame(this.loop); if (this.paused || this.lost) return; this.idle++;
    const cam = this.cam;
    if (this.mode === 'tour') {
      const k = this.keys, sp = .055; let mx = 0, mz = 0;
      if (k['w'] || k['arrowup']) mz -= 1; if (k['s'] || k['arrowdown']) mz += 1; if (k['a']) mx -= 1; if (k['d']) mx += 1;
      if (k['arrowleft']) this.yaw += .03; if (k['arrowright']) this.yaw -= .03;
      if (mx || mz) {
        const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
        const dx = (mx * c + mz * s) * sp, dz = (-mx * s + mz * c) * sp;
        const nx = this.pos3.x + dx, nz = this.pos3.z + dz;
        if (!this.blocked(nx + CX, this.pos3.z + CZ)) this.pos3.x = nx;
        if (!this.blocked(this.pos3.x + CX, nz + CZ)) this.pos3.z = nz;
        this.goal.copy(this.pos3); this.yawGoal = null; this.idle = 0;
      } else {
        const d = this.goal.clone().sub(this.pos3), L = d.length();
        if (L > .01) {
          const step = d.multiplyScalar(Math.min(1, .06 / L));
          this.pos3.add(step);
          if (this.path && this.path.length === 0) { }
        } else if (this.path && this.path.length) this.goal = this.path.shift();
      }
      if (this.yawGoal != null) { let dy = this.yawGoal - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); this.yaw += dy * .08; if (Math.abs(dy) < .002) this.yawGoal = null; }
      else if (this.idle > 300 && this.spin) this.yaw += .0012;
      cam.position.copy(this.pos3); cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    } else {
      if (this.targetGoal) { this.target.lerp(this.targetGoal, .08); if (this.target.distanceTo(this.targetGoal) < .01) this.targetGoal = null; }
      if (this.radGoal) { this.rad += (this.radGoal - this.rad) * .08; if (Math.abs(this.radGoal - this.rad) < .05) this.radGoal = null; }
      if (this.thetaGoal != null) { let d = this.thetaGoal - this.theta; d = Math.atan2(Math.sin(d), Math.cos(d)); this.theta += d * .06; if (Math.abs(d) < .002) this.thetaGoal = null; }
      if (this.phiGoal) { this.phi += (this.phiGoal - this.phi) * .08; if (Math.abs(this.phiGoal - this.phi) < .002) this.phiGoal = null; }
      if (this.idle > 220 && !this.opts.still && this.spin) this.theta += .0016;
      const fit = Math.max(1, Math.min(1.9, 1.3 / (cam.aspect || 1))), R = this.rad * fit;   // pull back on tall, narrow screens so the whole building fits
      cam.position.set(this.target.x + R * Math.sin(this.phi) * Math.sin(this.theta), this.target.y + R * Math.cos(this.phi), this.target.z + R * Math.sin(this.phi) * Math.cos(this.theta));
      cam.lookAt(this.target);
    }
    this.renderer.render(this.scene, cam);
    if (!this.readyFired) { this.readyFired = true; if (this.opts.onReady) setTimeout(() => this.opts.onReady(), 0); }
    // labels: pinned to their 3D point, hidden when something solid is in front, and never stacked on each other
    if (this.anchors.length) this.updateLabels();
  };
  Viewer.prototype.collectOccluders = function () {
    const list = [];
    this.scene.traverseVisible(o => {
      if (!o.isMesh || !o.geometry) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m || m.transparent || m.visible === false || (m.side === THREE.BackSide)) return;
      list.push(o);
    });
    this.occluders = list; this.occK = 0;
    for (const a of this.anchors) a.hidden = false;
  };
  Viewer.prototype.updateLabels = function () {
    const cam = this.cam, w = this.host.clientWidth, h = this.host.clientHeight, v = new THREE.Vector3();
    if (!this.occluders) this.collectOccluders();
    // occlusion: test a few labels per frame against the solid geometry between the camera and the label
    const rc = this.rc || (this.rc = new THREE.Raycaster()), n = this.anchors.length, per = Math.min(n, 4);
    for (let i = 0; i < per; i++) {
      const a = this.anchors[this.occK++ % n];
      const dir = a.p.clone().sub(cam.position), dist = dir.length(); dir.normalize();
      rc.set(cam.position, dir); rc.near = .05; rc.far = Math.max(.1, dist - .45);
      a.hidden = rc.intersectObjects(this.occluders, false).length > 0;
    }
    // project, then place in priority order, nudging or dropping labels that would overlap
    const placed = [];
    const over = (r) => placed.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
    for (const a of this.anchors) {
      v.copy(a.p).project(cam);
      let show = !a.hidden && v.z < 1 && Math.abs(v.x) < 1.02 && Math.abs(v.y) < 1.02;
      let x = (v.x * .5 + .5) * w, y = (-v.y * .5 + .5) * h;
      if (show) {
        if (!a.w) { a.w = a.el.offsetWidth || 80; a.h = a.el.offsetHeight || 22; }
        let ok = false;
        for (const dy of [0, -(a.h + 3), a.h + 3]) {
          const r = [x - a.w / 2 - 2, y + dy - a.h / 2 - 1, x + a.w / 2 + 2, y + dy + a.h / 2 + 1];
          if (!over(r)) { placed.push(r); y += dy; ok = true; break; }
        }
        show = ok;
      }
      if (show) { a.el.style.visibility = 'visible'; a.el.style.opacity = 1; a.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; }
      else { a.el.style.opacity = 0; a.el.style.visibility = 'hidden'; }
    }
  };
  Viewer.prototype.dispose = function () {
    if (this.dead) return; this.dead = true; cancelAnimationFrame(this.raf); this.ro.disconnect();
    this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
    this.renderer.dispose(); try { this.renderer.forceContextLoss(); } catch (e) { } this.renderer.domElement.remove(); this.labels.remove(); if (this.fadeEl) this.fadeEl.remove();
  };
  window.CS3D = { Viewer, M, CX, CZ };
})();
