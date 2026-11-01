// Monta as três metades a partir de fonte/ e receitas/. Uma receita que não
// passa no validador não vira pacote: o build para e diz cada erro.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const { montar, corpo, lerReceitas, RAIZ } = require('./montar.cjs');

const ctx = vm.createContext({});
vm.runInContext(corpo('servidor').replace(/globalThis\.aoPedir[\s\S]*$/, '') + '\n;globalThis.__v = validarReceita;', ctx);
let falhou = false;
for (const { arquivo, receita } of lerReceitas()) {
  const r = ctx.__v(receita);
  for (const erro of r.erros) { console.error(`receitas/${arquivo}: ${erro}`); falhou = true; }
}
if (falhou) process.exit(1);
for (const metade of ['servidor', 'maquina', 'cliente']) {
  writeFileSync(`${RAIZ}/${metade}/main.js`, montar(metade));
  console.log(`${metade}/main.js`);
}
