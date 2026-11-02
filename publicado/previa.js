// Ilustrações do site, independentes dos pacotes de MODs.
// O padrão genérico atende qualquer novo MOD sem inventar funcionalidades.
function no(tag, classe, texto) {
  const el = document.createElement(tag);
  el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

export function criarPrevia(mod, ampliada = false) {
  const previa = no('span', `mod-previa${ampliada ? ' mod-previa--ampliada' : ''}`);
  const nome = mod.id.split('/').pop();
  previa.dataset.mod = nome;
  previa.setAttribute('aria-hidden', 'true');
  const desenho = no('span', 'previa-desenho');
  if (mod.id === 'seele/estilo') {
    desenho.classList.add('previa-paleta');
    for (let i = 0; i < 4; i++) desenho.append(no('i', 'previa-cor'));
  } else if (mod.id === 'seele/mesa') {
    desenho.classList.add('previa-mapa');
    for (const simbolo of ['◇', '○', '△']) desenho.append(no('i', 'previa-peca', simbolo));
  } else if (mod.id === 'seele/perfis') {
    desenho.classList.add('previa-pessoas');
    for (const letra of ['A', 'B', 'C']) desenho.append(no('i', 'previa-pessoa', letra));
  } else {
    desenho.classList.add('previa-generica');
    desenho.append(no('span', 'previa-monograma', Array.from(mod.titulo)[0] ?? '+'));
    desenho.append(no('span', 'previa-identificador', mod.id));
  }
  previa.append(desenho, no('span', 'previa-aviso', 'Ilustração · ' + mod.titulo));
  return previa;
}
