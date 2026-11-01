//! O MOD de multiplayer, no motor de verdade: as três metades no QuickJS
//! 0.12.2, com o teto de 8 MiB, conversando entre si.
//!
//! - a **metade de servidor** sobe com o que a API 8 dá a ela (`dados`,
//!   `mundo.buscar` respondido pelas fixtures, `mundo.avisar`,
//!   `mundo.maquinas.pedir` e `.avisar`) e atende a janela e a máquina;
//! - a **metade de máquina** sobe em cima do prelúdio do motor
//!   (`SEELE_RAIZ/crates/seele-motor/src/preludio.rs`), com as capacidades
//!   `maquina`, `maquina.porta` e `maquina.programa` do contrato e o aceite em
//!   `__seeleMaquina`, como o app a sobe; cada mensagem que ela posta é
//!   respondida como o app responde, e ela passa por aceitar, baixar,
//!   desempacotar, escrever, rodar, ficar pronta, servir o túnel, ver alguém
//!   entrar, parar, e parar de novo pelo `aoParar` do produto;
//! - a **metade de cliente** sobe em cima do mesmo prelúdio, sem DOM e sem
//!   Node, e o clique de «entrar» leva o bilhete de gesto.
//!
//! # O que este exercício não prova
//!
//! O executor do app, a tela de aceite, o download, o pacote e o processo de
//! verdade (isso é o `programa` do SEELE, medido no SEELE). É o motor, o teto
//! de memória, o prelúdio e os nomes que o adaptador chama.

use rquickjs::{Context, Function, Runtime};
use serde_json::{json, Value};
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

type Erro = Box<dyn std::error::Error>;

fn preludio() -> Result<String, String> {
    const FONTE: &str = include_str!(concat!(env!("SEELE_RAIZ"), "/crates/seele-motor/src/preludio.rs"));
    const MARCA: &str = "pub const PRELUDIO: &str = r#\"";
    let inicio = FONTE.find(MARCA).ok_or("`PRELUDIO` não foi encontrado em preludio.rs")?;
    let resto = &FONTE[inicio + MARCA.len()..];
    let fim = resto.find("\"#;").ok_or("`PRELUDIO` não fecha")?;
    Ok(resto[..fim].to_owned())
}

fn motor() -> Result<(Runtime, Context), Erro> {
    let runtime = Runtime::new()?;
    runtime.set_memory_limit(8 * 1024 * 1024);
    let started = std::time::Instant::now();
    runtime.set_interrupt_handler(Some(Box::new(move || started.elapsed().as_secs() > 20)));
    let context = Context::full(&runtime)?;
    Ok((runtime, context))
}

fn avaliar(ctx: &Context, codigo: &str, onde: &str) -> Result<(), Erro> {
    ctx.with(|c| -> Result<(), String> {
        c.eval::<(), _>(codigo).map_err(|e| format!("{onde}: {e}: {:?}", c.catch()))?;
        while c.execute_pending_job() {}
        Ok(())
    })
    .map_err(|e| std::io::Error::other(e).into())
}

fn texto(ctx: &Context, codigo: &str) -> Result<String, Erro> {
    ctx.with(|c| c.eval::<String, _>(codigo).map_err(|e| format!("{codigo}: {e}: {:?}", c.catch())))
        .map_err(|e| std::io::Error::other(e).into())
}

/// As fixtures: o que `mundo.buscar` responde. Nada sai para a rede.
fn fixtures() -> Result<HashMap<String, String>, Erro> {
    let manifesto = include_str!("../../../test/fixtures/mojang-version_manifest_v2.json");
    let mut mapa = HashMap::new();
    mapa.insert("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json".to_owned(), manifesto.to_owned());
    let lido: Value = serde_json::from_str(manifesto)?;
    let por_id = |id: &str| -> Option<String> {
        lido["versions"].as_array()?.iter().find(|v| v["id"] == id).and_then(|v| v["url"].as_str()).map(str::to_owned)
    };
    mapa.insert(por_id("1.21.4").ok_or("1.21.4")?, include_str!("../../../test/fixtures/mojang-1.21.4.json").to_owned());
    mapa.insert(
        "https://api.adoptium.net/v3/assets/latest/21/hotspot?image_type=jre&vendor=eclipse".to_owned(),
        include_str!("../../../test/fixtures/adoptium-21.json").to_owned(),
    );
    // Com mods (parte 6): a API do Modrinth para o pack de prova.
    mapa.insert(
        "https://api.modrinth.com/v2/project/prova-do-seele/version".to_owned(),
        include_str!("../../../test/fixtures/modrinth-prova-versoes.json").to_owned(),
    );
    Ok(mapa)
}

