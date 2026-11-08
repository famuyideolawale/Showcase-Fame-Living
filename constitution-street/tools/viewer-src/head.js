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
