import indice from './busca-indice.js';
const campo = document.querySelector('#docs-busca');
const resultados = document.querySelector('#busca-resultados');
const lista = resultados.querySelector('ul');
const status = document.querySelector('#busca-status');
const raiz = new URL('./', import.meta.url);
const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const itens = indice.map(item => ({...item, busca: normalizar(item.titulo + ' ' + item.texto)}));
campo.addEventListener('input', () => {
  const termos = normalizar(campo.value.trim()).split(/\s+/).filter(Boolean);
  resultados.hidden = !termos.length;
  lista.replaceChildren();
  if (!termos.length) return;
  const encontrados = itens.filter(item => termos.every(termo => item.busca.includes(termo)));
  status.textContent = encontrados.length ? `${encontrados.length} resultados` : 'Nenhum resultado. Tente outro termo.';
  for (const item of encontrados) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = new URL(item.url, raiz).href;
    link.textContent = item.titulo;
    const estado = document.createElement('small');
    estado.textContent = item.estado;
    li.append(link, estado); lista.append(li);
  }
});
document.addEventListener('keydown', evento => {
  if (evento.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {evento.preventDefault(); campo.focus();}
  if (evento.key === 'Escape') {campo.value = ''; campo.dispatchEvent(new Event('input')); campo.focus();}
  if (evento.key === 'ArrowDown' && document.activeElement === campo) {evento.preventDefault(); lista.querySelector('a')?.focus();}
  if (evento.key === 'ArrowDown' && lista.contains(document.activeElement)) {evento.preventDefault(); document.activeElement.parentElement.nextElementSibling?.querySelector('a')?.focus();}
  if (evento.key === 'ArrowUp' && lista.contains(document.activeElement)) {evento.preventDefault(); const anterior = document.activeElement.parentElement.previousElementSibling?.querySelector('a'); (anterior || campo).focus();}
});
const sumario = document.querySelector('#docs-sumario');
let numero = 0;
for (const titulo of document.querySelectorAll('.docs-artigo h2, .docs-artigo h3')) {
  if (!titulo.id) titulo.id = `secao-${++numero}`;
  const link = document.createElement('a');link.href = '#' + titulo.id;link.textContent = titulo.textContent;sumario.append(link);
}
if (matchMedia('(max-width: 800px)').matches) {document.querySelector('.docs-menu').open = false; document.querySelector('.docs-sumario details').open = false;}

for (const botao of document.querySelectorAll('.copiar')) {
  botao.addEventListener('click', async () => {
    const codigo = botao.closest('.codigo')?.querySelector('code');
    if (!codigo) return;
    try {await navigator.clipboard.writeText(codigo.textContent); botao.textContent = 'Copiado';}
    catch {botao.textContent = 'Selecione o código para copiar';}
  });
}