const AMBIENTE_DO_SERVIDOR: &str = r#"globalThis.dados = {};
    globalThis.__avisos = []; globalThis.__pedidosDeMaquina = []; globalThis.__avisosAMaquina = []; globalThis.__registro = [];
    globalThis.mundo = {
      agora: () => 1000000,
      registrar: t => { __registro.push(String(t)); },
      buscar: url => { const t = __buscar(url); return t === '' ? null : t; },
      avisar: a => { if (JSON.stringify(a.carga).length > 1024) throw new Error('aviso-grande-demais'); __avisos.push(a); return { ok: true }; },
      maquinas: {
        pedir: p => { __pedidosDeMaquina.push(JSON.parse(JSON.stringify(p))); },
        avisar: a => { __avisosAMaquina.push(JSON.parse(JSON.stringify(a))); },
        // A posse (API 8 parte 7): o produto só guarda quem é a dona.
        dona: d => { if (!['principal', 'reserva'].includes(d.papel)) throw new Error('papel-invalido'); },
      },
      // O pack pelo link (seele-server `mods::pack::buscar`): o índice do pack
      // de prova, com o sha512 e o tamanho que a API do Modrinth deu.
      buscarPack: ({ url, sha512, tamanho }) => {
        const v = JSON.parse(__buscar('https://api.modrinth.com/v2/project/prova-do-seele/version'))[0].files[0];
        if (url !== v.url || sha512 !== v.hashes.sha512 || tamanho !== v.size) return { ok: false, erro: 'hash-nao-bate' };
        return { ok: true, bytes: v.size, sha512: v.hashes.sha512, indice: __indiceDaProva };
      },
    };
    globalThis.volume = { esperar: () => true, tamanho: () => null, servir: () => null, apagar: () => true, pack: () => ({ ok: false, erro: 'nao-existe' }) };"#;

fn servidor() -> Result<(Runtime, Context), Erro> {
    let (rt, ctx) = motor()?;
    let mapa = fixtures()?;
    ctx.with(|c| -> Result<(), String> {
        let buscar = Function::new(c.clone(), move |url: String| -> String { mapa.get(&url).cloned().unwrap_or_default() })
            .map_err(|e| e.to_string())?;
        c.globals().set("__buscar", buscar).map_err(|e| e.to_string())
    })
    .map_err(std::io::Error::other)?;
    ctx.with(|c| c.globals().set("__indiceDaProva", include_str!("../../../test/fixtures/fabric-prova.index.json")))
        .map_err(|e| std::io::Error::other(e.to_string()))?;
    avaliar(&ctx, AMBIENTE_DO_SERVIDOR, "ambiente do servidor")?;
    avaliar(&ctx, include_str!("../../../servidor/main.js"), "servidor/main.js")?;
    Ok((rt, ctx))
}

/// Uma volta de `aoPedir`, como o anfitrião a faz.
fn pedir(srv: &Context, contexto: &Value, valor: &Value) -> Result<Value, Erro> {
    srv.with(|c| -> Result<(), String> {
        c.globals().set("__c", contexto.to_string()).map_err(|e| e.to_string())?;
        c.globals().set("__v", valor.to_string()).map_err(|e| e.to_string())
    })
    .map_err(std::io::Error::other)?;
    Ok(serde_json::from_str(&texto(srv, "aoPedir(__c, __v)")?)?)
}

fn momento(srv: &Context, nome: &str, carga: &Value) -> Result<(), Erro> {
    avaliar(srv, &format!("aoAcontecer({}, {})", json!(nome), json!(carga.to_string())), nome)
}

fn de(acao: Option<&str>) -> Value {
    json!({ "person": "1", "channel": null, "admin": true, "write": true, "sala": null, "acao": acao,
            "permissoes": ["criar-servidor-de-jogo", "configurar-servidor-de-jogo", "ligar-desligar-servidor-de-jogo", "entrar-no-jogo"] })
}

fn avisos_a_maquina(srv: &Context) -> Result<Vec<Value>, Erro> {
    Ok(serde_json::from_str(&texto(srv, "JSON.stringify(__avisosAMaquina.splice(0))")?)?)
}

fn estado_do(srv: &Context, id: &str) -> Result<Value, Erro> {
    let e = pedir(srv, &de(None), &json!({ "op": "estado" }))?;
    e["servidores"].as_array().and_then(|l| l.iter().find(|s| s["id"] == id).cloned()).ok_or_else(|| format!("{id} sumiu").into())
}

/// O que a metade de máquina postou, e o que o anfitrião registrou do console.
type Falas = Rc<RefCell<Vec<String>>>;

