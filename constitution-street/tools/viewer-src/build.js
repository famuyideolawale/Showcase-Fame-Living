
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
    if (opt.lining) {   // plastered inner face and window reveals, inside the flats
      const zi = face === 'f' ? z0 : z1, li = face === 'f' ? [zi - .02, zi] : [zi, zi + .02], rv = face === 'f' ? [zi, zg - .04] : [zg + .04, zi];
      const L = r => rect(add(P, 'part'), r, y0 + .015, y1 - .3);
      let lx = .95;
      wins.forEach(([a, b]) => {
        if (a > lx) L([lx, li[0], a, li[1]]);
        rect(add(P, 'part'), [a, li[0], b, li[1]], y0 + .015, y0 + s); rect(add(P, 'part'), [a, li[0], b, li[1]], y0 + h, y1 - .3);
        rect(add(P, 'part'), [a, rv[0], a + .02, rv[1]], y0 + s, y0 + h); rect(add(P, 'part'), [b - .02, rv[0], b, rv[1]], y0 + s, y0 + h);
        rect(add(P, 'part'), [a, rv[0], b, rv[1]], y0 + h - .02, y0 + h); rect(add(P, 'white'), [a - .03, rv[0] - .01, b + .03, rv[1]], y0 + s - .03, y0 + s);
        lx = b;
      });
      if (W - .9 > lx) L([lx, li[0], W - .9, li[1]]);
    }
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
  // shelved alcoves over slatted radiator covers, in the second bedrooms (model metres)
  const ALCOVES = { 1: [{ r: [5.33, 7.18, 5.66, 7.78], along: false }, { r: [0.69, 0.62, 1.02, 1.22], along: false }] };
  function buildLevel(L, mats, opt) {
    opt = opt || {};
    const lv = LV[L], y = lv.y, top = lv.top, grp = new THREE.Group(); grp.userData.level = L;
    const P = {}, p = k => add(P, k), B = {}, b = k => (B[k] = B[k] || new Boxes());
    storeyShell(P, y, top);
    facade(P, 'f', y, top, M.frontWin, .72, 2.55, { lining: true }); facade(P, 'r', y, top, M.rearWin, .85, 2.45, { lining: true });
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
      // only where a wall stands behind the lining, so doorways stay open
      const walls = lv.ext.concat(lv.part), solid = (x, z) => x < .95 || x > W - .95 || walls.some(w => inPoly(x, z, w.o, w.h));
      const clampX = r => [Math.max(r[0], .95), r[1], Math.min(r[2], W - .95), r[3]];   // party-wall linings stand 0.95 m in from the gables
      const lining = (r, side) => {
        const t = .025, h0 = y + .02, h1 = y + lv.ceil - .02, horiz = side === 0 || side === 2;
        const a0 = horiz ? r[0] : r[1], a1 = horiz ? r[2] : r[3], st = .1;
        let run = null;
        const flush = e => { if (run == null) return; const q = horiz ? (side === 0 ? [run, r[1], e, r[1] + t] : [run, r[3] - t, e, r[3]]) : (side === 3 ? [r[0], run, r[0] + t, e] : [r[2] - t, run, r[2], e]); rect(p('terrazzo'), q, h0, h1); run = null; };
        for (let a = a0; a < a1 - 1e-6; a += st) {
          const m = Math.min(a + st / 2, a1), ok = horiz ? solid(m, side === 0 ? r[1] - .06 : r[3] + .06) : solid(side === 3 ? r[0] - .06 : r[2] + .06, m);
          if (ok && run == null) run = a; if (!ok) flush(a);
        }
        flush(a1);
      };
      for (const n in lv.wet) lv.wet[n].forEach(r0 => { const r = clampX(r0); [0, 1, 2, 3].forEach(sd => lining(r, sd)); });
      lv.fix.forEach(f => {
        const sh = f.b[0] < .95 ? .95 - f.b[0] : f.b[2] > W - .95 ? W - .95 - f.b[2] : 0, [x0, z0, x1, z1] = [f.b[0] + sh, f.b[1], f.b[2] + sh, f.b[3]]; const g = { x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, r: f.r, t: f.t };
        if (f.t === 'sink') { b('steel').rect([g.x - .22, g.z - .18, g.x + .22, g.z + .18], y + .9, y + .915); return; }
        fixture(g, y, b, lv.ceil);
      });
      (lv.hob || []).forEach(r => b('black').rect([r[0] + .03, r[1] + .03, r[2] - .03, r[3] - .03], y + .9, y + .912));
      lv.kit.forEach(k => {
        const r = k.b; b('unit').rect(r, y, y + .86); b('top').rect([r[0] - .01, r[1] - .01, r[2] + .01, r[3] + .01], y + .86, y + .9);
        const back = .35, wu = k.side === 'n' ? [r[0], r[1], r[2], r[1] + back] : k.side === 's' ? [r[0], r[3] - back, r[2], r[3]] : k.side === 'e' ? [r[2] - back, r[1], r[2], r[3]] : k.side === 'w' ? [r[0], r[1], r[0] + back, r[3]] : null;
        if (wu) b('unit').rect(wu, y + 1.45, y + 2.15);
      });
      lv.tall.forEach(r => b('unit').rect(r, y, y + 2.2));
      // the two bedrooms are finished differently (site photos): Bedroom 1 an oak storage bed under cage lights,
      // Bedroom 2 a charcoal frame bed beside a shelved alcove over a slatted radiator cover
      const bedroomOf = (fl, x, z) => { let best = null, bd = 1e9; lv.rooms.forEach(r => { if (r.flat === fl && /^Bedroom/.test(r.name)) { const d = Math.hypot(r.x - x, r.z - z); if (d < bd) { bd = d; best = r.name; } } }); return best; };
      lv.furn.forEach(f => { const st = /^bed/.test(f.t) ? (bedroomOf(f.flat, f.x, f.z) === 'Bedroom 2' ? 'frame' : 'oak') : null; furniture(st ? Object.assign({}, f, { style: st }) : f, y, b); });
      (ALCOVES[L] || []).forEach(a => {
        b('slatDark').rect(a.r, y, y + .04); for (let k = 0; k < 14; k++) { const t = k / 14, u = a.along ? [a.r[0] + (a.r[2] - a.r[0]) * t, a.r[1], a.r[0] + (a.r[2] - a.r[0]) * (t + .045), a.r[3]] : [a.r[0], a.r[1] + (a.r[3] - a.r[1]) * t, a.r[2], a.r[1] + (a.r[3] - a.r[1]) * (t + .045)]; b('slatDark').rect(u, y + .04, y + .8); }
        b('white').rect(a.r, y + .8, y + .86); b('white').rect(a.r, y + 2.1, y + 2.2);
        [1.2, 1.55, 1.85].forEach(h => b('white').rect(a.r, y + h, y + h + .025));
        const r = a.r; b('white').rect([r[0], r[1] - .04, r[2], r[1]], y, y + 2.2); b('white').rect([r[0], r[3], r[2], r[3] + .04], y, y + 2.2);
      });
      (lv.lamps || []).forEach(l => {
        const o = { 0: [0, 1], 2: [0, -1], 1: [-1, 0], 3: [1, 0] }[l.r] || [0, 0], cage = bedroomOf(l.flat, l.x, l.z) !== 'Bedroom 2';
        const px = l.x + o[0] * .14 - CX, pz = l.z + o[1] * .14 - CZ, ly = y + (cage ? 1.55 : 1.25);
        b('iron').rect([l.x + o[0] * .02 - .04, l.z + o[1] * .02 - .04, l.x + o[0] * .02 + .04, l.z + o[1] * .02 + .04], ly - .12, ly - .04);
        if (cage) {   // black wire cage around an amber filament bulb
          const c = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(.075, 0)), new THREE.LineBasicMaterial({ color: 0x111111 }));
          c.scale.set(1, 1.45, 1); c.position.set(px, ly, pz); grp.add(c);
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), mats.bulb); bulb.position.set(px, ly - .02, pz); grp.add(bulb);
        } else b('iron').rect([px + CX - .035, pz + CZ - .035, px + CX + .035, pz + CZ + .035], ly - .1, ly + .02);
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
