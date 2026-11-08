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