/// O `seele` do anfitrião num contexto: `postar` guarda na fita (e recusa o
/// que passa dos 12 KiB), `console` guarda no registro.
fn ponte(ctx: &Context, fita: &Falas, registro: &Falas, grandes: &Rc<RefCell<usize>>) -> Result<(), Erro> {
    ctx.with(|c| -> Result<(), String> {
        let eco = Rc::clone(fita);
        let excesso = Rc::clone(grandes);
        let postar = Function::new(c.clone(), move |t: String| -> bool {
            if t.len() > 12 * 1024 { *excesso.borrow_mut() += 1; return false; }
            eco.borrow_mut().push(t);
            true
        }).map_err(|e| e.to_string())?;
        let anotado = Rc::clone(registro);
        let console = Function::new(c.clone(), move |nivel: String, t: String| { anotado.borrow_mut().push(format!("{nivel}: {t}")); })
            .map_err(|e| e.to_string())?;
        let seele = rquickjs::Object::new(c.clone()).map_err(|e| e.to_string())?;
        seele.set("postar", postar).map_err(|e| e.to_string())?;
        seele.set("console", console).map_err(|e| e.to_string())?;
        c.globals().set("seele", seele).map_err(|e| e.to_string())
    }).map_err(|e| std::io::Error::other(e).into())
}

/// O que a máquina fez, até a conversa assentar.
#[derive(Default)]
struct Fita {
    tipos: Vec<String>,
    baixados: Vec<Value>,
    abertos: Vec<Value>,
    escritos: Vec<Value>,
    rodados: Vec<Value>,
    servidos: Vec<Value>,
    parados: Vec<Value>,
    entrada: Vec<String>,
    parada_pronta: bool,
    lidos: Vec<Value>,
}

/// **A conversa da metade de máquina, pelo prelúdio de verdade**: cada
/// mensagem que ela posta é respondida como o app responde
/// (`apps/seele-app/src/maquina.rs` e `maquina/programa.rs`), e cada aviso da
/// metade de servidor chega como `aviso-maquina`, com a carga em texto.
fn assentar_maquina(maq: &Context, falas: &Falas, srv: &Context, id: &str, fita: &mut Fita) -> Result<(), Erro> {
    for _ in 0..400 {
        let vindas: Vec<String> = falas.borrow_mut().drain(..).collect();
        let avisos = avisos_a_maquina(srv)?;
        if vindas.is_empty() && avisos.is_empty() {
            return Ok(());
        }
        for aviso in avisos {
            responder(maq, &json!({ "tipo": "aviso-maquina", "carga": aviso["carga"].to_string() }).to_string())?;
        }
        for t in vindas {
            let m: Value = serde_json::from_str(&t)?;
            let tipo = m["tipo"].as_str().unwrap_or_default().to_owned();
            fita.tipos.push(tipo.clone());
            let valor = match tipo.as_str() {
                "maquina-parada-pronta" => { fita.parada_pronta = true; continue; }
                "maquina-pedir" => {
                    let contexto = json!({ "person": "2", "channel": null, "admin": false, "write": true, "sala": null, "acao": null,
                                           "permissoes": [], "maquina": { "servidor": id } });
                    Value::String(pedir(srv, &contexto, &m["valor"])?.to_string())
                }
                "programa-baixar" => {
                    fita.baixados.push(m.clone());
                    let algoritmo = ["sha512", "sha256", "sha1"].into_iter().find(|a| m.get(*a).is_some()).unwrap_or("?");
                    json!({ "destino": m["destino"], "tamanho": m["tamanho"], "algoritmo": algoritmo, "hash": m[algoritmo] })
                }
                "programa-desempacotar" => { fita.abertos.push(m.clone()); json!({ "arquivos": 3, "bytes": 1000, "linksPulados": 0, "foraDaRaiz": 1 }) }
                "programa-escrever" => { fita.escritos.push(m.clone()); json!({ "destino": m["destino"], "bytes": 1 }) }
                "programa-rodar" => {
                    fita.rodados.push(m.clone());
                    // O instalador do loader sai sozinho, com 0, depois da resposta.
                    let instalador = m["argumentos"].as_array().is_some_and(|a| a.iter().any(|x| x.as_str().is_some_and(|x| x.ends_with("-installer.jar"))));
                    let numero = if instalador { 100 + fita.rodados.len() } else { 1 };
                    responder(maq, &json!({ "n": m["n"], "ok": true, "valor": { "processo": numero, "pid": 4242 } }).to_string())?;
                    if instalador {
                        responder(maq, &json!({ "tipo": "processo-linha", "processo": numero, "fluxo": "saida", "linha": "Done, start server by running fabric-server-launch.jar" }).to_string())?;
                        responder(maq, &json!({ "tipo": "processo-fim", "processo": numero, "codigo": 0, "mortoAPedido": false, "linhasPerdidas": 0, "linhasCortadas": 0 }).to_string())?;
                    }
                    continue;
                }
                // O índice do pack aberto, como o `programa.ler` do app o lê; a
                // marca do loader não existe ainda (a recusa do núcleo, `disco`).
                "programa-ler" => {
                    fita.lidos.push(m.clone());
                    let escrito = fita.escritos.iter().rev().find(|e| e["destino"] == m["arquivo"]).map(|e| e["texto"].clone());
                    if m["arquivo"] == "pack/modrinth.index.json" {
                        Value::String(include_str!("../../../test/fixtures/fabric-prova.index.json").to_owned())
                    } else if let Some(texto) = escrito {
                        // O que a metade escreveu (o server.properties, que ela relê no «Done»).
                        texto
                    } else {
                        responder(maq, &json!({ "n": m["n"], "ok": false, "erro": "disco", "frase": "o disco recusou: No such file" }).to_string())?;
                        continue;
                    }
                }
                "processo-escrever" => { fita.entrada.push(m["texto"].as_str().unwrap_or_default().to_owned()); Value::Null }
                "porta-servir" => { fita.servidos.push(m.clone()); Value::Null }
                "porta-parar" => { fita.parados.push(m.clone()); Value::Null }
                "programa-recusas" => json!({}),
                outro => return Err(format!("a metade de máquina pediu «{outro}», que o app não atende: {m}").into()),
            };
            responder(maq, &json!({ "n": m["n"], "ok": true, "valor": valor }).to_string())?;
        }
    }
    Err("a conversa com a máquina não assentou".into())
}

