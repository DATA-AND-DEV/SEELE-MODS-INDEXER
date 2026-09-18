// Progressive enhancement: o HTML contém todos os capítulos sem JavaScript.
const artigos = [...document.querySelectorAll('article[data-slug]')];
const modos = [...document.querySelectorAll('.modos [role=tab]')];
const busca = document.querySelector('#buscar-guia');
const resultados = document.querySelector('#resultados');
const lista = document.querySelector('#lista-resultados');
const contagem = document.querySelector('#contagem');
const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const indice = artigos.map(el => ({el,rota:el.dataset.mode+'/'+el.dataset.slug,titulo:el.dataset.title,texto:normalizar(el.textContent),resumo:el.querySelector('h2 + p')?.textContent || el.querySelector('p:not(.coordenada)')?.textContent || ''}));
let atual = null;
const ultimos = {guia:'comecar',referencia:'visao'};
function abrir() {
  const rota = location.hash.slice(1).replace(/^\//,'');
  atual = indice.find(a=>a.rota===rota) || indice[0];
  const modo = atual.el.dataset.mode;
  ultimos[modo] = atual.el.dataset.slug;
  modos.forEach(b=>{const ativo=b.id==='modo-'+modo;b.setAttribute('aria-selected',String(ativo));b.tabIndex=ativo?0:-1;});
  document.querySelectorAll('.documentacao').forEach(p=>p.hidden=p.id!=='painel-'+modo);
  artigos.forEach(a=>a.hidden=a!==atual.el);
  document.querySelectorAll('.sumario [role=tab]').forEach(tab=>{const ativo=tab.hash==='#'+atual.rota;tab.setAttribute('aria-selected',String(ativo));tab.tabIndex=ativo?0:-1;});
  document.title=atual.titulo+' — Criar MODs SEELE';
  document.querySelector('#painel-'+modo+' .sumario [aria-selected="true"]')?.scrollIntoView({block:'nearest',inline:'nearest'});
  if(busca.value)pesquisar();
}
function navegar(rota){
  busca.value='';resultados.hidden=true;
  if(location.hash==='#'+rota)abrir();else location.hash=rota;
}
modos.forEach(b=>b.onclick=()=>navegar(b.id.slice(5)+'/'+ultimos[b.id.slice(5)]));
window.addEventListener('hashchange',()=>{
  if(location.hash==='#conteudo'){document.querySelector('#conteudo').focus();return;}
  abrir();
  if(!busca.value){
    if(document.activeElement?.getAttribute('role')!=='tab')atual.el.focus({preventScroll:true});
    atual.el.scrollIntoView({block:'start'});
  }
});
// Teclas de abas: o foco acompanha a seleção, sem capturar Tab.
document.querySelectorAll('[role=tablist]').forEach(list=>list.addEventListener('keydown',e=>{
  if(!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  const tabs=[...list.querySelectorAll('[role=tab]')],index=tabs.indexOf(document.activeElement);
  if(index<0)return;
  e.preventDefault();
  const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+tabs.length)%tabs.length;
  tabs[next].click();tabs[next].focus();
}));
function pesquisar(){
  const termos=normalizar(busca.value.trim()).split(/\s+/).filter(Boolean);
  if(!termos.length){resultados.hidden=true;lista.replaceChildren();abrirSemBusca();return;}
  resultados.hidden=false;
  document.querySelectorAll('.documentacao').forEach(p=>p.hidden=true);
  const achados=indice.filter(a=>termos.every(t=>a.texto.includes(t)));
  contagem.textContent=achados.length?`${achados.length} capítulos encontrados em todo o guia.`:'Nenhum capítulo encontrado. Tente “pedido”, “arquivo” ou “permissão”.';
  lista.replaceChildren(...achados.map(a=>{
    const link=document.createElement('a');link.href='#'+a.rota;
    const title=document.createElement('strong');title.textContent=a.titulo;
    const resumo=document.createElement('span');resumo.textContent=a.resumo.slice(0,200);
    link.append(title,resumo);link.onclick=()=>navegar(a.rota);return link;
  }));
}
function abrirSemBusca(){
  document.querySelectorAll('.documentacao').forEach(p=>p.hidden=p.id!=='painel-'+atual.el.dataset.mode);
}
busca.addEventListener('input',pesquisar);
document.querySelector('#limpar-busca').onclick=()=>{busca.value='';pesquisar();busca.focus();};
let avisoTimer;
document.querySelectorAll('.copiar').forEach(botao=>botao.onclick=async()=>{
  const codigo=botao.closest('.codigo').querySelector('code');
  const status=document.querySelector('#status-copia');
  clearTimeout(avisoTimer);
  try{await navigator.clipboard.writeText(codigo.textContent);status.textContent='Código copiado.';}
  catch{const range=document.createRange();range.selectNodeContents(codigo);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Selecione Copiar no seu navegador para copiar o código destacado.';}
  avisoTimer=setTimeout(()=>status.textContent='',5000);
});
abrir();

const medirBarra=()=>document.documentElement.style.setProperty("--altura-barra",document.querySelector(".barra-consulta").offsetHeight+"px");
new ResizeObserver(medirBarra).observe(document.querySelector(".barra-consulta"));
medirBarra();
