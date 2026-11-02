// Empacota só o que roda. Nunca sobrescreve uma instalação existente.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = process.argv[2];
if (!destino || !path.isAbsolute(destino)) throw new Error('Uso: node ferramentas/package.mjs /caminho/absoluto/novo/mods/autor/nome');
if (fs.existsSync(destino)) throw new Error('Destino já existe. Escolha uma pasta nova para preservar a instalação e os dados.');
const manifesto = JSON.parse(fs.readFileSync(path.join(root, 'mod.json'), 'utf8'));
// As receitas vão dentro das metades (o build as embute); o pacote leva as metades.
const arquivos = ['mod.json', manifesto.client, manifesto.server, manifesto.maquina, ...(manifesto.arquivos ?? [])];
for (const arquivo of arquivos) {
  const origem = path.join(root, arquivo);
  if (!fs.existsSync(origem)) throw new Error('O manifesto declara «' + arquivo + '» e ele não está no repositório.');
  const saida = path.join(destino, arquivo);
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.copyFileSync(origem, saida);
}
console.log(destino);