fn linha_do_jogo(maq: &Context, linha: &str) -> Result<(), Erro> {
    responder(maq, &json!({ "tipo": "processo-linha", "processo": 1, "fluxo": "saida", "linha": linha }).to_string())
}

fn maquina_e_servidor(srv: &Context) -> Result<String, Erro> {
    let r = pedir(srv, &de(Some("criar-servidor-de-jogo")), &json!({ "op": "criar", "receita": "minecraft" }))?;
    let id = r["servidor"]["id"].as_str().ok_or_else(|| format!("criar: {r}"))?.to_owned();
    let r = pedir(srv, &de(Some("configurar-servidor-de-jogo")),
        &json!({ "op": "configurar", "id": id, "versao": "1.21.4", "quem": "2", "config": { "nome": [{ "texto": "Casa", "cor": "aqua" }, { "texto": "do Alê", "cor": "gold" }], "maximo": 6 } }))?;
    if r["ok"] != true { return Err(format!("configurar: {r}").into()); }
    let pedidos: Vec<Value> = serde_json::from_str(&texto(srv, "JSON.stringify(__pedidosDeMaquina)")?)?;
    if pedidos.len() != 1 || pedidos[0]["oferta"]["versao_do_jogo"] != "1.21.4" {
        return Err(format!("a oferta não saiu: {pedidos:?}").into());
    }
    let oferta = pedidos[0]["oferta"].clone();
    let java_do_mac = oferta["artefatos"].as_array().into_iter().flatten()
        .find(|a| a["plataformas"].as_array().is_some_and(|p| p.iter().any(|x| x == "mac-aarch64")))
        .ok_or_else(|| format!("nenhum artefato da oferta é marcado para mac-aarch64: {}", oferta["artefatos"]))?
        .clone();

    // **A metade de máquina sobe como o app a sobe**: o prelúdio da API 8
    // (`SEELE_RAIZ`), as capacidades da máquina do contrato para os dois
    // poderes, e o que foi aceito em `__seeleMaquina`.
    let (_rm, maq) = motor()?;
    let (falas, registro, grandes): (Falas, Falas, Rc<RefCell<usize>>) = Default::default();
    ponte(&maq, &falas, &registro, &grandes)?;
    let contrato: Value = serde_json::from_str(include_str!("../../../test/contrato/api-v8.json"))?;
    let da_maquina = &contrato["compatibilidade"]["capacidades-da-maquina"];
    let mut capacidades = da_maquina["base"].as_array().cloned().ok_or("sem capacidades-da-maquina.base")?;
    for poder in ["porta", "programa"] {
        capacidades.extend(da_maquina[poder].as_array().cloned().ok_or(format!("sem capacidades-da-maquina.{poder}"))?);
    }
    avaliar(&maq, &format!("globalThis.__seeleCapacidades = {};", Value::Array(capacidades)), "capacidades")?;
    let aceito = json!({ "servidor": id, "oferta": oferta, "plataforma": "mac-aarch64" }).to_string();
    maq.with(|c| c.globals().set("__seeleMaquina", aceito)).map_err(|e| std::io::Error::other(e.to_string()))?;
    avaliar(&maq, &preludio()?, "prelúdio")?;
    if texto(&maq, "[typeof maquina.programa.rodar, typeof maquina.porta.servir, typeof SeeleUI, maquina.plataforma].join(',')")?
        != "function,function,undefined,mac-aarch64" {
        return Err("o prelúdio não deu a metade de máquina da API 8".into());
    }
    avaliar(&maq, include_str!("../../../maquina/main.js"), "maquina/main.js")?;
    let mut fita = Fita::default();
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    if !fita.baixados.is_empty() { return Err("baixou antes do aceite".into()); }

    momento(srv, "MaquinaAceitou", &json!({ "servidor": id, "pessoa": "2" }))?;
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    let destinos: Vec<String> = fita.baixados.iter().filter_map(|b| b["destino"].as_str().map(str::to_owned)).collect();
    let pacote = format!("pacotes/{}", java_do_mac["nome"].as_str().unwrap_or_default());
    if destinos != ["server.jar".to_owned(), pacote.clone()] || fita.baixados[0]["sha1"].as_str().map(str::len) != Some(40)
        || fita.baixados[1]["sha256"] != java_do_mac["hash"]["hex"]
        || fita.baixados[1]["url"] != java_do_mac["url"] {
        return Err(format!("baixou errado: {:?}", fita.baixados).into());
    }
    if fita.abertos.len() != 1 || fita.abertos[0]["arquivo"] != pacote.as_str() || fita.abertos[0]["destino"] != "java"
        || !fita.abertos[0]["raiz"].as_str().unwrap_or_default().ends_with("-jre/Contents/Home") {
        return Err(format!("desempacotou errado: {:?}", fita.abertos).into());
    }
    if !fita.escritos.is_empty() { return Err("escreveu antes de ligar".into()); }

    pedir(srv, &de(Some("ligar-desligar-servidor-de-jogo")), &json!({ "op": "ligar", "id": id }))?;
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    let caminhos: Vec<String> = fita.escritos.iter().filter_map(|e| e["destino"].as_str().map(str::to_owned)).collect();
    if caminhos != ["eula.txt", "server.properties"] { return Err(format!("escreveu: {caminhos:?}").into()); }
    if fita.rodados.len() != 1 || fita.rodados[0]["comando"] != "java/bin/java" || fita.rodados[0]["pasta"] != "" {
        return Err(format!("rodou: {:?}", fita.rodados).into());
    }
    if !fita.servidos.is_empty() { return Err("serviu o túnel antes do Done".into()); }

    linha_do_jogo(&maq, r#"[12:00:04] [Server thread/INFO]: Done (4.211s)! For help, type "help""#)?;
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    linha_do_jogo(&maq, "[12:01:00] [Server thread/INFO]: Bia joined the game")?;
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    if fita.servidos.len() != 1 || fita.servidos[0]["porta"] != 25565 || fita.servidos[0]["nome"] != id.as_str() {
        return Err(format!("túnel: {:?}", fita.servidos).into());
    }
    let s = estado_do(srv, &id)?;
    if s["estado"] != "ligado" || s["jogadores"] != json!(["Bia"]) { return Err(format!("estado ligado: {s}").into()); }

    pedir(srv, &de(Some("ligar-desligar-servidor-de-jogo")), &json!({ "op": "desligar", "id": id }))?;
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    if fita.entrada != ["stop\n"] { return Err(format!("entrada: {:?}", fita.entrada).into()); }
    responder(&maq, &json!({ "tipo": "processo-fim", "processo": 1, "codigo": 0, "mortoAPedido": false, "linhasPerdidas": 0, "linhasCortadas": 0 }).to_string())?;
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    let s = estado_do(srv, &id)?;
    if s["estado"] != "desligado" || !s["falhas"].as_array().map(Vec::is_empty).unwrap_or(false) {
        return Err(format!("estado desligado: {s}").into());
    }
    if fita.parados.len() != 1 { return Err(format!("o túnel não foi parado: {:?}", fita.parados).into()); }

    // Liga de novo e para pelo produto: o `aoParar` manda `stop` e espera o fim.
    pedir(srv, &de(Some("ligar-desligar-servidor-de-jogo")), &json!({ "op": "ligar", "id": id }))?;
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    responder(&maq, &json!({ "tipo": "parar-maquina", "motivo": "pelo-dono" }).to_string())?;
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    if fita.entrada != ["stop\n", "stop\n"] { return Err(format!("o aoParar não mandou stop: {:?}", fita.entrada).into()); }
    if fita.parada_pronta { return Err("o aoParar acabou antes de o jogo sair".into()); }
    responder(&maq, &json!({ "tipo": "processo-fim", "processo": 1, "codigo": 0, "mortoAPedido": false, "linhasPerdidas": 0, "linhasCortadas": 0 }).to_string())?;
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    if !fita.parada_pronta { return Err("o aoParar não terminou depois de o jogo sair".into()); }

    let erros: Vec<String> = registro.borrow().iter().filter(|l| l.starts_with("error") || l.starts_with("warn")).cloned().collect();
    if !erros.is_empty() { return Err(format!("a máquina anotou erros: {erros:?}").into()); }
    if *grandes.borrow() > 0 { return Err("uma mensagem da máquina passou dos 12 KiB".into()); }
    // Deixa o servidor de jogo ligado para a janela ver o cartão.
    avaliar(srv, &format!("aoPedir({}, {})", json!(json!({"person":"2","maquina":{"servidor":id}}).to_string()),
        json!(json!({"op":"estado","estado":"ligado","jogadores":["Bia"]}).to_string())), "religar")?;
    println!("máquina (prelúdio da API 8, maquina.programa): aceitar, baixar {} artefato(s), desempacotar o Java de {}, escrever {}, rodar, Done, túnel na {}, Bia dentro, stop e desligado, e o aoParar que espera o jogo; tipos: {}.",
        fita.baixados.len(), fita.abertos[0]["raiz"], caminhos.join(" e "), fita.servidos[0]["porta"],
        { let mut t = fita.tipos.clone(); t.sort(); t.dedup(); t.join(", ") });
    Ok(id)
}

/// **Com mods, pelo prelúdio de verdade** (parte 6): o pack de prova pelo link
/// do Modrinth, a oferta com o instalador e o hash, e a máquina que baixa o
/// .mrpack do CDN, abre, lê o índice (`programa.ler`), baixa só os arquivos do
/// servidor pelo sha512, aplica os overrides e os server-overrides por cima
/// (`mesclar`) e roda o instalador do Fabric com os argumentos aceitos.
fn com_mods(srv: &Context) -> Result<(), Erro> {
    let r = pedir(srv, &de(Some("criar-servidor-de-jogo")), &json!({ "op": "criar", "receita": "minecraft" }))?;
    let id = r["servidor"]["id"].as_str().ok_or_else(|| format!("criar: {r}"))?.to_owned();
    let r = pedir(srv, &de(Some("configurar-servidor-de-jogo")), &json!({ "op": "configurar", "id": id, "variante": "com-mods", "quem": "2", "config": {} }))?;
    if r["ok"] != true { return Err(format!("configurar com mods: {r}").into()); }
    let r = pedir(srv, &de(Some("configurar-servidor-de-jogo")), &json!({ "op": "pack-link", "id": id, "link": "https://modrinth.com/modpack/prova-do-seele" }))?;
    if r["ok"] != true { return Err(format!("pack-link: {r}").into()); }
    let pedidos: Vec<Value> = serde_json::from_str(&texto(srv, "JSON.stringify(__pedidosDeMaquina)")?)?;
    let oferta = pedidos.last().ok_or("a oferta com mods não saiu")?["oferta"].clone();
    if oferta["pack"]["algoritmo"] != "sha512" || oferta["instalar"]["argumentos"][1] != "fabric-installer.jar" {
        return Err(format!("a oferta com mods: {oferta}").into());
    }
    let (_rm, maq) = motor()?;
    let (falas, registro, grandes): (Falas, Falas, Rc<RefCell<usize>>) = Default::default();
    ponte(&maq, &falas, &registro, &grandes)?;
    let contrato: Value = serde_json::from_str(include_str!("../../../test/contrato/api-v8.json"))?;
    let da_maquina = &contrato["compatibilidade"]["capacidades-da-maquina"];
    let mut capacidades = da_maquina["base"].as_array().cloned().ok_or("sem capacidades-da-maquina.base")?;
    for poder in ["porta", "programa"] {
        capacidades.extend(da_maquina[poder].as_array().cloned().ok_or(format!("sem capacidades-da-maquina.{poder}"))?);
    }
    avaliar(&maq, &format!("globalThis.__seeleCapacidades = {};", Value::Array(capacidades)), "capacidades")?;
    let aceito = json!({ "servidor": id, "oferta": oferta, "plataforma": "mac-aarch64" }).to_string();
    maq.with(|c| c.globals().set("__seeleMaquina", aceito)).map_err(|e| std::io::Error::other(e.to_string()))?;
    avaliar(&maq, &preludio()?, "prelúdio")?;
    if texto(&maq, "[typeof maquina.programa.trazer, typeof maquina.programa.ler].join(',')")? != "function,function" {
        return Err("o prelúdio não deu trazer e ler à metade de máquina".into());
    }
    avaliar(&maq, include_str!("../../../maquina/main.js"), "maquina/main.js")?;
    let mut fita = Fita::default();
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    momento(srv, "MaquinaAceitou", &json!({ "servidor": id, "pessoa": "2" }))?;
    assentar_maquina(&maq, &falas, srv, &id, &mut fita)?;
    let destinos: Vec<String> = fita.baixados.iter().filter_map(|b| b["destino"].as_str().map(str::to_owned)).collect();
    let mods: Vec<&String> = destinos.iter().filter(|d| d.starts_with("mods/")).collect();
    if !destinos.contains(&"pack.mrpack".to_owned()) || !destinos.contains(&"fabric-installer.jar".to_owned())
        || mods != ["mods/fabric-api-0.119.4+1.21.4.jar", "mods/lithium-fabric-0.15.3+mc1.21.4.jar"]
        || fita.baixados.iter().filter(|b| b["destino"].as_str().is_some_and(|d| d.starts_with("mods/"))).any(|b| b["sha512"].as_str().map(str::len) != Some(128)) {
        return Err(format!("com mods, baixou: {destinos:?}").into());
    }
    let mesclados: Vec<(String, String)> = fita.abertos.iter().filter(|a| a["mesclar"] == true)
        .map(|a| (a["raiz"].as_str().unwrap_or_default().to_owned(), a["destino"].as_str().unwrap_or_default().to_owned())).collect();
    if mesclados != [("overrides".to_owned(), String::new()), ("server-overrides".to_owned(), String::new())] {
        return Err(format!("com mods, os overrides: {:?}", fita.abertos).into());
    }
    let instalar: Vec<&str> = fita.rodados.first().and_then(|r| r["argumentos"].as_array()).into_iter().flatten().filter_map(Value::as_str).collect();
    if instalar != ["-jar", "fabric-installer.jar", "server", "-mcversion", "1.21.4", "-loader", "0.16.14"] {
        return Err(format!("com mods, o instalador: {:?}", fita.rodados).into());
    }
    if !fita.escritos.iter().any(|e| e["destino"] == ".seele-loader") { return Err(format!("a marca do loader: {:?}", fita.escritos).into()); }
    let s = estado_do(srv, &id)?;
    if s["estado"] != "pronto" { return Err(format!("com mods, o estado: {s}").into()); }
    let erros: Vec<String> = registro.borrow().iter().filter(|l| l.starts_with("error") || l.starts_with("warn")).cloned().collect();
    if !erros.is_empty() { return Err(format!("com mods, a máquina anotou erros: {erros:?}").into()); }
    println!("com mods (prelúdio da API 8): o pack pelo link, a oferta com o instalador e o sha512, baixar {} arquivo(s) ({} do pack), abrir, ler o índice, os overrides e os server-overrides por cima, o instalador do Fabric com os argumentos aceitos, pronto.",
        fita.baixados.len(), mods.len());
    Ok(())
}

fn cliente(srv: &Context, id: &str) -> Result<(), Erro> {
    let (_rc, cli) = motor()?;
    let fita: Rc<RefCell<Vec<String>>> = Rc::new(RefCell::new(Vec::new()));
    let registro: Rc<RefCell<Vec<String>>> = Rc::new(RefCell::new(Vec::new()));
    let grandes: Rc<RefCell<usize>> = Rc::new(RefCell::new(0));
    cli.with(|c| -> Result<(), String> {
        let eco = Rc::clone(&fita);
        let excesso = Rc::clone(&grandes);
        let postar = Function::new(c.clone(), move |t: String| -> bool {
            if t.len() > 12 * 1024 { *excesso.borrow_mut() += 1; return false; }
            eco.borrow_mut().push(t);
            true
        }).map_err(|e| e.to_string())?;
        let anotado = Rc::clone(&registro);
        let console = Function::new(c.clone(), move |nivel: String, t: String| { anotado.borrow_mut().push(format!("{nivel}: {t}")); })
            .map_err(|e| e.to_string())?;
        let seele = rquickjs::Object::new(c.clone()).map_err(|e| e.to_string())?;
        seele.set("postar", postar).map_err(|e| e.to_string())?;
        seele.set("console", console).map_err(|e| e.to_string())?;
        c.globals().set("seele", seele).map_err(|e| e.to_string())
    }).map_err(std::io::Error::other)?;

    // As capacidades da API 8, mais `tunel`, que vem do poder `porta`.
    let contrato: Value = serde_json::from_str(include_str!("../../../test/contrato/api-v8.json"))?;
    let mut capacidades = contrato["compatibilidade"]["capacidades-por-versao"]["8"].as_array().cloned().ok_or("sem capacidades da 8")?;
    capacidades.extend(contrato["compatibilidade"]["capacidades-por-poder"]["porta"].as_array().cloned().unwrap_or_default());
    avaliar(&cli, &format!("globalThis.__seeleCapacidades = {};", Value::Array(capacidades)), "capacidades")?;
    avaliar(&cli, &preludio()?, "prelúdio")?;
    let vazios = texto(&cli, r#"['document','window','fetch','localStorage','require','process','maquina'].filter(n => typeof globalThis[n] !== 'undefined').join(',')"#)?;
    if !vazios.is_empty() { return Err(format!("o contexto do MOD tem o que não deveria: {vazios}").into()); }
    if texto(&cli, "typeof SeeleUI.tunel?.entrar")? != "function" { return Err("o prelúdio não deu SeeleUI.tunel".into()); }
    avaliar(&cli, include_str!("../../../cliente/main.js"), "cliente/main.js")?;

    let retrato = json!({ "eu": 1, "servidor": { "nome": "QuickJS" },
        "pessoas": [{ "id": 1, "apelido": "Alexandre", "falando": false, "mudo": false }, { "id": 2, "apelido": "Fulano", "falando": false, "mudo": false }],
        "salas": [], "canais": [], "onde": "computador", "regioes": ["servidor.navegacao", "pagina"] });
    let eventos = [
        json!({ "tipo": "evento", "nome": "acao", "acao": "abrir-multiplayer", "pessoa": "", "canal": "" }),
        json!({ "tipo": "evento", "nome": "botao", "chave": format!("entrar:{id}"), "gesto": "bilhete-1" }),
        json!({ "tipo": "evento", "nome": "botao", "chave": format!("configurar:{id}"), "gesto": "bilhete-2" }),
        json!({ "tipo": "evento", "nome": "aba", "chave": "aba", "valor": "aba-maquina" }),
        json!({ "tipo": "evento", "nome": "aba", "chave": "aba", "valor": "aba-jogadores" }),
        json!({ "tipo": "evento", "nome": "aba", "chave": "aba", "valor": "aba-mods" }),
        json!({ "tipo": "evento", "nome": "aba", "chave": "aba", "valor": "aba-geral" }),
        json!({ "tipo": "evento", "nome": "numero", "chave": "cfg:maximo", "valor": 8 }),
        json!({ "tipo": "evento", "nome": "botao", "chave": "salvar", "gesto": "bilhete-3" }),
    ];
    let (mut tipos, mut erros_ditos, mut entradas) = (Vec::<String>::new(), Vec::<String>::new(), Vec::<Value>::new());
    let mut proximo = 0;
    for _ in 0..400 {
        let falas: Vec<String> = fita.borrow_mut().drain(..).collect();
        if falas.is_empty() {
            if proximo == eventos.len() { break; }
            responder(&cli, &eventos[proximo].to_string())?;
            proximo += 1;
            continue;
        }
        for t in falas {
            let m: Value = serde_json::from_str(&t)?;
            let tipo = m["tipo"].as_str().unwrap_or_default().to_owned();
            tipos.push(tipo.clone());
            if tipo == "superficie-criar" && m["descricao"]["tipo"] == "aviso" && m["descricao"]["tom"] == "erro" {
                erros_ditos.push(m["descricao"].to_string());
            }
            let valor = match tipo.as_str() {
                "retrato" => retrato.clone(),
                "pedido" => pedir(srv, &de(None), &m["valor"])?,
                "acao" => pedir(srv, &de(m["acao"].as_str()), &m["valor"])?,
                "superficie-criar" => json!({ "superficie": m["descricao"]["id"], "reaproveitada": false }),
                "contribuir" => json!({ "handle": "c1" }),
                "tunel-entrar" => { entradas.push(m.clone()); json!(25565) }
                "erro-no-evento" => { erros_ditos.push(m.to_string()); continue; }
                _ => Value::Null,
            };
            responder(&cli, &json!({ "tipo": "resposta", "n": m["n"], "ok": true, "valor": valor }).to_string())?;
        }
    }
    let conta = |n: &str| tipos.iter().filter(|t| t.as_str() == n).count();
    let erros: Vec<String> = registro.borrow().iter().filter(|l| l.starts_with("error") || l.starts_with("warn")).cloned().collect();
    if *grandes.borrow() > 0 { return Err(format!("{} mensagem(ns) passaram dos 12 KiB", grandes.borrow()).into()); }
    if !erros.is_empty() { return Err(format!("o MOD anotou erros: {erros:?}").into()); }
    if !erros_ditos.is_empty() { return Err(format!("o MOD disse erros a quem usa: {erros_ditos:?}").into()); }
    if entradas.len() != 1 || entradas[0]["gesto"] != "bilhete-1" || entradas[0]["nome"] != id {
        return Err(format!("o entrar não levou o bilhete do clique: {entradas:?}").into());
    }
    for preciso in ["retrato", "pedido", "acao", "contribuir", "superficie-criar", "superficie-classes", "superficie-montar"] {
        if conta(preciso) == 0 { return Err(format!("o MOD não chegou a «{preciso}»: {tipos:?}").into()); }
    }
    if proximo < eventos.len() { return Err("a conversa não assentou".into()); }
    if estado_do(srv, id)?["config"]["maximo"] != 8 { return Err("o salvar não chegou à metade de servidor".into()); }
    println!("cliente: prelúdio da API 8 sem DOM e sem Node, {} montagem(ns), {} pedido(s), {} ação(ões), o entrar com o bilhete do clique, nenhuma mensagem acima de 12 KiB.",
        conta("superficie-montar"), conta("pedido"), conta("acao"));
    Ok(())
}

fn responder(cli: &Context, t: &str) -> Result<(), Erro> {
    cli.with(|c| -> Result<(), String> {
        c.globals().set("__r", t.to_owned()).map_err(|e| e.to_string())?;
        c.eval::<(), _>("aoResponder(__r)").map_err(|e| format!("aoResponder: {e}: {:?}", c.catch()))?;
        while c.execute_pending_job() {}
        Ok(())
    }).map_err(|e| std::io::Error::other(e).into())
}

fn main() -> Result<(), Erro> {
    let (_rs, srv) = servidor()?;
    let id = maquina_e_servidor(&srv)?;
    let dados_sao_texto = texto(&srv, "String(Object.values(dados).every(v => typeof v === 'string'))")?;
    if dados_sao_texto != "true" { return Err("o quintal tem valor que não é texto".into()); }
    println!("servidor: criar, configurar, a oferta, o aceite, o plano e os estados da máquina, no quintal só texto.");
    cliente(&srv, &id)?;
    com_mods(&srv)?;
    println!("QuickJS 0.12.2 / 8 MiB: as três metades passaram.");
    Ok(())
}
