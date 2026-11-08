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
  // local frame against the wall a piece stands on: u runs along the wall (centred), d runs out from the wall
  function wallFrame(f, off) {
    off = off || 0;
    const R = bbox(f), along = f.r === 0 || f.r === 2, cu = along ? f.x : f.z;
    const len = along ? f.d : f.w, wid = along ? f.w : f.d;
    const loc = (u0, u1, d0, d1) => {
      d0 += off; d1 += off;
      if (f.r === 0) return [cu + u0, R[1] + d0, cu + u1, R[1] + d1];
      if (f.r === 2) return [cu + u0, R[3] - d1, cu + u1, R[3] - d0];
      if (f.r === 1) return [R[2] - d1, cu + u0, R[2] - d0, cu + u1];
      return [R[0] + d0, cu + u0, R[0] + d1, cu + u1];
    };
    return { loc, len, wid };
  }
  /* bathroom fittings, as photographed: smart WC in a patterned-tile recess with LED strips, gloss vanity with brass,
     LED mirror, walk-in shower with brass-framed screen and square rainfall head */
  function fixture(f, y, b, ceil) {
    const R = bbox(f), F = wallFrame(f, .027), H = ceil || 2.4;   // fittings stand proud of the 25 mm wall panels
    if (f.t === 'shower') {
      b('white').rect(R, y, y + .05);
      const long = f.w > f.d, opp = { 0: 2, 2: 0, 1: 3, 3: 1 }[f.r];
      const s = sideRect(Object.assign({}, f, { r: opp }), .015, .0);
      if ((long && (opp === 0 || opp === 2)) || (!long && (opp === 1 || opp === 3))) {
        b('glass').rect(s, y + .05, y + 2.0); b('steel').rect(s, y + 1.98, y + 2.03);
        const along = s[2] - s[0] > s[3] - s[1];
        const posts = along ? [[s[0], s[1], s[0] + .03, s[3]], [s[2] - .03, s[1], s[2], s[3]]] : [[s[0], s[1], s[2], s[1] + .03], [s[0], s[3] - .03, s[2], s[3]]];
        posts.forEach(p => b('steel').rect(p, y + .05, y + 2.03));
      }
      const W2 = F.wid / 2;
      b('steel').rect(F.loc(-.13, .13, .22, .48), y + 2.12, y + 2.14);      // square rainfall head
      b('steel').rect(F.loc(-.012, .012, 0, .35), y + 2.14, y + 2.16);
      b('steel').rect(F.loc(-W2 + .25, -W2 + .37, 0, .02), y + 1.05, y + 1.23); // thermostatic controls
      b('patTile').rect(F.loc(.05, Math.min(.6, W2 - .05), 0, .012), y + 1.0, y + 1.35);   // patterned tile niche
      b('led').rect(F.loc(.05, Math.min(.6, W2 - .05), .0, .016), y + 1.35, y + 1.36);
    } else if (f.t === 'wc') {
      const W2 = Math.max(.45, F.wid / 2 + .15);
      b('patTile').rect(F.loc(-W2, W2, 0, .02), y + .01, y + H - .25);    // patterned-tile recess behind the WC
      b('led').rect(F.loc(-W2 + .02, -W2 + .035, 0, .03), y + .05, y + H - .27); b('led').rect(F.loc(W2 - .035, W2 - .02, 0, .03), y + .05, y + H - .27);
      b('steel').rect(F.loc(-W2 - .02, W2 + .02, 0, .04), y + H - .27, y + H - .25);
      b('gloss').rect(F.loc(-.2, .2, .04, .68), y, y + .42);               // floor-standing smart WC
      b('gloss').rect(F.loc(-.21, .21, .04, .2), y + .42, y + .86);        // raised lid
      b('blueGlow').rect(F.loc(-.1, .1, .3, .56), y + .421, y + .425);
    } else if (f.t === 'basin') {
      const W2 = Math.max(.25, F.wid / 2);
      const D = Math.min(.46, F.len + .05);
      b('gloss').rect(F.loc(-W2, W2, 0, D), y + .3, y + .84);              // wall-hung gloss vanity
      b('white').rect(F.loc(-W2, W2, 0, D + .02), y + .84, y + .88);
      b('steel').rect(F.loc(-W2 * .55, W2 * .55, D, D + .02), y + .72, y + .74); b('steel').rect(F.loc(-W2 * .55, W2 * .55, D, D + .02), y + .5, y + .52);
      b('steel').rect(F.loc(-.018, .018, .05, .09), y + .88, y + 1.08); b('steel').rect(F.loc(-.018, .018, .05, .17), y + 1.04, y + 1.08);   // brushed-brass tap
      b('led').rect(F.loc(-W2 - .03, W2 + .03, 0, .01), y + 1.12, y + 1.86); // LED mirror
      b('mirror').rect(F.loc(-W2, W2, .01, .025), y + 1.14, y + 1.84);
    } else if (f.t === 'hob') {
      b('black').rect([R[0] + .03, R[1] + .03, R[2] - .03, R[3] - .03], y + .9, y + .912);
    } else if (f.t === 'sink') {
      b('steel').rect([R[0] - .05, R[1] - .02, R[2] + .05, R[3] + .02], y + .9, y + .908);
    }
  }
  function furniture(f, y, b) {
    const R = bbox(f), t = f.t;
    if (t === 'bed2' || t === 'bed1') {
      const F = wallFrame(f), U = F.wid / 2, Lg = F.len;
      if (f.style === 'frame') {   // charcoal frame bed with oak top rails and pine slats (bedroom photo)
        [[-U, -U + .06, 0, .06, 1.0], [U - .06, U, 0, .06, 1.0], [-U, -U + .06, Lg - .06, Lg, .55], [U - .06, U, Lg - .06, Lg, .55]].forEach(([a, c, d0, d1, h]) => b('charcoal').rect(F.loc(a, c, d0, d1), y, y + h));
        b('charcoal').rect(F.loc(-U, -U + .04, .06, Lg - .06), y + .25, y + .34); b('charcoal').rect(F.loc(U - .04, U, .06, Lg - .06), y + .25, y + .34);
        for (let d = .15; d < Lg - .1; d += .2) b('pine').rect(F.loc(-U + .04, U - .04, d, d + .07), y + .32, y + .34);
        b('charcoal').rect(F.loc(-U + .06, U - .06, 0, .03), y + .4, y + .45); b('charcoal').rect(F.loc(-U + .06, U - .06, 0, .03), y + .9, y + .96);
        for (let u = -U + .14; u < U - .1; u += .1) b('charcoal').rect(F.loc(u, u + .035, .005, .025), y + .45, y + .9);
        b('oak').rect(F.loc(-U - .01, U + .01, -.01, .07), y + 1.0, y + 1.03);
        b('charcoal').rect(F.loc(-U + .06, U - .06, Lg - .03, Lg), y + .3, y + .5); b('oak').rect(F.loc(-U - .01, U + .01, Lg - .07, Lg + .01), y + .55, y + .58);
      } else {                      // oak storage bed with drawers and a quilted mattress (bedroom photo)
        b('oak').rect(F.loc(-U, U, .05, Lg), y, y + .36);
        b('charcoal').rect(F.loc(-U - .002, U + .002, .5, .51), y + .04, y + .32);
        b('mattress').rect(F.loc(-U + .03, U - .03, .08, Lg - .03), y + .36, y + .58);
        b('oak').rect(F.loc(-U - .03, U + .03, 0, .05), y, y + 1.08);
      }
    } else if (t === 'bedside') {
      /* none in the finished bedrooms */
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
