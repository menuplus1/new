/** Self-contained QR encoder — byte mode, error correction level L, versions
 *  1–10. Just enough for menu/table URLs; no dependency, runs in the browser.
 *  Placement, format info and Reed–Solomon follow ISO/IEC 18004 §6.7–6.9.
 *
 *  ponytail: the mask is fixed to 0 and the format bits are written for mask 0,
 *  so the symbol is valid — the 4 penalty rules only pick a *prettier* mask.
 *  Add them if a scanner ever struggles with a real label.
 *
 *  Verified: matrices for menu/table URLs (versions 2 and 3) were rendered to
 *  pixels and decoded back with jsQR — all round-tripped to the exact URL. */

/** per version (1–10) at ECC L: [data codewords, EC codewords per block, blocks] */
const SPEC: readonly [number, number, number][] = [
  [19, 7, 1], [34, 10, 1], [55, 15, 1], [80, 20, 1], [108, 26, 1],
  [136, 18, 2], [156, 20, 2], [194, 24, 2], [232, 30, 2], [274, 18, 4],
];

/** alignment pattern centre coordinates per version (1–10) */
const ALIGN: readonly number[][] = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

/** GF(256) multiply, primitive polynomial x^8+x^4+x^3+x^2+1 (0x11d) */
function mul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

/** generator polynomial of the given degree, coefficients high→low, monic term implicit */
function rsDivisor(degree: number): Uint8Array {
  const d = new Uint8Array(degree);
  d[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      d[j] = mul(d[j], root);
      if (j + 1 < degree) d[j] ^= d[j + 1];
    }
    root = mul(root, 2);
  }
  return d;
}

function rsRemainder(data: number[], div: Uint8Array): Uint8Array {
  const res = new Uint8Array(div.length);
  for (const b of data) {
    const factor = b ^ res[0];
    res.copyWithin(0, 1);
    res[res.length - 1] = 0;
    for (let i = 0; i < div.length; i++) res[i] ^= mul(div[i], factor);
  }
  return res;
}

const bitAt = (x: number, i: number) => ((x >>> i) & 1) !== 0;

/** true = dark module. Throws if the text needs more than version 10. */
export function qrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const version = SPEC.findIndex(([data], i) => 4 + (i >= 9 ? 16 : 8) + bytes.length * 8 <= data * 8) + 1;
  if (version === 0) throw new Error("QR: النص أطول من سعة الرمز");
  const [dataLen, ecLen, blocks] = SPEC[version - 1];

  // ————— bitstream: mode + count + payload + terminator + pad —————
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version >= 10 ? 16 : 8);
  for (const b of bytes) push(b, 8);
  for (let i = 0; i < 4 && bits.length < dataLen * 8; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCw: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    dataCw.push(byte);
  }
  for (let i = 0; dataCw.length < dataLen; i++) dataCw.push(i % 2 === 0 ? 0xec : 0x11);

  // ————— error correction + interleaving —————
  const raw = dataLen + ecLen * blocks;
  const shortLen = Math.floor(raw / blocks) - ecLen; // data bytes in a short block
  const numShort = blocks - (raw % blocks);
  const div = rsDivisor(ecLen);
  const dataBlocks: number[][] = [];
  const ecBlocks: Uint8Array[] = [];
  for (let i = 0, off = 0; i < blocks; i++) {
    const len = shortLen + (i < numShort ? 0 : 1);
    const block = dataCw.slice(off, off + len);
    off += len;
    dataBlocks.push(block);
    ecBlocks.push(rsRemainder(block, div));
  }
  const cw: number[] = [];
  for (let i = 0; i <= shortLen; i++)
    for (const b of dataBlocks) if (i < b.length) cw.push(b[i]);
  for (let i = 0; i < ecLen; i++) for (const b of ecBlocks) cw.push(b[i]);

  // ————— function patterns —————
  const size = version * 4 + 17;
  const m: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fn: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      m[r][c] = dark;
      fn[r][c] = true;
    }
  };

  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [r0, c0] of [[3, 3], [3, size - 4], [size - 4, 3]]) // finders overwrite the timing row/col
    for (let dr = -4; dr <= 4; dr++)
      for (let dc = -4; dc <= 4; dc++) {
        const d = Math.max(Math.abs(dr), Math.abs(dc));
        set(r0 + dr, c0 + dc, d !== 2 && d !== 4);
      }
  const pos = ALIGN[version - 1];
  for (let i = 0; i < pos.length; i++)
    for (let j = 0; j < pos.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) continue;
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++) set(pos[i] + dr, pos[j] + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }

  // format info: ECC L (01) + mask 0, BCH(15,5) then XOR 0x5412
  const fmtData = 0b01000;
  let fmtRem = fmtData;
  for (let i = 0; i < 10; i++) fmtRem = (fmtRem << 1) ^ ((fmtRem >>> 9) * 0x537);
  const fmt = ((fmtData << 10) | fmtRem) ^ 0x5412;
  for (let i = 0; i <= 5; i++) set(i, 8, bitAt(fmt, i));
  set(7, 8, bitAt(fmt, 6));
  set(8, 8, bitAt(fmt, 7));
  set(8, 7, bitAt(fmt, 8));
  for (let i = 9; i < 15; i++) set(8, 14 - i, bitAt(fmt, i));
  for (let i = 0; i < 8; i++) set(8, size - 1 - i, bitAt(fmt, i));
  for (let i = 8; i < 15; i++) set(size - 15 + i, 8, bitAt(fmt, i));
  set(size - 8, 8, true); // always-dark module

  // version info: BCH(18,6), versions 7+ only
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const v = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(b, a, bitAt(v, i));
      set(a, b, bitAt(v, i));
    }
  }

  // ————— data placement (zig-zag from the right) + mask 0 —————
  let idx = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // the vertical timing column is skipped
    for (let vert = 0; vert < size; vert++)
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const r = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
        if (fn[r][c]) continue;
        const dark = idx < cw.length * 8 && bitAt(cw[idx >>> 3], 7 - (idx & 7));
        m[r][c] = dark !== ((r + c) % 2 === 0); // mask 0
        idx++;
      }
  }
  return m;
}

/** Manual sanity check — not wired into the app. Encodes a known URL and
 *  asserts the symbol is square, the expected size (version 2 → 25) and has the
 *  three finder patterns. `qrSelfCheck()` in a console should return true. */
export function qrSelfCheck(): boolean {
  const m = qrMatrix("https://menuplus.rest/demo?t=1"); // 30 bytes → version 2
  const size = m.length;
  if (size !== 25 || m.some((row) => row.length !== size)) return false;
  const finder = (r0: number, c0: number) => {
    for (let dr = -3; dr <= 3; dr++)
      for (let dc = -3; dc <= 3; dc++)
        if (m[r0 + dr][c0 + dc] !== (Math.max(Math.abs(dr), Math.abs(dc)) !== 2)) return false;
    return true;
  };
  return finder(3, 3) && finder(3, size - 4) && finder(size - 4, 3);
}
