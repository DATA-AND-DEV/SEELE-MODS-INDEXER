// Um zip mínimo, escrito e lido à mão (stored e deflate, sem zip64), para os
// testes do modpack: o `.mrpack` de prova e o que o anfitrião e a máquina
// falsos abrem. O produto tem o leitor dele (seele-server `mods::pack`, e o
// `desempacotar` do núcleo); este é só o dos testes.
'use strict';
const zlib = require('node:zlib');

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** `entradas`: [[nome, Buffer|string, deflate?]]. Determinístico: hora e data zero. */
function escreverZip(entradas) {
  const partes = [];
  const diretorio = [];
  let deslocamento = 0;
  for (const [nome, conteudo, deflate] of entradas) {
    const dados = Buffer.isBuffer(conteudo) ? conteudo : Buffer.from(conteudo);
    const comprimido = deflate ? zlib.deflateRawSync(dados) : dados;
    const n = Buffer.from(nome);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt32LE(crc32(dados), 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(dados.length, 22);
    local.writeUInt16LE(n.length, 26);
    partes.push(local, n, comprimido);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(deflate ? 8 : 0, 10);
    central.writeUInt32LE(crc32(dados), 16);
    central.writeUInt32LE(comprimido.length, 20);
    central.writeUInt32LE(dados.length, 24);
    central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(deslocamento, 42);
    diretorio.push(central, n);
    deslocamento += 30 + n.length + comprimido.length;
  }
  const cd = Buffer.concat(diretorio);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(entradas.length, 8);
  fim.writeUInt16LE(entradas.length, 10);
  fim.writeUInt32LE(cd.length, 12);
  fim.writeUInt32LE(deslocamento, 16);
  return Buffer.concat([...partes, cd, fim]);
}

/** Cada entrada de um zip: [{ nome, dados }]. */
function lerZip(buf) {
  let fim = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { fim = i; break; }
  if (fim < 0) throw new Error('não é zip');
  const quantas = buf.readUInt16LE(fim + 10);
  let i = buf.readUInt32LE(fim + 16);
  const saida = [];
  for (let k = 0; k < quantas; k++) {
    const metodo = buf.readUInt16LE(i + 10);
    const tamanho = buf.readUInt32LE(i + 20);
    const nomeTam = buf.readUInt16LE(i + 28);
    const extra = buf.readUInt16LE(i + 30) + buf.readUInt16LE(i + 32);
    const local = buf.readUInt32LE(i + 42);
    const nome = buf.subarray(i + 46, i + 46 + nomeTam).toString();
    const inicio = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const cru = buf.subarray(inicio, inicio + tamanho);
    saida.push({ nome, dados: metodo === 8 ? zlib.inflateRawSync(cru) : Buffer.from(cru) });
    i += 46 + nomeTam + extra;
  }
  return saida;
}

module.exports = { escreverZip, lerZip };
