/* Gerado por ferramentas/build.mjs a partir de fonte/ e receitas/. API 8. Não edite aqui. */
(() => {
"use strict";
const RECEITAS = [{"formato":1,"id":"minecraft","nome":"Minecraft","edicao":"Java Edition","icone":"MC","versao":"1.0.0","descricao":"O servidor oficial da Mojang, com o Java que cada versão pede.","variantes":{"vanilla":{"nome":"Vanilla","descricao":"Minecraft puro, sem mods. Você escolhe só a versão."},"com-mods":{"nome":"Com mods","descricao":"Um modpack do Modrinth define a versão, o loader e os mods."}},"versoes":{"fonte":"mojang","manifesto":"https://piston-meta.mojang.com/mc/game/version_manifest_v2.json","tipos":["release"],"quantas":24},"artefatos":[{"id":"servidor","fonte":"mojang-servidor","destino":"server.jar"},{"id":"java","fonte":"adoptium","destino":"java","consulta":"https://api.adoptium.net/v3/assets/latest/{major}/hotspot?image_type=jre&vendor=eclipse","majorPadrao":8,"plataformas":[{"plataforma":"windows-x64","os":"windows","arquitetura":"x64","raiz":"{release}-jre"},{"plataforma":"mac-aarch64","os":"mac","arquitetura":"aarch64","raiz":"{release}-jre/Contents/Home","senaoHouver":"mac-x64"},{"plataforma":"mac-x64","os":"mac","arquitetura":"x64","raiz":"{release}-jre/Contents/Home"},{"plataforma":"linux-x64","os":"linux","arquitetura":"x64","raiz":"{release}-jre"},{"plataforma":"linux-aarch64","os":"linux","arquitetura":"aarch64","raiz":"{release}-jre"}]}],"origens":["piston-data.mojang.com","github.com","objects.githubusercontent.com","release-assets.githubusercontent.com"],"dominiosDoJogo":["sessionserver.mojang.com","api.minecraftservices.com","api.mojang.com"],"rodar":{"comando":"java/bin/java","argumentos":["-Xms1G","-Xmx2G","-jar","server.jar","nogui"]},"rede":{"protocolo":"tcp","portaPadrao":25565},"disco":{"mundoMaximo":8589934592},"termos":[{"id":"eula","titulo":"EULA do Minecraft (Mojang)","url":"https://aka.ms/MinecraftEULA","arquivo":"eula.txt","conteudo":"eula=true\n"}],"configuracao":{"arquivo":"server.properties","formato":"properties","campos":[{"chave":"nome","aba":"geral","forma":"segmentos","rotulo":"Nome que aparece na lista do jogo","ajuda":"Cada palavra tem a sua cor, entre as 16 do Minecraft.","padrao":[{"texto":"Servidor do SEELE","cor":"aqua"}],"tamanhoMaximo":59,"maximoSegmentos":6,"opcoes":[{"valor":"white","rotulo":"Branco","amostra":"#FFFFFF","codigo":"f"},{"valor":"gray","rotulo":"Cinza","amostra":"#AAAAAA","codigo":"7"},{"valor":"dark_gray","rotulo":"Cinza-escuro","amostra":"#555555","codigo":"8"},{"valor":"black","rotulo":"Preto","amostra":"#000000","codigo":"0"},{"valor":"yellow","rotulo":"Amarelo","amostra":"#FFFF55","codigo":"e"},{"valor":"gold","rotulo":"Dourado","amostra":"#FFAA00","codigo":"6"},{"valor":"red","rotulo":"Vermelho","amostra":"#FF5555","codigo":"c"},{"valor":"dark_red","rotulo":"Vermelho-escuro","amostra":"#AA0000","codigo":"4"},{"valor":"light_purple","rotulo":"Rosa","amostra":"#FF55FF","codigo":"d"},{"valor":"dark_purple","rotulo":"Roxo","amostra":"#AA00AA","codigo":"5"},{"valor":"blue","rotulo":"Azul","amostra":"#5555FF","codigo":"9"},{"valor":"dark_blue","rotulo":"Azul-escuro","amostra":"#0000AA","codigo":"1"},{"valor":"aqua","rotulo":"Ciano","amostra":"#55FFFF","codigo":"b"},{"valor":"dark_aqua","rotulo":"Ciano-escuro","amostra":"#00AAAA","codigo":"3"},{"valor":"green","rotulo":"Verde","amostra":"#55FF55","codigo":"a"},{"valor":"dark_green","rotulo":"Verde-escuro","amostra":"#00AA00","codigo":"2"}]},{"chave":"maximo","aba":"geral","grupo":"regras","forma":"numero","rotulo":"Máx. jogadores","padrao":10,"minimo":1,"maximo":100},{"chave":"dificuldade","aba":"geral","grupo":"regras","forma":"escolha","rotulo":"Dificuldade","padrao":"normal","opcoes":[{"valor":"peaceful","rotulo":"Pacífica"},{"valor":"easy","rotulo":"Fácil"},{"valor":"normal","rotulo":"Normal"},{"valor":"hard","rotulo":"Difícil"}]},{"chave":"modo","aba":"geral","grupo":"regras","forma":"escolha","rotulo":"Modo","padrao":"survival","opcoes":[{"valor":"survival","rotulo":"Sobrevivência"},{"valor":"creative","rotulo":"Criativo"},{"valor":"adventure","rotulo":"Aventura"},{"valor":"spectator","rotulo":"Espectador"}]},{"chave":"pvp","aba":"geral","forma":"interruptor","rotulo":"PvP","padrao":true},{"chave":"hardcore","aba":"jogadores","forma":"interruptor","rotulo":"Hardcore","ajuda":"Quem morre vira espectador até o mundo acabar.","padrao":false},{"chave":"protecao","aba":"jogadores","grupo":"convivio","forma":"numero","rotulo":"Proteção em volta do nascimento","ajuda":"Em blocos. Só quem é operador constrói ali.","padrao":16,"minimo":0,"maximo":64},{"chave":"inativo","aba":"jogadores","grupo":"convivio","forma":"numero","rotulo":"Tirar quem fica parado","ajuda":"Em minutos. Zero é nunca.","padrao":0,"minimo":0,"maximo":120}],"propriedades":{"motd":"{nome}","max-players":"{maximo}","difficulty":"{dificuldade}","gamemode":"{modo}","pvp":"{pvp}","hardcore":"{hardcore}","spawn-protection":"{protecao}","player-idle-timeout":"{inativo}","server-ip":"127.0.0.1","server-port":"{porta}","online-mode":"true","white-list":"false","enforce-whitelist":"false","enable-rcon":"false","enable-query":"false"}},"modpack":{"formato":"modrinth","teto":67108864,"api":"https://api.modrinth.com/v2","pagina":"https://modrinth.com/modpack/","cdn":"cdn.modrinth.com","dominios":["cdn.modrinth.com","github.com","raw.githubusercontent.com","gitlab.com"],"configuracoesDoPack":["default-server.properties"],"loaders":{"fabric-loader":{"nome":"Fabric","medido":true,"instalador":{"fonte":"fixo","destino":"fabric-installer.jar","url":"https://maven.fabricmc.net/net/fabricmc/fabric-installer/1.1.2/fabric-installer-1.1.2.jar","hash":{"algoritmo":"sha512","hex":"3cbe7b69498c44d814fc95e71cd9ce9c12c45a9e1dcf01085cb3e9aaf6fe63134b701065167be1fa6e4c2df19dfa5400bc5b6b1b7fb5e99e334d24dcdca55c20"},"tamanho":212123},"instalar":["-jar","fabric-installer.jar","server","-mcversion","{mc}","-loader","{loader}"],"rodar":["-Xms1G","-Xmx2G","-jar","fabric-server-launch.jar","nogui"],"dominiosDoJogo":["meta.fabricmc.net","maven.fabricmc.net"],"disco":134217728},"quilt-loader":{"nome":"Quilt","medido":false,"instalador":{"fonte":"fixo","destino":"quilt-installer.jar","url":"https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/0.15.1/quilt-installer-0.15.1.jar","hash":{"algoritmo":"sha512","hex":"f001e6e5ee5bed04e8f51a5519fae03874ecf8c7ece0db390896b5a6ea5fdb4a5b43abd77d0c6be5902d846d90cf032167d86af09253e3965be6480181fe07eb"},"tamanho":8734533},"instalar":["-jar","quilt-installer.jar","install","server","{mc}","{loader}","--install-dir=."],"rodar":["-Xms1G","-Xmx2G","-jar","quilt-server-launch.jar","nogui"],"dominiosDoJogo":["meta.quiltmc.org","maven.quiltmc.org","maven.fabricmc.net"],"disco":134217728},"forge":{"nome":"Forge","medido":true,"instalador":{"fonte":"reposilite","destino":"forge-installer.jar","url":"https://maven.minecraftforge.net/net/minecraftforge/forge/{mc}-{loader}/forge-{mc}-{loader}-installer.jar","detalhes":"https://maven.minecraftforge.net/api/maven/details/releases/net/minecraftforge/forge/{mc}-{loader}/forge-{mc}-{loader}-installer.jar","algoritmo":"sha256"},"instalar":["-jar","forge-installer.jar","--installServer"],"rodar":["-Xms1G","-Xmx2G","@libraries/net/minecraftforge/forge/{mc}-{loader}/unix_args.txt","nogui"],"porSistema":[{"plataformas":["windows-x64"],"comando":"java/bin/java.exe","rodar":["-Xms1G","-Xmx2G","@libraries/net/minecraftforge/forge/{mc}-{loader}/win_args.txt","nogui"]}],"dominiosDoJogo":["maven.minecraftforge.net","libraries.minecraft.net","piston-data.mojang.com","piston-meta.mojang.com","launchermeta.mojang.com"],"disco":536870912},"neoforge":{"nome":"NeoForge","medido":true,"instalador":{"fonte":"reposilite","destino":"neoforge-installer.jar","url":"https://maven.neoforged.net/releases/net/neoforged/neoforge/{loader}/neoforge-{loader}-installer.jar","detalhes":"https://maven.neoforged.net/api/maven/details/releases/net/neoforged/neoforge/{loader}/neoforge-{loader}-installer.jar","algoritmo":"sha256"},"instalar":["-jar","neoforge-installer.jar","--install-server"],"rodar":["-Xms1G","-Xmx2G","@libraries/net/neoforged/neoforge/{loader}/unix_args.txt","nogui"],"porSistema":[{"plataformas":["windows-x64"],"comando":"java/bin/java.exe","rodar":["-Xms1G","-Xmx2G","@libraries/net/neoforged/neoforge/{loader}/win_args.txt","nogui"]}],"dominiosDoJogo":["maven.neoforged.net","libraries.minecraft.net","piston-data.mojang.com","piston-meta.mojang.com","launchermeta.mojang.com"],"disco":536870912}}},"mundo":{"pasta":"world","salvar":[{"console":"save-off"},{"console":"save-all flush","esperar":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: Saved the game","prazo":60},{"copiar":"world"},{"console":"save-on"}]},"saida":{"pronto":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: Done \\(","entrou":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: ([A-Za-z0-9_]{1,16}) joined the game$","saiu":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: ([A-Za-z0-9_]{1,16}) left the game$","parar":{"console":"stop","esperar":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: Stopping the server","prazo":60}}}];
const ESQUEMA_DA_RECEITA = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://github.com/DATA-AND-DEV/SEELE-MOD-MULTIPLAYER/receitas/esquema.json","title":"Receita de jogo do MOD de multiplayer do SEELE","description":"Uma receita diz como um jogo é hospedado: o que baixar, o que rodar, a configuração e como ela vira o arquivo do jogo, os termos, como salvar o mundo com segurança e o que a saída do jogo quer dizer. É dado, e não código. Toda chave desconhecida é recusada pelo nome (additionalProperties: false em todo objeto).","type":"object","additionalProperties":false,"required":["formato","id","nome","icone","versao","descricao","variantes","versoes","artefatos","origens","dominiosDoJogo","rodar","rede","disco","termos","configuracao","mundo","saida"],"properties":{"formato":{"description":"A versão deste formato. Hoje, 1.","const":1},"id":{"description":"O nome da receita: vira o começo do nome de cada servidor de jogo (minecraft-1) e do túnel.","type":"string","pattern":"^[a-z0-9]+(-[a-z0-9]+)*$","maxLength":24},"nome":{"type":"string","minLength":1,"maxLength":40},"edicao":{"type":"string","minLength":1,"maxLength":40},"icone":{"description":"Um ou dois caracteres que a tela mostra no cartão do jogo.","type":"string","minLength":1,"maxLength":8},"versao":{"description":"A versão da receita: vai na oferta que a pessoa da máquina aceita.","type":"string","pattern":"^[0-9]+\\.[0-9]+\\.[0-9]+$"},"descricao":{"type":"string","minLength":1,"maxLength":200},"variantes":{"type":"object","additionalProperties":false,"required":["vanilla"],"properties":{"vanilla":{"$ref":"#/$defs/variante"},"com-mods":{"$ref":"#/$defs/variante"}}},"versoes":{"description":"De onde vem a lista de versões do jogo. mojang: o version_manifest_v2.json. fixo: a lista escrita aqui.","type":"object","additionalProperties":false,"required":["fonte"],"properties":{"fonte":{"enum":["mojang","fixo"]},"manifesto":{"$ref":"#/$defs/url"},"tipos":{"type":"array","minItems":1,"uniqueItems":true,"items":{"enum":["release","snapshot","old_beta","old_alpha"]}},"quantas":{"type":"integer","minimum":1,"maximum":40},"lista":{"type":"array","minItems":1,"maxItems":40,"items":{"$ref":"#/$defs/versaoFixa"}}}},"artefatos":{"description":"O que a máquina baixa. mojang-servidor: o downloads.server da versão (sha1). adoptium: o Java que a versão pede (javaVersion.majorVersion), um por plataforma (sha256). fixo: url, hash e tamanho por versão, escritos aqui.","type":"array","minItems":1,"maxItems":4,"items":{"$ref":"#/$defs/artefato"}},"origens":{"description":"Os domínios de onde a máquina pode baixar. Toda URL de artefato tem de cair num deles.","type":"array","minItems":1,"maxItems":16,"uniqueItems":true,"items":{"$ref":"#/$defs/host"}},"dominiosDoJogo":{"description":"Os domínios com que o jogo fala por conta própria, sem o SEELE conferir. O aceite os mostra.","type":"array","maxItems":16,"uniqueItems":true,"items":{"$ref":"#/$defs/host"}},"rodar":{"type":"object","additionalProperties":false,"required":["comando","argumentos"],"properties":{"comando":{"$ref":"#/$defs/caminho"},"argumentos":{"type":"array","maxItems":64,"items":{"type":"string","maxLength":256}}}},"rede":{"type":"object","additionalProperties":false,"required":["protocolo","portaPadrao"],"properties":{"protocolo":{"enum":["tcp","udp"]},"portaPadrao":{"type":"integer","minimum":1024,"maximum":65535}}},"disco":{"type":"object","additionalProperties":false,"required":["mundoMaximo"],"properties":{"mundoMaximo":{"description":"Quanto o mundo pode ocupar, em bytes, além do que se baixa.","type":"integer","minimum":1,"maximum":34359738368}}},"termos":{"type":"array","maxItems":4,"items":{"$ref":"#/$defs/termo"}},"configuracao":{"type":"object","additionalProperties":false,"required":["arquivo","formato","campos","propriedades"],"properties":{"arquivo":{"$ref":"#/$defs/caminho"},"formato":{"enum":["properties"]},"campos":{"type":"array","minItems":1,"maxItems":24,"items":{"$ref":"#/$defs/campo"}},"propriedades":{"description":"Cada propriedade do arquivo do jogo e o modelo do valor. {chave} é o valor de um campo; {porta} é a porta que o MOD escolheu.","type":"object","additionalProperties":{"type":"string","maxLength":256}}}},"modpack":{"description":"Com mods (API 8 parte 6): o formato do modpack (o .mrpack do Modrinth), o teto do envio, a API e a página do Modrinth, os domínios de onde um arquivo do pack pode vir e o instalador de cada loader. Opcional: sem ela, a variante com-mods não existe.","type":"object","additionalProperties":false,"required":["formato","teto","api","pagina","cdn","dominios","loaders"],"properties":{"formato":{"const":"modrinth"},"teto":{"type":"integer","minimum":1,"maximum":67108864},"api":{"$ref":"#/$defs/url"},"pagina":{"$ref":"#/$defs/url"},"cdn":{"$ref":"#/$defs/host"},"dominios":{"type":"array","minItems":1,"maxItems":8,"uniqueItems":true,"items":{"$ref":"#/$defs/host"}},"configuracoesDoPack":{"description":"Arquivos que um pack pode trazer e que um mod copia por cima do arquivo de configuração na primeira subida (o default-server.properties do mod Default Server Properties). A máquina escreve neles as chaves que a tela promete; o resto do pack fica. Opcional.","type":"array","maxItems":4,"uniqueItems":true,"items":{"type":"string","pattern":"^[A-Za-z0-9._-]{1,64}$"}},"loaders":{"type":"object","additionalProperties":false,"properties":{"fabric-loader":{"$ref":"#/$defs/loader"},"quilt-loader":{"$ref":"#/$defs/loader"},"forge":{"$ref":"#/$defs/loader"},"neoforge":{"$ref":"#/$defs/loader"}}}}},"mundo":{"type":"object","additionalProperties":false,"required":["pasta","salvar"],"properties":{"pasta":{"$ref":"#/$defs/caminho"},"salvar":{"description":"O salvamento seguro, passo a passo. Obrigatório: é o que torna a reserva possível.","type":"array","minItems":1,"maxItems":8,"items":{"$ref":"#/$defs/passo"}}}},"saida":{"description":"Expressões regulares sobre cada linha da saída do jogo. entrou e saiu têm um grupo de captura: o nome de quem joga.","type":"object","additionalProperties":false,"required":["pronto","entrou","saiu","parar"],"properties":{"pronto":{"type":"string","minLength":1,"maxLength":200},"entrou":{"type":"string","minLength":1,"maxLength":200},"saiu":{"type":"string","minLength":1,"maxLength":200},"parar":{"$ref":"#/$defs/passo"}}}},"$defs":{"loader":{"description":"Um loader de servidor: o instalador (baixado com o hash: fixo, ou lido de um Maven Reposilite), os argumentos do passo de instalar e os de rodar ({mc} e {loader} são as versões que o pack pede; o comando é o de rodar da receita), os sistemas em que ele roda (ausente: todos), os comandos de alguns sistemas (porSistema: o comando e os argumentos de rodar e, se diferem, de instalar, que viram uma entrada de por_sistema na oferta — o win_args.txt do Forge e do NeoForge no Windows), os domínios de onde ele baixa sozinho e o disco que ele ocupa.","type":"object","additionalProperties":false,"required":["nome","medido","instalador","instalar","rodar","dominiosDoJogo","disco"],"properties":{"nome":{"type":"string","minLength":1,"maxLength":24},"medido":{"type":"boolean"},"sistemas":{"type":"array","minItems":1,"uniqueItems":true,"items":{"enum":["windows-x64","mac-aarch64","mac-x64","linux-x64","linux-aarch64"]}},"instalador":{"type":"object","additionalProperties":false,"required":["fonte","destino","url"],"properties":{"fonte":{"enum":["fixo","reposilite"]},"destino":{"$ref":"#/$defs/caminho"},"url":{"type":"string","pattern":"^https://[^\\s]+$","maxLength":512},"hash":{"$ref":"#/$defs/hash"},"tamanho":{"type":"integer","minimum":1},"detalhes":{"type":"string","pattern":"^https://[^\\s]+$","maxLength":512},"algoritmo":{"enum":["sha1","sha256","sha512"]}}},"instalar":{"type":"array","maxItems":32,"items":{"type":"string","maxLength":256}},"rodar":{"type":"array","maxItems":32,"items":{"type":"string","maxLength":256}},"porSistema":{"type":"array","minItems":1,"maxItems":5,"items":{"type":"object","additionalProperties":false,"required":["plataformas","comando","rodar"],"properties":{"plataformas":{"type":"array","minItems":1,"uniqueItems":true,"items":{"enum":["windows-x64","mac-aarch64","mac-x64","linux-x64","linux-aarch64"]}},"comando":{"$ref":"#/$defs/caminho"},"instalar":{"type":"array","maxItems":32,"items":{"type":"string","maxLength":256}},"rodar":{"type":"array","maxItems":32,"items":{"type":"string","maxLength":256}}}}},"dominiosDoJogo":{"type":"array","maxItems":8,"uniqueItems":true,"items":{"$ref":"#/$defs/host"}},"disco":{"type":"integer","minimum":0}}},"variante":{"type":"object","additionalProperties":false,"required":["nome","descricao"],"properties":{"nome":{"type":"string","minLength":1,"maxLength":24},"descricao":{"type":"string","minLength":1,"maxLength":120},"disponivel":{"type":"boolean"},"porque":{"type":"string","minLength":1,"maxLength":120}}},"url":{"type":"string","pattern":"^https://[^\\s]+$","maxLength":512},"host":{"type":"string","pattern":"^(\\*\\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$","maxLength":253},"caminho":{"description":"Relativo à pasta do servidor de jogo, sem .. e sem começar por /.","type":"string","pattern":"^(?!/)(?!.*(^|/)\\.\\.(/|$))[A-Za-z0-9._/-]+$","maxLength":200},"hex":{"type":"string","pattern":"^[0-9a-f]+$"},"hash":{"type":"object","additionalProperties":false,"required":["algoritmo","hex"],"properties":{"algoritmo":{"enum":["sha1","sha256","sha512"]},"hex":{"$ref":"#/$defs/hex"}}},"baixavel":{"type":"object","additionalProperties":false,"required":["url","hash","tamanho"],"properties":{"url":{"$ref":"#/$defs/url"},"hash":{"$ref":"#/$defs/hash"},"tamanho":{"type":"integer","minimum":1}}},"versaoFixa":{"type":"object","additionalProperties":false,"required":["id"],"properties":{"id":{"type":"string","pattern":"^[A-Za-z0-9._+-]{1,64}$"}}},"plataforma":{"type":"object","additionalProperties":false,"required":["plataforma","os","arquitetura","raiz"],"properties":{"plataforma":{"enum":["windows-x64","windows-aarch64","mac-aarch64","mac-x64","linux-x64","linux-aarch64"]},"os":{"type":"string","pattern":"^[a-z-]+$"},"arquitetura":{"type":"string","pattern":"^[a-z0-9_]+$"},"raiz":{"description":"A pasta do pacote que vira o destino; {release} é o release_name da Adoptium.","type":"string","minLength":1,"maxLength":120},"senaoHouver":{"description":"A plataforma cujo Java serve quando a Adoptium não publica para esta.","enum":["windows-x64","windows-aarch64","mac-aarch64","mac-x64","linux-x64","linux-aarch64"]}}},"artefato":{"type":"object","additionalProperties":false,"required":["id","fonte","destino"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9-]{1,24}$"},"fonte":{"enum":["mojang-servidor","adoptium","fixo"]},"destino":{"$ref":"#/$defs/caminho"},"consulta":{"$ref":"#/$defs/url"},"majorPadrao":{"type":"integer","minimum":8,"maximum":99},"plataformas":{"type":"array","minItems":1,"maxItems":6,"items":{"$ref":"#/$defs/plataforma"}},"porVersao":{"type":"object","additionalProperties":{"$ref":"#/$defs/baixavel"}}}},"termo":{"type":"object","additionalProperties":false,"required":["id","titulo","url"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9-]{1,24}$"},"titulo":{"type":"string","minLength":1,"maxLength":120},"url":{"$ref":"#/$defs/url"},"arquivo":{"$ref":"#/$defs/caminho"},"conteudo":{"description":"O que se escreve no arquivo, e só depois do aceite.","type":"string","maxLength":256}}},"opcao":{"type":"object","additionalProperties":false,"required":["valor","rotulo"],"properties":{"valor":{"type":"string","minLength":1,"maxLength":64},"rotulo":{"type":"string","minLength":1,"maxLength":40},"amostra":{"description":"Uma cor #rrggbb que a tela mostra ao lado.","type":"string","pattern":"^#[0-9a-fA-F]{6}$"},"codigo":{"description":"O caractere depois do § no jogo (as 16 cores do Minecraft: 0-9 e a-f).","type":"string","pattern":"^[0-9a-f]$"}}},"segmento":{"type":"object","additionalProperties":false,"required":["texto","cor"],"properties":{"texto":{"type":"string","minLength":1,"maxLength":64},"cor":{"type":"string","minLength":1,"maxLength":64}}},"campo":{"type":"object","additionalProperties":false,"required":["chave","aba","forma","rotulo","padrao"],"properties":{"chave":{"type":"string","pattern":"^[a-z][a-zA-Z0-9]{0,23}$"},"aba":{"enum":["geral","jogadores"]},"grupo":{"description":"Campos com o mesmo grupo ficam lado a lado.","type":"string","pattern":"^[a-z0-9-]{1,24}$"},"forma":{"enum":["campo","numero","escolha","interruptor","segmentos"]},"rotulo":{"type":"string","minLength":1,"maxLength":80},"ajuda":{"type":"string","minLength":1,"maxLength":160},"padrao":{"description":"Uma lista de palavras ({texto, cor}) é o padrão de uma forma «segmentos».","type":["string","integer","boolean","array"],"items":{"$ref":"#/$defs/segmento"}},"obrigatorio":{"type":"boolean"},"tamanhoMaximo":{"description":"Em caracteres; numa lista de palavras, o nome todo com um espaço entre as palavras.","type":"integer","minimum":1,"maximum":256},"maximoSegmentos":{"description":"O teto de palavras de uma forma «segmentos».","type":"integer","minimum":1,"maximum":16},"minimo":{"type":"integer"},"maximo":{"type":"integer"},"opcoes":{"type":"array","minItems":1,"maxItems":24,"items":{"$ref":"#/$defs/opcao"}}}},"passo":{"description":"Um passo: mandar uma linha ao console (e, se quiser, esperar uma linha na saída, com prazo em segundos), ou copiar uma pasta do servidor de jogo.","type":"object","additionalProperties":false,"properties":{"console":{"type":"string","minLength":1,"maxLength":200,"pattern":"^[^\\n\\r]+$"},"esperar":{"type":"string","minLength":1,"maxLength":200},"prazo":{"type":"integer","minimum":1,"maximum":600},"copiar":{"$ref":"#/$defs/caminho"}}}}};
// ---- comum.js: o que as três metades usam igual ----
//
// `RECEITAS` e `ESQUEMA_DA_RECEITA` vêm do build (ferramentas/montar.cjs), no
// topo de cada metade.

const EU = 'seele/multiplayer';

/** Bytes de um texto em UTF-8, a conta que os tetos do SEELE fazem. */
function bytesDe(texto) {
  let n = 0;
  for (const c of String(texto)) {
    const p = c.codePointAt(0);
    n += p < 0x80 ? 1 : p < 0x800 ? 2 : p < 0x10000 ? 3 : 4;
  }
  return n;
}

/** Corta um texto em `teto` bytes UTF-8, sem partir um caractere. */
function cortar(texto, teto) {
  let saida = '', n = 0;
  for (const c of String(texto ?? '')) {
    const b = bytesDe(c);
    if (n + b > teto) break;
    saida += c;
    n += b;
  }
  return saida;
}

/** JSON.parse que devolve `null` em vez de lançar. */
function lerJson(texto) {
  if (typeof texto !== 'string') return null;
  try { return JSON.parse(texto); } catch { return null; }
}

/** A frase de um erro qualquer, sem lançar de novo. */
function fraseDoErro(erro) {
  try {
    if (erro && typeof erro === 'object') return String(erro.erro ?? erro.message ?? erro.error ?? JSON.stringify(erro));
    return String(erro);
  } catch {
    return 'erro sem descrição';
  }
}

/** O que um erro traz além da frase, para a tela mostrar com os dados. */
function dadosDoErro(erro) {
  if (!erro || typeof erro !== 'object') return {};
  const dados = {};
  for (const k of Object.keys(erro)) {
    if (k === 'message' || k === 'stack') continue;
    const v = erro[k];
    if (v === undefined || typeof v === 'function') continue;
    dados[k] = v;
  }
  return dados;
}

/** A receita pelo id, ou `null`. */
const receitaPorId = id => RECEITAS.find(r => r.id === id) ?? null;

/** O host de uma URL `https://`, ou `null`. */
function hostDaUrl(url) {
  const m = /^https:\/\/([^/?#:]+)/i.exec(String(url));
  return m ? m[1].toLowerCase() : null;
}

/** Se `host` cai numa das origens (com `*.` valendo para os subdomínios). */
function hostNasOrigens(host, origens) {
  return origens.some(o => o.startsWith('*.') ? host.endsWith(o.slice(1)) : host === o);
}

/** Os bytes UTF-8 de um texto. */
function utf8De(texto) {
  const bytes = [];
  for (const c of String(texto)) {
    const p = c.codePointAt(0);
    if (p < 0x80) bytes.push(p);
    else if (p < 0x800) bytes.push(0xc0 | (p >> 6), 0x80 | (p & 63));
    else if (p < 0x10000) bytes.push(0xe0 | (p >> 12), 0x80 | ((p >> 6) & 63), 0x80 | (p & 63));
    else bytes.push(0xf0 | (p >> 18), 0x80 | ((p >> 12) & 63), 0x80 | ((p >> 6) & 63), 0x80 | (p & 63));
  }
  return bytes;
}

/**
 * O SHA-1 (hexadecimal) dos bytes UTF-8 de um texto, em JS puro: o QuickJS do
 * SEELE não traz `crypto`. Serve para conferir o que a Mojang publica com
 * sha1; não é escolha de segurança nossa.
 */
function sha1Hex(texto) {
  const bytes = utf8De(texto);
  const bits = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  // O tamanho em bits, 64 bits big-endian (o alto cabe em 32 bits para o que cabe na memória).
  const alto = Math.floor(bits / 0x100000000), baixo = bits >>> 0;
  for (const w of [alto, baixo]) bytes.push((w >>> 24) & 255, (w >>> 16) & 255, (w >>> 8) & 255, w & 255);
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const w = new Array(80);
  const rot = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
  for (let i = 0; i < bytes.length; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = ((bytes[i + 4 * t] << 24) | (bytes[i + 4 * t + 1] << 16) | (bytes[i + 4 * t + 2] << 8) | bytes[i + 4 * t + 3]) >>> 0;
    for (let t = 16; t < 80; t++) w[t] = rot(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let t = 0; t < 80; t++) {
      let f, k;
      if (t < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (t < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const tmp = (rot(a, 5) + (f >>> 0) + e + k + w[t]) >>> 0;
      e = d; d = c; c = rot(b, 30); b = a; a = tmp;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  return [h0, h1, h2, h3, h4].map(x => x.toString(16).padStart(8, '0')).join('');
}

// ---- esquema.js: o validador de receitas ----
//
// Duas passadas. A primeira lê `receitas/esquema.json` — um pedaço do JSON
// Schema 2020-12, o que o esquema usa e nada mais — e confere a forma. A
// segunda confere o que um esquema não diz: o modelo de uma propriedade que
// cita um campo que não existe, o padrão fora das opções, a expressão que não
// compila, o salvamento que não copia o mundo. A segunda só roda se a primeira
// passou: ela lê a receita supondo a forma certa.
//
// **Toda chave desconhecida é recusada pelo nome**, com o caminho até ela. Uma
// receita chega por pull request; a recusa é a única resposta que o autor tem.

/** O que este validador sabe ler de um esquema. Uma palavra fora daqui é defeito do esquema, e lança. */
const PALAVRAS_DO_ESQUEMA = new Set([
  '$schema', '$id', '$defs', '$ref', 'title', 'description', 'type', 'properties', 'required',
  'additionalProperties', 'items', 'enum', 'const', 'pattern', 'minLength', 'maxLength',
  'minimum', 'maximum', 'minItems', 'maxItems', 'uniqueItems',
]);

const TAMANHO_DO_HASH = { sha1: 40, sha256: 64, sha512: 128 };

function tipoDe(valor) {
  if (valor === null) return 'null';
  if (Array.isArray(valor)) return 'array';
  if (Number.isInteger(valor)) return 'integer';
  return typeof valor;
}

function serveAoTipo(valor, tipo) {
  const t = tipoDe(valor);
  return t === tipo || (tipo === 'number' && t === 'integer');
}

function mostrar(valor) {
  return typeof valor === 'string' ? '«' + valor + '»' : JSON.stringify(valor);
}

/** A primeira passada: o valor contra um pedaço do esquema. */
function conferirForma(valor, esquema, raiz, caminho, erros) {
  for (const palavra of Object.keys(esquema)) {
    if (!PALAVRAS_DO_ESQUEMA.has(palavra)) throw new Error('o esquema usa «' + palavra + '», que o validador não lê');
  }
  if (esquema.$ref) {
    const nome = esquema.$ref.replace(/^#\/\$defs\//, '');
    const alvo = raiz.$defs?.[nome];
    if (!alvo) throw new Error('o esquema cita ' + esquema.$ref + ', que não existe');
    return conferirForma(valor, alvo, raiz, caminho, erros);
  }
  if ('const' in esquema && valor !== esquema.const) {
    erros.push(`${caminho}: devia ser ${mostrar(esquema.const)}`);
    return;
  }
  if (esquema.enum && !esquema.enum.includes(valor)) {
    erros.push(`${caminho}: ${mostrar(valor)} não é um dos valores aceitos (${esquema.enum.join(', ')})`);
    return;
  }
  if (esquema.type) {
    const tipos = Array.isArray(esquema.type) ? esquema.type : [esquema.type];
    if (!tipos.some(t => serveAoTipo(valor, t))) {
      erros.push(`${caminho}: devia ser ${tipos.join(' ou ')}`);
      return;
    }
  }
  const t = tipoDe(valor);
  if (t === 'string') {
    if (esquema.minLength !== undefined && valor.length < esquema.minLength) erros.push(`${caminho}: ${mostrar(valor)} é curto demais`);
    if (esquema.maxLength !== undefined && valor.length > esquema.maxLength) erros.push(`${caminho}: passa de ${esquema.maxLength} caracteres`);
    if (esquema.pattern && !new RegExp(esquema.pattern).test(valor)) erros.push(`${caminho}: ${mostrar(valor)} não tem a forma pedida`);
  }
  if (t === 'integer' || t === 'number') {
    if (esquema.minimum !== undefined && valor < esquema.minimum) erros.push(`${caminho}: ${valor} é menor que ${esquema.minimum}`);
    if (esquema.maximum !== undefined && valor > esquema.maximum) erros.push(`${caminho}: ${valor} é maior que ${esquema.maximum}`);
  }
  if (t === 'array') {
    if (esquema.minItems !== undefined && valor.length < esquema.minItems) erros.push(`${caminho}: precisa de ao menos ${esquema.minItems}`);
    if (esquema.maxItems !== undefined && valor.length > esquema.maxItems) erros.push(`${caminho}: passa de ${esquema.maxItems} itens`);
    if (esquema.uniqueItems) {
      const vistos = new Set();
      valor.forEach((item, i) => {
        const chave = JSON.stringify(item);
        if (vistos.has(chave)) erros.push(`${caminho}[${i}]: ${mostrar(item)} repetido`);
        vistos.add(chave);
      });
    }
    if (esquema.items) valor.forEach((item, i) => conferirForma(item, esquema.items, raiz, `${caminho}[${i}]`, erros));
  }
  if (t === 'object') {
    const props = esquema.properties ?? {};
    for (const chave of Object.keys(valor)) {
      if (chave in props) continue;
      if (esquema.additionalProperties === false) erros.push(`${caminho}: chave desconhecida «${chave}»`);
    }
    for (const chave of esquema.required ?? []) {
      if (!(chave in valor)) erros.push(`${caminho}: falta a chave «${chave}»`);
    }
    for (const [chave, sub] of Object.entries(props)) {
      if (chave in valor) conferirForma(valor[chave], sub, raiz, `${caminho}.${chave}`, erros);
    }
    if (esquema.additionalProperties && typeof esquema.additionalProperties === 'object') {
      for (const chave of Object.keys(valor)) {
        if (!(chave in props)) conferirForma(valor[chave], esquema.additionalProperties, raiz, `${caminho}.${chave}`, erros);
      }
    }
  }
}

/** Quantos grupos de captura uma expressão tem, ou `null` se ela não compila. */
function gruposDe(fonte) {
  try {
    return new RegExp(fonte + '|').exec('').length - 1;
  } catch {
    return null;
  }
}

/** As variáveis `{x}` de um modelo. */
const variaveisDe = modelo => [...String(modelo).matchAll(/\{([A-Za-z0-9]+)\}/g)].map(m => m[1]);

/** A segunda passada: o que o esquema não diz. */
function conferirSentido(r, erros) {
  const c = 'receita';

  // ---- versões ----
  if (r.versoes.fonte === 'mojang' && !(r.versoes.manifesto && r.versoes.tipos && r.versoes.quantas)) {
    erros.push(`${c}.versoes: a fonte mojang precisa de «manifesto», «tipos» e «quantas»`);
  }
  if (r.versoes.fonte === 'fixo' && !r.versoes.lista) erros.push(`${c}.versoes: a fonte fixo precisa de «lista»`);

  // ---- artefatos ----
  r.artefatos.forEach((a, i) => {
    const ca = `${c}.artefatos[${i}]`;
    if (a.fonte === 'adoptium') {
      if (!(a.consulta && a.majorPadrao && a.plataformas)) {
        erros.push(`${ca}: a fonte adoptium precisa de «consulta», «majorPadrao» e «plataformas»`);
        return;
      }
      if (!a.consulta.includes('{major}')) erros.push(`${ca}.consulta: falta {major}`);
      const nomes = a.plataformas.map(p => p.plataforma);
      a.plataformas.forEach((p, j) => {
        if (p.senaoHouver && !nomes.includes(p.senaoHouver)) {
          erros.push(`${ca}.plataformas[${j}].senaoHouver: «${p.senaoHouver}» não é uma das plataformas da receita`);
        }
      });
    }
    if (a.fonte === 'fixo') {
      if (!a.porVersao) {
        erros.push(`${ca}: a fonte fixo precisa de «porVersao»`);
        return;
      }
      for (const [versao, b] of Object.entries(a.porVersao)) {
        const cb = `${ca}.porVersao.${versao}`;
        const host = hostDaUrl(b.url);
        if (!host || !hostNasOrigens(host, r.origens)) erros.push(`${cb}.url: ${host} não está nas origens`);
        const esperado = TAMANHO_DO_HASH[b.hash.algoritmo];
        if (b.hash.hex.length !== esperado) erros.push(`${cb}.hash: ${b.hash.algoritmo} tem ${esperado} caracteres, este tem ${b.hash.hex.length}`);
      }
      if (r.versoes.fonte === 'fixo' && r.versoes.lista) {
        for (const v of r.versoes.lista) {
          if (!a.porVersao[v.id]) erros.push(`${ca}: a versão «${v.id}» não tem artefato fixo`);
        }
      }
    }
  });
  // ---- com mods (parte 6) ----
  const comMods = r.variantes['com-mods'];
  if (comMods && comMods.disponivel !== false && !r.modpack) erros.push(`${c}.variantes.com-mods: sem «modpack», a variante com mods não tem como rodar`);
  for (const [id, l] of Object.entries(r.modpack?.loaders ?? {})) {
    const cl = `${c}.modpack.loaders.${id}`;
    const inst = l.instalador;
    if (inst.fonte === 'fixo') {
      if (!(inst.hash && inst.tamanho)) erros.push(`${cl}.instalador: a fonte fixo precisa de «hash» e «tamanho»`);
      else if (inst.hash.hex.length !== TAMANHO_DO_HASH[inst.hash.algoritmo]) erros.push(`${cl}.instalador.hash: ${inst.hash.algoritmo} tem ${TAMANHO_DO_HASH[inst.hash.algoritmo]} caracteres`);
    } else if (!(inst.detalhes && inst.algoritmo)) {
      erros.push(`${cl}.instalador: a fonte reposilite precisa de «detalhes» e «algoritmo»`);
    }
    const host = hostDaUrl(inst.url);
    if (!host || !hostNasOrigens(host, [...r.origens, ...l.dominiosDoJogo])) erros.push(`${cl}.instalador.url: ${host} não está nas origens nem nos domínios do loader`);
    if (!l.instalar.some(a => a.includes(inst.destino))) erros.push(`${cl}.instalar: os argumentos não citam o instalador «${inst.destino}»`);
    const dosSistemas = (l.porSistema ?? []).flatMap(e => [...e.rodar, ...(e.instalar ?? [])]);
    for (const v of [...l.instalar, ...l.rodar, ...dosSistemas, inst.url, inst.detalhes ?? ''].flatMap(variaveisDe)) {
      if (v !== 'mc' && v !== 'loader') erros.push(`${cl}: {${v}} não é {mc} nem {loader}`);
    }
    // **Um sistema numa entrada só** (a regra da oferta, `por_sistema`): a
    // máquina dele teria dois pares, e o produto recusa a oferta inteira.
    const vistos = new Set();
    (l.porSistema ?? []).forEach((e, k) => {
      for (const p of e.plataformas) {
        if (vistos.has(p)) erros.push(`${cl}.porSistema[${k}].plataformas: «${p}» já tem comandos noutra entrada`);
        vistos.add(p);
        if (l.sistemas && !l.sistemas.includes(p)) erros.push(`${cl}.porSistema[${k}].plataformas: «${p}» não está em «sistemas»`);
      }
      if (e.instalar && !e.instalar.some(a => a.includes(inst.destino))) erros.push(`${cl}.porSistema[${k}].instalar: os argumentos não citam o instalador «${inst.destino}»`);
    });
  }

  const ids = new Set();
  r.artefatos.forEach((a, i) => {
    if (ids.has(a.id)) erros.push(`${c}.artefatos[${i}].id: «${a.id}» repetido`);
    ids.add(a.id);
  });

  // ---- configuração ----
  const chaves = new Set();
  r.configuracao.campos.forEach((campo, i) => {
    const cc = `${c}.configuracao.campos[${i}]`;
    if (chaves.has(campo.chave)) erros.push(`${cc}.chave: «${campo.chave}» repetida`);
    chaves.add(campo.chave);
    if (campo.chave === 'porta') erros.push(`${cc}.chave: «porta» é da receita, e não de um campo`);
    const p = campo.padrao;
    if (campo.maximoSegmentos !== undefined && campo.forma !== 'segmentos') erros.push(`${cc}: só uma lista de palavras tem «maximoSegmentos»`);
    if (campo.forma !== 'segmentos') {
      (campo.opcoes ?? []).forEach((o, k) => {
        if (o.codigo !== undefined) erros.push(`${cc}.opcoes[${k}]: só a lista de palavras usa «codigo»`);
      });
    }
    if (campo.forma === 'segmentos') {
      if (!campo.opcoes) {
        erros.push(`${cc}: uma lista de palavras precisa de «opcoes»`);
        return;
      }
      if (campo.maximoSegmentos === undefined) {
        erros.push(`${cc}: uma lista de palavras precisa de «maximoSegmentos»`);
        return;
      }
      const codigos = new Set();
      campo.opcoes.forEach((o, k) => {
        if (o.codigo === undefined) erros.push(`${cc}.opcoes[${k}]: falta o «codigo» do § desta cor`);
        else if (codigos.has(o.codigo)) erros.push(`${cc}.opcoes[${k}]: o código «${o.codigo}» repete o de outra cor`);
        else codigos.add(o.codigo);
      });
      if (campo.opcoes.some(o => o.codigo === undefined)) return;
      const c = conferirSegmentos(campo, p);
      if (c.erro) erros.push(`${cc}.padrao: ${c.erro.charAt(0).toLowerCase()}${c.erro.slice(1).replace(/\.$/, '')}`);
    } else if (campo.forma === 'escolha') {
      if (!campo.opcoes) {
        erros.push(`${cc}: uma escolha precisa de «opcoes»`);
        return;
      }
      if (!campo.opcoes.some(o => o.valor === p)) erros.push(`${cc}.padrao: ${mostrar(p)} não é uma das opções`);
    } else if (campo.forma === 'numero') {
      if (campo.minimo === undefined || campo.maximo === undefined) {
        erros.push(`${cc}: um número precisa de «minimo» e «maximo»`);
        return;
      }
      if (!Number.isInteger(p)) erros.push(`${cc}.padrao: um número tem padrão inteiro`);
      else if (p < campo.minimo || p > campo.maximo) erros.push(`${cc}.padrao: ${p} fora de ${campo.minimo} a ${campo.maximo}`);
    } else if (campo.forma === 'interruptor') {
      if (typeof p !== 'boolean') erros.push(`${cc}.padrao: um interruptor tem padrão true ou false`);
    } else if (campo.forma === 'campo') {
      if (typeof p !== 'string') erros.push(`${cc}.padrao: um campo tem padrão em texto`);
      else if (campo.tamanhoMaximo && p.length > campo.tamanhoMaximo) erros.push(`${cc}.padrao: passa de ${campo.tamanhoMaximo} caracteres`);
    }
    if (campo.opcoes && campo.forma !== 'escolha' && campo.forma !== 'segmentos') erros.push(`${cc}: só uma escolha tem «opcoes»`);
  });
  for (const [prop, modelo] of Object.entries(r.configuracao.propriedades)) {
    for (const v of variaveisDe(modelo)) {
      if (v !== 'porta' && !chaves.has(v)) erros.push(`${c}.configuracao.propriedades.${prop}: «{${v}}» não é campo da receita nem {porta}`);
    }
  }

  // ---- mundo e saída ----
  const conferirPasso = (passo, cp) => {
    if (passo.console && passo.copiar) erros.push(`${cp}: um passo é «console» ou «copiar», não os dois`);
    else if (!passo.console && !passo.copiar) erros.push(`${cp}: um passo é «console» ou «copiar»`);
    if ((passo.esperar || passo.prazo) && !passo.console) erros.push(`${cp}: só um passo de console espera`);
    if (passo.esperar && gruposDe(passo.esperar) === null) erros.push(`${cp}.esperar: não é uma expressão regular válida`);
  };
  r.mundo.salvar.forEach((passo, i) => conferirPasso(passo, `${c}.mundo.salvar[${i}]`));
  if (!r.mundo.salvar.some(p => p.copiar)) erros.push(`${c}.mundo.salvar: nenhum passo copia o mundo`);
  conferirPasso(r.saida.parar, `${c}.saida.parar`);
  if (r.saida.parar.copiar) erros.push(`${c}.saida.parar: parar é um passo de console`);
  for (const nome of ['pronto', 'entrou', 'saiu']) {
    const grupos = gruposDe(r.saida[nome]);
    if (grupos === null) erros.push(`${c}.saida.${nome}: não é uma expressão regular válida`);
    else if (nome !== 'pronto' && grupos !== 1) erros.push(`${c}.saida.${nome}: precisa de exatamente um grupo de captura (o nome de quem joga)`);
  }

  // ---- termos ----
  r.termos.forEach((t, i) => {
    if (Boolean(t.arquivo) !== Boolean(t.conteudo)) erros.push(`${c}.termos[${i}]: «arquivo» e «conteudo» vão juntos`);
  });
}

/**
 * Confere uma receita. Nunca lança por causa dela: devolve `{ ok, erros }`,
 * cada erro uma frase com o caminho.
 */
function validarReceita(receita, esquema = ESQUEMA_DA_RECEITA) {
  const erros = [];
  conferirForma(receita, esquema, esquema, 'receita', erros);
  if (erros.length === 0) {
    try {
      conferirSentido(receita, erros);
    } catch (erro) {
      erros.push('receita: o validador não conseguiu ler a receita: ' + fraseDoErro(erro));
    }
  }
  return { ok: erros.length === 0, erros };
}

// ---- receita.js: o que uma receita quer dizer ----
//
// Funções puras sobre uma receita: listar as versões, resolver o que baixar
// numa versão, montar a oferta que a pessoa da máquina aceita, conferir a
// configuração, escrever o arquivo do jogo e ler a saída dele.
//
// **Onde o código ainda é preciso.** Uma receita é dado, mas de onde vem a
// lista de versões e o que baixar é uma fonte com nome: `mojang`, `adoptium`
// ou `fixo`. Um jogo cujos arquivos têm URL, hash e tamanho fixos entra só com
// dado (`fixo`); uma origem nova que precise ser lida (uma API como a da
// Mojang) entra com código, revisado, aqui.
//
// `buscar(url)` devolve o texto ou `null`: no servidor é `mundo.buscar`, e nos
// testes, as fixtures.

/**
 * Busca e lê um JSON, ou diz por que não deu. Com `sha1`, o texto que veio
 * tem de ter esse hash (o que a Mojang publica no manifesto): se não tem, é
 * recusado com a URL, o esperado e o obtido, antes de ser lido.
 */
function buscarJson(buscar, url, sha1) {
  let texto;
  try {
    texto = buscar(url);
  } catch (erro) {
    return { ok: false, erro: 'origem-nao-respondeu', url, porque: fraseDoErro(erro) };
  }
  if (texto === null || texto === undefined) return { ok: false, erro: 'origem-nao-respondeu', url };
  if (sha1 !== undefined) {
    const obtido = sha1Hex(texto);
    if (obtido !== sha1) return { ok: false, erro: 'sha1-diferente', url, esperado: sha1, obtido };
  }
  const json = lerJson(texto);
  if (json === null) return { ok: false, erro: 'origem-ilegivel', url };
  return { ok: true, json };
}

/** O manifesto inteiro da Mojang, filtrado pelos tipos da receita. */
function versoesDoManifesto(receita, buscar) {
  const lido = buscarJson(buscar, receita.versoes.manifesto);
  if (!lido.ok) return lido;
  const lista = Array.isArray(lido.json.versions) ? lido.json.versions : null;
  if (!lista) return { ok: false, erro: 'origem-ilegivel', url: receita.versoes.manifesto };
  const versoes = lista
    .filter(v => v && typeof v.id === 'string' && typeof v.url === 'string' && receita.versoes.tipos.includes(v.type))
    .map(v => ({ id: v.id, url: v.url, sha1: v.sha1 }));
  return { ok: true, versoes };
}

/** As versões que a tela oferece, as mais novas primeiro. */
function listarVersoes(receita, buscar) {
  if (receita.versoes.fonte === 'fixo') return { ok: true, versoes: receita.versoes.lista.map(v => ({ id: v.id })) };
  const todas = versoesDoManifesto(receita, buscar);
  if (!todas.ok) return todas;
  return { ok: true, versoes: todas.versoes.slice(0, receita.versoes.quantas) };
}

/** Um artefato só entra se a URL dele cai numa origem da receita. */
function conferirOrigem(receita, url) {
  const host = hostDaUrl(url);
  if (!host || !hostNasOrigens(host, receita.origens)) return { ok: false, erro: 'url-fora-das-origens', url, host };
  return null;
}

/** Os artefatos de uma fonte `adoptium`: o Java do major pedido, um por plataforma. */
function resolverAdoptium(receita, artefato, major, buscar) {
  const url = artefato.consulta.replace('{major}', String(major));
  const lido = buscarJson(buscar, url);
  if (!lido.ok) return lido;
  if (!Array.isArray(lido.json)) return { ok: false, erro: 'origem-ilegivel', url };
  const achados = {};
  for (const p of artefato.plataformas) {
    const item = lido.json.find(a => a?.binary?.os === p.os && a.binary.architecture === p.arquitetura && a.binary.image_type === 'jre');
    const pacote = item?.binary?.package;
    if (!pacote || typeof pacote.link !== 'string' || !/^[0-9a-f]{64}$/.test(String(pacote.checksum)) || !Number.isInteger(pacote.size)) continue;
    achados[p.plataforma] = {
      id: artefato.id,
      nome: String(pacote.name ?? artefato.destino),
      url: pacote.link,
      tamanho: pacote.size,
      hash: { algoritmo: 'sha256', hex: pacote.checksum },
      destino: artefato.destino,
      desempacotar: { raiz: p.raiz.replace('{release}', String(item.release_name ?? '')) },
    };
  }
  const porPlataforma = {}, substituidas = {}, semJava = [];
  const artefatos = [];
  const usar = a => {
    const igual = artefatos.find(x => x.url === a.url);
    if (igual) return igual.nome;
    artefatos.push(a);
    return a.nome;
  };
  for (const p of artefato.plataformas) {
    if (achados[p.plataforma]) porPlataforma[p.plataforma] = usar(achados[p.plataforma]);
  }
  for (const p of artefato.plataformas) {
    if (achados[p.plataforma]) continue;
    if (p.senaoHouver && achados[p.senaoHouver]) {
      porPlataforma[p.plataforma] = usar(achados[p.senaoHouver]);
      substituidas[p.plataforma] = p.senaoHouver;
    } else {
      semJava.push(p.plataforma);
    }
  }
  for (const a of artefatos) {
    const fora = conferirOrigem(receita, a.url);
    if (fora) return fora;
  }
  return { ok: true, artefatos, porPlataforma, substituidas, semJava, url };
}

/**
 * O que a máquina baixa para rodar `versao`: cada artefato com url, hash,
 * tamanho e destino, e qual Java serve a cada plataforma.
 */
function resolverVersao(receita, versao, buscar) {
  const artefatos = [];
  let porPlataforma = {}, substituidas = {}, semJava = [], javaMajor = null;
  let versaoJson = null, urlDaVersao = null;

  if (receita.versoes.fonte === 'mojang') {
    const todas = versoesDoManifesto(receita, buscar);
    if (!todas.ok) return todas;
    const entrada = todas.versoes.find(v => v.id === versao);
    if (!entrada) return { ok: false, erro: 'versao-desconhecida', versao };
    urlDaVersao = entrada.url;
    // Sem o sha1 do manifesto a conferência passaria em branco: recusa-se, dizendo.
    if (!/^[0-9a-f]{40}$/.test(String(entrada.sha1))) return { ok: false, erro: 'manifesto-sem-sha1', versao, url: entrada.url };
    const lido = buscarJson(buscar, entrada.url, entrada.sha1);
    if (!lido.ok) return lido;
    versaoJson = lido.json;
  } else if (!receita.versoes.lista.some(v => v.id === versao)) {
    return { ok: false, erro: 'versao-desconhecida', versao };
  }

  for (const artefato of receita.artefatos) {
    if (artefato.fonte === 'mojang-servidor') {
      const s = versaoJson?.downloads?.server;
      if (!s || typeof s.url !== 'string' || !/^[0-9a-f]{40}$/.test(String(s.sha1)) || !Number.isInteger(s.size)) {
        return { ok: false, erro: 'versao-sem-servidor', versao, url: urlDaVersao };
      }
      const fora = conferirOrigem(receita, s.url);
      if (fora) return fora;
      artefatos.push({ id: artefato.id, nome: artefato.destino.split('/').pop(), url: s.url, tamanho: s.size, hash: { algoritmo: 'sha1', hex: s.sha1 }, destino: artefato.destino });
    } else if (artefato.fonte === 'adoptium') {
      const pedido = versaoJson?.javaVersion?.majorVersion;
      javaMajor = Number.isInteger(pedido) ? pedido : artefato.majorPadrao;
      const java = resolverAdoptium(receita, artefato, javaMajor, buscar);
      if (!java.ok) return java;
      artefatos.push(...java.artefatos);
      ({ porPlataforma, substituidas, semJava } = java);
    } else if (artefato.fonte === 'fixo') {
      const b = artefato.porVersao[versao];
      if (!b) return { ok: false, erro: 'versao-sem-artefato', versao, artefato: artefato.id };
      artefatos.push({ id: artefato.id, nome: artefato.destino.split('/').pop(), url: b.url, tamanho: b.tamanho, hash: b.hash, destino: artefato.destino });
    }
  }
  return { ok: true, versao, artefatos, porPlataforma, substituidas, semJava, javaMajor };
}

/** O teto de uma oferta: 64 GiB (`MAX_DISCO`, seele-proto/src/maquina.rs). */
const DISCO_MAXIMO_DA_OFERTA = 64 * 1024 * 1024 * 1024;

// ---------------------------------------------------------------- a cópia do mundo (parte 7)

/** Quanto a porta da cópia fica acima da do jogo: longe das portas que dois servidores de jogo na mesma máquina tomam. */
const DESVIO_DA_PORTA_DA_COPIA = 10000;

/** A porta em que a dona oferece a cópia do mundo, na máquina dela. */
function portaDaCopia(porta) {
  return porta + DESVIO_DA_PORTA_DA_COPIA;
}

/** O túnel da cópia: o nome do servidor de jogo com `-copia`, ou `-c` quando não cabe nos 32 de um túnel. */
function tunelDaCopia(servidor) {
  return servidor.length + 6 <= 32 ? `${servidor}-copia` : `${servidor}-c`;
}

/**
 * A oferta que a pessoa da máquina vê e aceita, com os nomes de campo de
 * `OfertaDeMaquina` (seele-proto/src/maquina.rs).
 *
 * **Só entra o que muda o que roda**: a receita e a versão dela, a versão do
 * jogo, a porta, os artefatos, as origens, o comando. A configuração do jogo
 * não entra — ela vira texto no `server.properties`, e mudar o nome do
 * servidor não pode pedir aceite novo.
 */
function montarOferta(receita, { servidor, versao, porta, comCopia = false }, resolvido) {
  // **Cada Java leva os sistemas em que serve** (`plataformas`, API 8 parte 4):
  // a metade de servidor não sabe o sistema da máquina antes do aceite e manda
  // o de cada um; com a marca, a tela da máquina soma só o dela e o produto
  // recusa baixar os outros. O Java de Mac Intel que serve no Mac ARM
  // (`senaoHouver`) leva os dois. Sem marca, serve em todos (o server.jar).
  const sistemasDe = nome => Object.entries(resolvido.porPlataforma ?? {}).filter(([, n]) => n === nome).map(([p]) => p);
  const artefatos = resolvido.artefatos.map(a => {
    const plataformas = sistemasDe(a.nome);
    return {
      nome: a.nome, url: a.url, tamanho: a.tamanho, hash: { algoritmo: a.hash.algoritmo, hex: a.hash.hex },
      ...(plataformas.length ? { plataformas } : {}),
    };
  });
  // O disco: o que se baixa, o Java desempacotado (cerca de três vezes o
  // pacote), o mundo que a receita admite e, para a reserva (parte 7), mais
  // duas vezes ele: o pacote da cópia e o parcial que chega.
  const baixado = resolvido.artefatos.reduce((soma, a) => soma + a.tamanho, 0);
  const maiorPacote = resolvido.artefatos.reduce((maior, a) => (a.desempacotar ? Math.max(maior, a.tamanho) : maior), 0);
  const disco = Math.min(DISCO_MAXIMO_DA_OFERTA, baixado + 3 * maiorPacote + 3 * receita.disco.mundoMaximo);
  return {
    titulo: cortar(`${receita.nome} ${versao} · ${servidor}`, 64),
    receita: receita.id,
    versao_da_receita: receita.versao,
    versao_do_jogo: versao,
    // O jogo, e a cópia do mundo para a reserva (parte 7): a cópia anda pelo
    // túnel, e só a dona o serve. **Só com reserva** (e2e da API 8, 31/10): o
    // aceite mostrava um túnel `-copia` que nada usa. Pôr ou tirar a reserva
    // muda a oferta da principal, que aceita de novo (com o jogo desligado).
    tuneis: [
      { nome: servidor, protocolo: receita.rede.protocolo, porta },
      ...(comCopia ? [{ nome: tunelDaCopia(servidor), protocolo: 'tcp', porta: portaDaCopia(porta) }] : []),
    ],
    artefatos,
    pack: null,
    origens: [...receita.origens],
    dominios_do_jogo: [...receita.dominiosDoJogo],
    rodar: { comando: receita.rodar.comando, argumentos: [...receita.rodar.argumentos] },
    disco_maximo: disco,
    termos: receita.termos.map(t => ({ titulo: t.titulo, url: t.url })),
  };
}

// ---------------------------------------------------------------- configuração

/** Uma cópia da lista de palavras, para o padrão da receita nunca ser o que se edita. */
function copiarSegmentos(lista) {
  return lista.map(p => ({ texto: p.texto, cor: p.cor }));
}

/** O nome como texto simples, as palavras separadas por um espaço. */
function nomeEmTexto(segmentos) {
  return Array.isArray(segmentos) ? segmentos.map(p => p?.texto ?? '').join(' ') : String(segmentos ?? '');
}

/**
 * Confere uma lista de palavras `{texto, cor}` de um campo `segmentos`.
 * Devolve `{ lista }` com as palavras já aparadas, ou `{ erro }` com a frase.
 *
 * O `texto` nunca carrega `§` (uma palavra não escolhe a cor de outra por
 * fora do campo `cor`) nem quebra de linha, e a `cor` é uma das opções da
 * receita — as 16 do Minecraft.
 */
function conferirSegmentos(campo, valor) {
  if (!Array.isArray(valor)) return { erro: 'Use uma lista de palavras, cada uma com texto e cor.' };
  if (valor.length === 0) return { erro: 'Preencha o nome com ao menos uma palavra.' };
  if (valor.length > campo.maximoSegmentos) return { erro: `Use até ${campo.maximoSegmentos} palavras; são ${valor.length}.` };
  const lista = [];
  for (let i = 0; i < valor.length; i++) {
    const p = valor[i];
    const n = i + 1;
    const chaves = p && typeof p === 'object' && !Array.isArray(p) ? Object.keys(p) : [];
    if (chaves.length !== 2 || !chaves.includes('texto') || !chaves.includes('cor') || typeof p.texto !== 'string') {
      return { erro: `A palavra ${n} está mal formada: use {texto, cor}.` };
    }
    if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029§]/.test(p.texto)) return { erro: `A palavra ${n} tem § ou uma quebra de linha, que não valem num nome.` };
    const texto = p.texto.trim();
    if (texto === '') return { erro: `A palavra ${n} está vazia.` };
    if (!campo.opcoes.some(o => o.valor === p.cor)) {
      return { erro: `A palavra ${n} usa a cor ${typeof p.cor === 'string' ? '«' + p.cor + '»' : JSON.stringify(p.cor)}, que não é uma das 16 do Minecraft.` };
    }
    lista.push({ texto, cor: p.cor });
  }
  const tamanho = [...nomeEmTexto(lista)].length;
  if (campo.tamanhoMaximo && tamanho > campo.tamanhoMaximo) return { erro: `Use até ${campo.tamanhoMaximo} caracteres no nome todo; este tem ${tamanho}.` };
  return { lista };
}

/** O nome com o `§` de cada cor antes da palavra dela: o que o `motd` lê. */
function motdDe(campo, segmentos) {
  return segmentos.map(p => '§' + campo.opcoes.find(o => o.valor === p.cor).codigo + p.texto).join(' ');
}

/** A configuração com os padrões da receita. */
function configPadrao(receita) {
  const config = {};
  for (const campo of receita.configuracao.campos) config[campo.chave] = campo.forma === 'segmentos' ? copiarSegmentos(campo.padrao) : campo.padrao;
  return config;
}

/**
 * Confere `entrada` contra o esquema de configuração da receita, sobre a
 * configuração `atual`. Devolve a configuração nova e, por campo, a frase do
 * que não serviu — as mesmas frases que o SEELE usa num formulário.
 */
function validarConfig(receita, entrada, atual = configPadrao(receita)) {
  const config = { ...configPadrao(receita), ...atual };
  const erros = {};
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return { config, erros: { '': 'A configuração não veio.' } };
  const campos = new Map(receita.configuracao.campos.map(c => [c.chave, c]));
  for (const [chave, valor] of Object.entries(entrada)) {
    const campo = campos.get(chave);
    if (!campo) {
      erros[chave] = `A receita não tem o campo «${chave}».`;
      continue;
    }
    let erro = null;
    let valorFinal = valor;
    if (campo.forma === 'segmentos') {
      const c = conferirSegmentos(campo, valor);
      if (c.erro) erro = c.erro;
      else valorFinal = c.lista;
    } else if (campo.forma === 'campo') {
      if (typeof valor !== 'string') erro = 'Use um texto.';
      else if (campo.obrigatorio && valor.trim() === '') erro = 'Preencha este campo.';
      else if (campo.tamanhoMaximo && [...valor].length > campo.tamanhoMaximo) erro = `Use até ${campo.tamanhoMaximo} caracteres; este tem ${[...valor].length}.`;
    } else if (campo.forma === 'numero') {
      if (typeof valor !== 'number' || !Number.isFinite(valor)) erro = `Use um número de ${campo.minimo} a ${campo.maximo}.`;
      else if (!Number.isInteger(valor)) erro = 'Use um número inteiro.';
      else if (valor < campo.minimo || valor > campo.maximo) erro = `Use um número de ${campo.minimo} a ${campo.maximo}.`;
    } else if (campo.forma === 'escolha') {
      if (!campo.opcoes.some(o => o.valor === valor)) erro = 'Escolha uma das opções.';
    } else if (campo.forma === 'interruptor') {
      if (typeof valor !== 'boolean') erro = 'Use ligado ou desligado.';
    }
    if (erro) erros[chave] = erro;
    else config[chave] = valorFinal;
  }
  return { config, erros };
}

/**
 * Um valor de `.properties`: `\`, `:`, `=`, `#`, `!`, as quebras e tudo fora
 * do ASCII escapados (o `§` sai `\u00a7`, que é como o Java o lê).
 */
function escaparPropriedade(texto) {
  let saida = '';
  for (const c of String(texto)) {
    const p = c.codePointAt(0);
    if (c === '\\') saida += '\\\\';
    else if (c === ':' || c === '=' || c === '#' || c === '!') saida += '\\' + c;
    else if (c === '\n') saida += '\\n';
    else if (c === '\r') saida += '\\r';
    else if (c === '\t') saida += '\\t';
    else if (p < 0x20 || p > 0x7e) {
      // Fora do BMP, o par substituto, como o Java lê.
      const unidades = p > 0xffff ? [0xd800 + ((p - 0x10000) >> 10), 0xdc00 + ((p - 0x10000) & 0x3ff)] : [p];
      for (const u of unidades) saida += '\\u' + u.toString(16).padStart(4, '0');
    } else saida += c;
  }
  return saida.startsWith(' ') ? '\\' + saida : saida;
}

/** O arquivo de configuração do jogo, a partir da configuração e da porta. */
function escreverPropriedades(receita, config, porta, nivel = null) {
  const valores = { ...configPadrao(receita), ...config, porta };
  // Uma lista de palavras entra no modelo já com o § de cada cor.
  for (const campo of receita.configuracao.campos) {
    if (campo.forma === 'segmentos') valores[campo.chave] = motdDe(campo, valores[campo.chave]);
  }
  const linhas = [
    `# Escrito pelo MOD de multiplayer do SEELE (receita ${receita.id} ${receita.versao}).`,
    '# Mude pela tela do SEELE: o que mudar aqui é reescrito ao ligar.',
  ];
  for (const [chave, modelo] of Object.entries(receita.configuracao.propriedades)) {
    const valor = modelo.replace(/\{([A-Za-z0-9]+)\}/g, (_, nome) => String(valores[nome]));
    linhas.push(`${chave}=${escaparPropriedade(valor)}`);
  }
  // Um mundo novo é outra pasta (o mundo de antes fica na máquina).
  if (nivel) linhas.push(`level-name=${escaparPropriedade(nivel)}`);
  return linhas.join('\n') + '\n';
}

/**
 * **Um `.properties` lido como o Java o lê** (o bastante para o
 * `server.properties`): `#` e `!` comentam, a chave vai até o primeiro `=`,
 * `:` ou espaço sem escape, e `\uXXXX`, `\t`, `\n`, `\r` e `\x` voltam ao
 * caractere. O Minecraft reescreve o arquivo ao subir, em UTF-8 e sem os
 * escapes que o MOD escreve: comparar o texto diria «mudou» de tudo.
 */
function lerPropriedades(texto) {
  const lidas = new Map();
  const desfazer = s => s.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, e) => {
    if (e.length === 5) return String.fromCharCode(parseInt(e.slice(1), 16));
    return { t: '\t', n: '\n', r: '\r', f: '\f' }[e] ?? e;
  });
  for (const cru of String(texto).split(/\r?\n/)) {
    const linha = cru.replace(/^[ \t\f]+/, '');
    if (!linha || linha[0] === '#' || linha[0] === '!') continue;
    let k = 0;
    while (k < linha.length && !'=: \t\f'.includes(linha[k])) k += linha[k] === '\\' ? 2 : 1;
    const chave = desfazer(linha.slice(0, k));
    const resto = linha.slice(k).replace(/^[ \t\f]*[=:]?[ \t\f]*/, '');
    lidas.set(chave, desfazer(resto));
  }
  return lidas;
}

/**
 * **As chaves do MOD num `.properties` de outro** (o `default-server.properties`
 * que um pack traz): cada linha do outro fica, a de uma chave do MOD é
 * trocada pela dele, e as que faltam vão ao fim. Assim o que o pack quer
 * (o tipo do mundo de um skyblock) e o que a tela promete (a porta, o
 * `127.0.0.1`, o nome) valem os dois.
 */
function mesclarPropriedades(deles, nossas) {
  const chaveDe = l => [...lerPropriedades(l).keys()][0];
  const linhasMinhas = new Map();
  for (const l of String(nossas).split('\n')) {
    const chave = chaveDe(l);
    if (chave !== undefined) linhasMinhas.set(chave, l);
  }
  const vistas = new Set();
  const saida = [];
  for (const l of String(deles).split(/\r?\n/)) {
    const chave = chaveDe(l);
    if (chave !== undefined && linhasMinhas.has(chave)) {
      if (!vistas.has(chave)) saida.push(linhasMinhas.get(chave));
      vistas.add(chave);
    } else saida.push(l);
  }
  while (saida.length && saida.at(-1) === '') saida.pop();
  const faltam = [...linhasMinhas].filter(([chave]) => !vistas.has(chave)).map(([, l]) => l);
  if (faltam.length) saida.push('# Do MOD de multiplayer do SEELE: o que a tela promete vale também aqui.', ...faltam);
  return saida.join('\n') + '\n';
}

/**
 * O que o jogo **está usando** difere do que o MOD escreveu? Cada chave do
 * MOD, com o valor esperado e o lido (`null` quando sumiu).
 */
function propriedadesTrocadas(escritas, lidasTexto) {
  const esperadas = lerPropriedades(escritas);
  const lidas = lerPropriedades(lidasTexto);
  const trocadas = [];
  for (const [chave, esperado] of esperadas) {
    const lido = lidas.has(chave) ? lidas.get(chave) : null;
    if (lido !== esperado) trocadas.push({ chave, esperado, lido });
  }
  return trocadas;
}

// ---------------------------------------------------------------- saída

/** Uma linha da saída sem as sequências de cor do terminal (`ESC [ … m`). */
function semCores(linha) {
  return String(linha).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
}

/** Uma função que lê uma linha da saída do jogo e diz o que ela quer dizer. */
function casarSaida(receita) {
  const pronto = new RegExp(receita.saida.pronto);
  const entrou = new RegExp(receita.saida.entrou);
  const saiu = new RegExp(receita.saida.saiu);
  return linha => {
    const texto = String(linha);
    if (pronto.test(texto)) return { tipo: 'pronto' };
    let m = entrou.exec(texto);
    if (m) return { tipo: 'entrou', jogador: m[1] };
    m = saiu.exec(texto);
    if (m) return { tipo: 'saiu', jogador: m[1] };
    return null;
  };
}

// ---- modpack.js: o Minecraft com mods (o .mrpack do Modrinth) ----
//
// Funções puras sobre o `modrinth.index.json` e sobre a seção `modpack` da
// receita, usadas pela metade de servidor (que monta a oferta) e pela de
// máquina (que lê o índice do pack aceito e baixa cada arquivo). As regras são
// as da spec («Minecraft, a primeira receita» → «Com mods»), conferidas na
// especificação do formato do Modrinth:
//
// - `dependencies` dá a versão do Minecraft e o loader (`fabric-loader`,
//   `forge`, `neoforge` ou `quilt-loader`); **uma chave desconhecida é
//   recusada com o nome dela**, e não ignorada;
// - de `files`, só entram os que têm `env.server` diferente de `unsupported`,
//   cada um conferido pelo `sha512`, e só de `cdn.modrinth.com`, `github.com`,
//   `raw.githubusercontent.com` e `gitlab.com` (os `dominios` da receita);
// - `path` absoluto ou com `..` é recusado;
// - aplicam-se `overrides` e depois `server-overrides`;
// - instala-se o loader de servidor que o pack pede.
//
// **O pack inteiro é recusado no primeiro arquivo que não serve**, com o
// nome, o arquivo e os dados: meio modpack é um servidor que cai em jogo.

/** As chaves de `dependencies` que o formato conhece. */
const CHAVES_DE_DEPENDENCIA = Object.freeze(['minecraft', 'fabric-loader', 'quilt-loader', 'forge', 'neoforge']);

/** Quantos arquivos um pack pode ter: o índice de um pack grande tem algumas centenas. */
const TETO_DE_ARQUIVOS_DO_PACK = 2000;

/** Um `path` do índice que fica dentro da pasta do jogo: relativo, sem `..`, sem `\`. */
function caminhoDoPackServe(caminho) {
  if (typeof caminho !== 'string' || caminho === '' || caminho.length > 400) return false;
  if (/^[/\\]/.test(caminho) || /^[A-Za-z]:/.test(caminho) || caminho.includes('\\')) return false;
  if (/[\u0000-\u001f\u007f]/.test(caminho)) return false;
  return !caminho.split('/').some(p => p === '..' || p === '.' || p === '');
}

/**
 * **O índice do pack, conferido**: `{ ok: true, indice }` com o que a oferta e
 * a máquina precisam, ou `{ ok: false, erro, ... }` com o nome e os dados.
 *
 * `indice.arquivos` são só os do servidor (sem os `env.server: unsupported`,
 * contados em `excluidos`), cada um com a primeira URL que cai num dos
 * `dominios` da receita.
 */
function lerIndice(texto, receita) {
  const dominios = receita.modpack.dominios;
  const j = typeof texto === 'string' ? lerJson(texto) : texto;
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { ok: false, erro: 'indice-ilegivel' };
  if (j.formatVersion !== 1) return { ok: false, erro: 'formato-do-pack-desconhecido', formatVersion: j.formatVersion ?? null };
  if (j.game !== 'minecraft') return { ok: false, erro: 'pack-de-outro-jogo', game: j.game ?? null };
  const deps = j.dependencies;
  if (!deps || typeof deps !== 'object' || Array.isArray(deps)) return { ok: false, erro: 'pack-sem-dependencias' };
  for (const chave of Object.keys(deps)) {
    if (!CHAVES_DE_DEPENDENCIA.includes(chave)) return { ok: false, erro: 'dependencia-desconhecida', dependencia: chave, conhecidas: CHAVES_DE_DEPENDENCIA };
    if (typeof deps[chave] !== 'string' || !/^[A-Za-z0-9._+-]{1,64}$/.test(deps[chave])) return { ok: false, erro: 'versao-de-dependencia-invalida', dependencia: chave, versao: deps[chave] ?? null };
  }
  if (!deps.minecraft) return { ok: false, erro: 'pack-sem-minecraft' };
  const loaders = Object.keys(deps).filter(k => k !== 'minecraft');
  if (loaders.length > 1) return { ok: false, erro: 'loaders-demais', loaders };
  const loader = loaders.length ? { id: loaders[0], versao: deps[loaders[0]] } : null;
  if (loader && !receita.modpack.loaders[loader.id]) return { ok: false, erro: 'loader-sem-receita', loader: loader.id };

  if (!Array.isArray(j.files)) return { ok: false, erro: 'pack-sem-files' };
  if (j.files.length > TETO_DE_ARQUIVOS_DO_PACK) return { ok: false, erro: 'arquivos-demais-no-pack', quantos: j.files.length, teto: TETO_DE_ARQUIVOS_DO_PACK };
  const arquivos = [];
  let excluidos = 0;
  for (const f of j.files) {
    const path = f?.path;
    if (!caminhoDoPackServe(path)) return { ok: false, erro: 'caminho-recusado', path: path ?? null };
    if (f.env !== undefined && (typeof f.env !== 'object' || f.env === null)) return { ok: false, erro: 'env-invalido', path };
    if (f.env?.server === 'unsupported') {
      excluidos++;
      continue;
    }
    const sha512 = f.hashes?.sha512;
    if (typeof sha512 !== 'string' || !/^[0-9a-f]{128}$/.test(sha512)) return { ok: false, erro: 'sem-sha512', path };
    if (!Number.isInteger(f.fileSize) || f.fileSize < 1) return { ok: false, erro: 'sem-tamanho', path };
    const urls = Array.isArray(f.downloads) ? f.downloads.map(String) : [];
    const url = urls.find(u => {
      const host = hostDaUrl(u);
      return host && dominios.includes(host);
    });
    if (!url) return { ok: false, erro: 'download-fora-dos-dominios', path, urls: urls.slice(0, 3), dominios };
    if (arquivos.some(a => a.path === path)) return { ok: false, erro: 'caminho-repetido', path };
    arquivos.push({ path, url, sha512, tamanho: f.fileSize });
  }
  return {
    ok: true,
    indice: {
      nome: cortar(String(j.name ?? ''), 64),
      versaoDoPack: cortar(String(j.versionId ?? ''), 32),
      mc: deps.minecraft,
      loader,
      arquivos,
      excluidos,
      bytes: arquivos.reduce((n, a) => n + a.tamanho, 0),
    },
  };
}

/** O que a metade de servidor guarda e a tela mostra de um pack lido (sem a lista de arquivos). */
function resumoDoIndice(indice) {
  return {
    nome: indice.nome, versaoDoPack: indice.versaoDoPack, mc: indice.mc, loader: indice.loader,
    arquivos: indice.arquivos.length, excluidos: indice.excluidos, bytesDosArquivos: indice.bytes,
  };
}

/**
 * Um link do Modrinth: `https://modrinth.com/modpack/<slug>`, com
 * `/version/<id ou número>` opcional. Devolve `{ slug, versao }` ou a recusa.
 */
function lerLinkDoModrinth(link) {
  const m = /^https:\/\/(?:www\.)?modrinth\.com\/modpack\/([A-Za-z0-9_-]{1,64})(?:\/version\/([A-Za-z0-9._+-]{1,64}))?\/?(?:[?#].*)?$/.exec(String(link ?? '').trim());
  if (!m) return { ok: false, erro: 'link-nao-e-do-modrinth', link: cortar(String(link ?? ''), 120) };
  return { ok: true, slug: m[1], versao: m[2] ?? null };
}

/**
 * A versão do modpack na resposta da API do Modrinth (`/project/<slug>/version`,
 * da mais nova para a mais velha): a pedida (por id ou número) ou a mais nova,
 * e o arquivo `.mrpack` primário dela, com o `sha512` e o tamanho.
 */
function escolherVersaoDoModrinth(lista, versao, receita) {
  if (!Array.isArray(lista) || !lista.length) return { ok: false, erro: 'modpack-sem-versoes' };
  const v = versao ? lista.find(x => x?.id === versao || x?.version_number === versao) : lista[0];
  if (!v) return { ok: false, erro: 'versao-do-modpack-desconhecida', versao };
  const arquivos = Array.isArray(v.files) ? v.files : [];
  const f = arquivos.find(x => x?.primary && /\.mrpack$/.test(String(x.filename))) ?? arquivos.find(x => /\.mrpack$/.test(String(x?.filename)));
  if (!f) return { ok: false, erro: 'versao-sem-mrpack', versao: v.id ?? null };
  if (hostDaUrl(f.url) !== receita.modpack.cdn) return { ok: false, erro: 'mrpack-fora-do-cdn', url: f.url ?? null, cdn: receita.modpack.cdn };
  if (!/^[0-9a-f]{128}$/.test(String(f.hashes?.sha512)) || !Number.isInteger(f.size)) return { ok: false, erro: 'mrpack-sem-hash', url: f.url };
  return {
    ok: true,
    versao: { id: String(v.id), numero: cortar(String(v.version_number ?? ''), 32), nome: cortar(String(v.name ?? ''), 64) },
    arquivo: { nome: cortar(String(f.filename), 120), url: f.url, sha512: f.hashes.sha512, tamanho: f.size },
  };
}

/**
 * **O termo do pack** (revisão final, I2): o pack é aceito pelo hash, e o que
 * vem nele — os mods do índice e todo arquivo de `overrides/` e
 * `server-overrides/`, jars inclusive — roda neste computador. A tela do
 * aceite lista de onde se baixa, e um «pode baixar de cdn.modrinth.com» lido
 * sozinho dizia menos do que roda. Como termo, a pessoa marca que leu.
 */
const TERMO_DO_PACK = Object.freeze({
  titulo: 'o modpack: os mods dele e todo arquivo que ele traz (overrides, jars inclusive) rodam neste computador, com a sua conta',
  url: 'https://support.modrinth.com/en/articles/8802351-modrinth-modpack-format-mrpack',
});

/**
 * **O que o pack não troca** (revisão final, I2): o que o aceite mostra como
 * «vai rodar» — o comando, o jar de `-jar`, o arquivo de `@argumentos` —, cada
 * artefato aceito que não é um pacote, a marca do instalador (`.seele-loader`,
 * que pularia o instalador) e o arquivo que diz ao lançador do Fabric qual é o
 * jar do servidor. Um pack que traz um deles (no índice ou nos overrides) é
 * recusado: os mods rodam (é o termo), mas o programa que a tela nomeia é o
 * aceito.
 */
function caminhosProtegidosDoPack(plano) {
  const caminhos = ['.seele-loader', 'fabric-server-launcher.properties'];
  for (const a of plano.artefatos ?? []) if (!a.desempacotar && a.destino) caminhos.push(a.destino);
  // Os de **todo** sistema (decisão W1): o `win_args.txt` que o pack trouxesse
  // seria o que a máquina Windows roda, mesmo lido num Mac.
  const dosSistemas = (plano.porSistema ?? []).flatMap(e => [e.rodar, e.instalar]);
  for (const c of [plano.rodar, plano.modpack?.instalar, ...dosSistemas]) {
    if (!c) continue;
    caminhos.push(c.comando, c.comando + '.exe');
    (c.argumentos ?? []).forEach((arg, k, todos) => {
      if (arg === '-jar' && todos[k + 1]) caminhos.push(todos[k + 1]);
      if (arg.startsWith('@') && arg.length > 1) caminhos.push(arg.slice(1));
    });
  }
  return [...new Set(caminhos)].filter(caminhoDoPackServe);
}

/** `{mc}` e `{loader}` num modelo. */
const comVersoes = (modelo, mc, loader) => String(modelo).replace(/\{mc\}/g, mc).replace(/\{loader\}/g, loader);

/**
 * **O instalador do loader** que o pack pede, como um artefato da oferta:
 * fixo (a receita traz URL, hash e tamanho), ou lido de um Maven Reposilite
 * (o hash do `<url>.<algoritmo>` e o tamanho da API de detalhes).
 */
function instaladorDoLoader(receita, loader, mc, buscar) {
  const l = receita.modpack.loaders[loader.id];
  if (!l) return { ok: false, erro: 'loader-sem-receita', loader: loader.id };
  const inst = l.instalador;
  const nome = inst.destino.split('/').pop();
  if (inst.fonte === 'fixo') {
    return { ok: true, artefato: { id: 'instalador', nome, url: inst.url, tamanho: inst.tamanho, hash: { ...inst.hash }, destino: inst.destino } };
  }
  const url = comVersoes(inst.url, mc, loader.versao);
  let hex;
  try {
    hex = buscar(url + '.' + inst.algoritmo);
  } catch {
    hex = null;
  }
  hex = typeof hex === 'string' ? hex.trim().toLowerCase().slice(0, 128) : null;
  if (!hex || hex.length !== ({ sha1: 40, sha256: 64, sha512: 128 })[inst.algoritmo] || !/^[0-9a-f]+$/.test(hex)) {
    return { ok: false, erro: 'instalador-sem-hash', url: url + '.' + inst.algoritmo };
  }
  const detalhes = buscarJson(buscar, comVersoes(inst.detalhes, mc, loader.versao));
  if (!detalhes.ok) return { ...detalhes, erro: 'instalador-sem-tamanho' };
  const tamanho = detalhes.json?.contentLength;
  if (!Number.isInteger(tamanho) || tamanho < 1) return { ok: false, erro: 'instalador-sem-tamanho', url: comVersoes(inst.detalhes, mc, loader.versao) };
  return { ok: true, artefato: { id: 'instalador', nome, url, tamanho, hash: { algoritmo: inst.algoritmo, hex }, destino: inst.destino } };
}

/**
 * Os dois comandos do loader, com as versões do pack: `{ instalar, rodar,
 * porSistema }`. `porSistema` são as entradas de `por_sistema` da oferta
 * (decisão W1): o Forge e o NeoForge no Windows rodam pelo `win_args.txt`, com
 * o `java.exe`; o instalador é o mesmo jar, com os argumentos de cima se a
 * entrada não traz os seus.
 */
function comandosDoLoader(receita, loader, mc) {
  const l = receita.modpack.loaders[loader.id];
  const v = args => args.map(a => comVersoes(a, mc, loader.versao));
  return {
    instalar: { comando: receita.rodar.comando, argumentos: v(l.instalar) },
    rodar: { comando: receita.rodar.comando, argumentos: v(l.rodar) },
    porSistema: (l.porSistema ?? []).map(e => ({
      plataformas: [...e.plataformas],
      rodar: { comando: e.comando, argumentos: v(e.rodar) },
      instalar: { comando: e.comando, argumentos: v(e.instalar ?? l.instalar) },
    })),
  };
}

/**
 * **O par que esta máquina roda** (decisão W1), pela regra do produto
 * (`seele_proto::maquina::comandos_para`): a entrada de `por_sistema` que
 * nomeia `plataforma` substitui o `rodar` e o `instalar` de cima inteiros; sem
 * entrada, valem os de cima. A metade de máquina pede ao `programa` só este
 * par — o de outro sistema é `comando-fora-do-aceito`.
 */
function comandosDaMaquina({ rodar = null, instalar = null, porSistema = [] }, plataforma) {
  const e = (porSistema ?? []).find(x => x.plataformas.includes(plataforma));
  return e ? { rodar: e.rodar ?? null, instalar: e.instalar ?? null } : { rodar, instalar };
}

/**
 * A oferta de um servidor com mods: a do Vanilla da versão do pack, mais o
 * instalador do loader, o `.mrpack` (pelo link, como artefato do CDN), o
 * `pack` pelo `sha512`, os domínios do pack nas origens (a segunda porta do
 * `programa`, decisão Q1 da parte 4), os do loader nos do jogo, o passo de
 * instalar e o disco dos mods e do loader.
 */
function montarOfertaComMods(receita, args, resolvido, pack) {
  const oferta = montarOferta(receita, args, resolvido);
  const extras = [];
  if (pack.instalador) extras.push(pack.instalador);
  if (pack.origem === 'link') extras.push({ nome: 'pack.mrpack', url: pack.url, tamanho: pack.bytes, hash: { algoritmo: 'sha512', hex: pack.sha512 } });
  for (const a of extras) oferta.artefatos.push({ nome: a.nome, url: a.url, tamanho: a.tamanho, hash: { algoritmo: a.hash.algoritmo, hex: a.hash.hex } });
  oferta.pack = { algoritmo: 'sha512', hex: pack.sha512 };
  for (const d of receita.modpack.dominios) if (!oferta.origens.includes(d)) oferta.origens.push(d);
  // O que o pack traz roda aqui: a pessoa lê e marca (pela página do pack, se veio pelo link).
  oferta.termos.push({ titulo: TERMO_DO_PACK.titulo, url: pack.pagina ?? TERMO_DO_PACK.url });
  if (pack.loader) {
    const l = receita.modpack.loaders[pack.loader.id];
    for (const d of l.dominiosDoJogo) if (!oferta.dominios_do_jogo.includes(d)) oferta.dominios_do_jogo.push(d);
    const c = comandosDoLoader(receita, pack.loader, pack.mc);
    oferta.instalar = c.instalar;
    oferta.rodar = c.rodar;
    if (c.porSistema.length) oferta.por_sistema = c.porSistema;
  }
  // O pack, o pack aberto (os overrides, cerca de três vezes o pack), os
  // arquivos do índice, o instalador e o que o loader instala sozinho.
  const loaderDisco = pack.loader ? receita.modpack.loaders[pack.loader.id].disco : 0;
  const somar = pack.bytes * 4 + (pack.resumo?.bytesDosArquivos ?? 0) + (pack.instalador?.tamanho ?? 0) + loaderDisco;
  oferta.disco_maximo = Math.min(DISCO_MAXIMO_DA_OFERTA, oferta.disco_maximo + somar);
  oferta.titulo = cortar(`${receita.nome} ${args.versao} com mods · ${args.servidor}`, 64);
  return oferta;
}

// ---- servidor.js: a metade de servidor ----
//
// Guarda a lista de servidores de jogo e a configuração de cada um, quem roda
// onde, e a regra de uma máquina por vez. Fala com a máquina pelo
// `mundo.maquinas` da API 8, e com as janelas pelo `mundo.avisar`.
//
// # Quem pode o quê
//
// Toda mudança é uma ação declarada no manifesto, e quem decide se a pessoa a
// tem é o anfitrião (os cargos), antes de chamar este código. Aqui só se
// confere que a ação que o **anfitrião** escreveu em `contexto.acao` é a da
// operação pedida: um pedido comum com o corpo falsificado não muda nada, e a
// ação de entrar no jogo não liga servidor nenhum.
//
// # Nada calado
//
// Toda recusa volta com o nome e com os dados (`{ ok: false, erro, ... }`), e
// toda falha que acontece longe de quem pediu — a recusa da máquina, o hash
// que não bateu, o jogo que caiu — fica no servidor de jogo, em `falhas`, que
// a tela mostra, e no log de quem hospeda.

const TETO_DE_SERVIDORES = 8;
const TETO_DE_FALHAS = 6;
const TETO_DE_LINHAS = 8;
const VALIDADE_DAS_VERSOES = 3600;
/** O teto de `mundo.buscarPack` (o de `mundo.buscar`): um pack maior vai pelo envio. */
const TETO_DO_PACK_PELO_LINK = 4 * 1024 * 1024;
/** Quanto uma espera de envio do pack vale, em segundos (o teto do produto é 600). */
const PRAZO_DO_ENVIO = 600;
/** De quantos em quantos minutos a dona copia o mundo para a outra máquina (parte 7; o padrão da spec). */
const INTERVALO_DA_COPIA = 5;
const INTERVALO_DA_COPIA_MINIMO = 1;
const INTERVALO_DA_COPIA_MAXIMO = 60;
const PAPEIS = Object.freeze(['principal', 'reserva']);
const outroPapel = papel => (papel === 'reserva' ? 'principal' : 'reserva');

/** A ação que cada operação de mudança pede. As outras são leitura. */
const ACAO_DA_OP = Object.freeze({
  criar: 'criar-servidor-de-jogo',
  apagar: 'criar-servidor-de-jogo',
  configurar: 'configurar-servidor-de-jogo',
  console: 'configurar-servidor-de-jogo',
  // O modpack (parte 6): escolher o pack muda o que roda, como a versão.
  'pack-link': 'configurar-servidor-de-jogo',
  'pack-enviar': 'configurar-servidor-de-jogo',
  'pack-chegou': 'configurar-servidor-de-jogo',
  ligar: 'ligar-desligar-servidor-de-jogo',
  desligar: 'ligar-desligar-servidor-de-jogo',
  // A passagem avisada à outra máquina (parte 7) é ligar numa e desligar na outra.
  passar: 'ligar-desligar-servidor-de-jogo',
});

/** Os estados em que o processo do jogo está de pé, ou a caminho. */
const RODANDO = new Set(['ligando', 'ligado', 'parando', 'salvando']);
const ESTADOS_DA_MAQUINA = new Set(['desligado', 'baixando', 'instalando', 'pronto', 'ligando', 'ligado', 'parando', 'salvando', 'caiu']);

// ---------------------------------------------------------------- o quintal

function lerServidores() {
  const lido = lerJson(dados.servidores);
  return lido && typeof lido === 'object' ? lido : {};
}

function gravarServidores(servidores) {
  dados.servidores = JSON.stringify(servidores);
  dados.revisao = String(Number(dados.revisao ?? '0') + 1);
  mundo.avisar({ carga: { revisao: Number(dados.revisao) } });
}

/** Uma falha no servidor de jogo, que a tela mostra com os dados, e no log. */
function anotarFalha(s, onde, erro, extra = {}) {
  const falha = { quando: mundo.agora(), onde, ...extra, erro: String(erro) };
  s.falhas = [...(s.falhas ?? []), falha].slice(-TETO_DE_FALHAS);
  mundo.registrar(`${s.id}: ${onde}: ${erro} ${JSON.stringify(extra)}`);
}

/** O que a tela de cada pessoa recebe de um servidor de jogo. */
function publico(s) {
  const receita = receitaPorId(s.receita);
  return {
    id: s.id,
    receita: s.receita,
    variante: s.variante,
    versao: s.versao,
    config: s.config,
    quem: s.quem,
    porta: s.porta,
    aceite: s.aceite,
    motivo: s.motivo ?? null,
    ligar: s.ligar,
    estado: s.estado,
    progresso: s.progresso ?? null,
    jogadores: s.jogadores ?? [],
    maximo: s.config?.maximo ?? null,
    falhas: s.falhas ?? [],
    linhas: s.linhas ?? [],
    precisaReiniciar: Boolean(s.precisaReiniciar),
    semJava: s.resolvido?.semJava ?? [],
    substituidas: s.resolvido?.substituidas ?? {},
    disco: s.oferta ? s.oferta.disco_maximo : null,
    protocolo: receita?.rede.protocolo ?? 'tcp',
    pack: s.pack ? publicoDoPack(s.pack) : null,
    // A reserva (parte 7): quem é, o aceite dela, quem é a dona agora, a
    // última cópia, o que a outra máquina tem, e o tempo de jogo perdido.
    reserva: s.reserva ? { quem: s.reserva.quem, aceite: s.reserva.aceite, motivo: s.reserva.motivo ?? null, estado: s.reserva.estado ?? null } : null,
    dona: donaDe(s),
    quemEADona: quemOpera(s, donaDe(s)),
    intervaloDaCopia: s.intervaloDaCopia ?? INTERVALO_DA_COPIA,
    copia: s.copia ? { quando: s.copia.quando, tamanho: s.copia.tamanho, de: s.copia.de, sha256: s.copia.sha256 } : null,
    copiaRecebida: s.copiaRecebida ? { quando: s.copiaRecebida.quando, sha256: s.copiaRecebida.sha256, por: s.copiaRecebida.por } : null,
    perdido: s.perdido ?? null,
    passando: s.passando ?? null,
    voltouRodando: s.voltouRodando ?? 0,
    // Sem quem hospeda: a dona seguiu rodando e foi religada sem desligar.
    religada: s.religada ?? null,
    // O servidor SEELE subiu de novo e esta metade chamou as máquinas de volta.
    chamando: s.chamando ?? null,
    // A versão que rodou este mundo por último, e a pasta dele.
    versaoDoMundo: versaoDoMundo(s),
    mundo: s.mundo ?? null,
  };
}

// ---------------------------------------------------------------- a reserva (parte 7)

/** Quem é a dona agora: o papel. Sem reserva, sempre a principal. */
function donaDe(s) {
  return s.dona === 'reserva' && s.reserva ? 'reserva' : 'principal';
}

/** Quem opera um papel: a pessoa, ou null. */
function quemOpera(s, papel) {
  return papel === 'reserva' ? (s.reserva?.quem ?? null) : s.quem;
}

/** O aceite de um papel. */
function aceiteDe(s, papel) {
  return papel === 'reserva' ? (s.reserva?.aceite ?? 'sem-maquina') : s.aceite;
}

function marcarAceite(s, papel, aceite, motivo = null) {
  if (papel === 'reserva') {
    if (!s.reserva) return;
    s.reserva.aceite = aceite;
    s.reserva.motivo = motivo;
  } else {
    s.aceite = aceite;
    s.motivo = motivo;
  }
}

/** O papel de quem fala, pelo contexto que o produto escreve, conferido contra quem opera. */
function papelDe(s, contexto) {
  const dito = contexto.maquina?.papel;
  const papel = PAPEIS.includes(dito) ? dito : (contexto.person === s.quem ? 'principal' : contexto.person === s.reserva?.quem ? 'reserva' : null);
  return papel && quemOpera(s, papel) === contexto.person ? papel : null;
}

/** **A posse no produto**: só a dona serve o túnel. Dita a cada mudança, e a cada pedido (um servidor que reinicia volta à principal). */
function declararADona(s) {
  mundo.maquinas.dona({ servidor: s.id, papel: donaDe(s) });
}

/**
 * **A posse passa** a `papel`: o produto para os túneis da dona de antes, a
 * nova ouve «assuma» e a de antes ouve «desligue». `perdido` é o tempo de
 * jogo que se perdeu (a queda de surpresa), ou null (a passagem avisada).
 */
function passarAPosse(s, papel, perdido) {
  const antes = donaDe(s);
  s.dona = papel;
  s.passando = null;
  declararADona(s);
  mundo.maquinas.avisar({ servidor: s.id, papel, carga: { op: 'assumir', perdido: perdido?.segundos ?? null } });
  mundo.maquinas.avisar({ servidor: s.id, papel: antes, carga: { op: 'desligar' } });
  if (perdido) s.perdido = perdido;
  mundo.registrar(`${s.id}: a posse passou de ${antes} para ${papel}${perdido ? `; perderam-se ${perdido.segundos} s de jogo` : ''}`);
}

/** O que a tela mostra do pack: o resumo, de onde veio, o hash e o tamanho. */
function publicoDoPack(p) {
  return {
    origem: p.origem, link: p.link ?? null, pagina: p.pagina ?? null, sha512: p.sha512, bytes: p.bytes,
    ...p.resumo, instalador: p.instalador ? { nome: p.instalador.nome, tamanho: p.instalador.tamanho } : null,
  };
}

// ---------------------------------------------------------------- a oferta

/** A porta do jogo na máquina de `quem`: a padrão, ou a primeira livre depois dela. */
function portaPara(servidores, s, quem) {
  const receita = receitaPorId(s.receita);
  // As portas que os outros servidores de jogo já tomam nesta máquina, como
  // principal ou como reserva (parte 7).
  const tomadas = new Set(Object.values(servidores).flatMap(o => (o.id === s.id ? [] : [
    o.quem === quem ? o.porta : null,
    o.reserva?.quem === quem ? o.reserva.porta : null,
  ])).filter(Boolean));
  let porta = receita.rede.portaPadrao;
  while (tomadas.has(porta)) porta++;
  return porta;
}

/** Monta a oferta da versão e da máquina escolhidas, e chama a pessoa (a principal, ou a reserva). */
function pedirAMaquina(servidores, s, papel = 'principal') {
  const receita = receitaPorId(s.receita);
  const comMods = s.variante === 'com-mods';
  if (comMods && !s.pack) {
    s.aceite = 'sem-pack';
    return { ok: true };
  }
  if (!s.resolvido || s.resolvido.versao !== s.versao) {
    const resolvido = resolverVersao(receita, s.versao, url => mundo.buscar(url));
    if (!resolvido.ok) return resolvido;
    s.resolvido = resolvido;
  }
  const quem = quemOpera(s, papel);
  if (!quem) return { ok: true };
  const porta = portaPara(servidores, s, quem);
  // O túnel da cópia só com reserva (e2e da API 8, 31/10): sem ela, o aceite
  // mostrava um túnel que nada usa.
  const args = { servidor: s.id, versao: s.versao, porta, comCopia: Boolean(s.reserva) };
  const oferta = comMods ? montarOfertaComMods(receita, args, s.resolvido, s.pack) : montarOferta(receita, args, s.resolvido);
  try {
    mundo.maquinas.pedir({ quem, servidor: s.id, papel, oferta });
    declararADona(s);
  } catch (erro) {
    return { ok: false, erro: 'oferta-recusada', porque: fraseDoErro(erro) };
  }
  if (papel === 'reserva') {
    s.reserva.porta = porta;
    s.reserva.oferta = oferta;
  } else {
    s.porta = porta;
    s.oferta = oferta;
  }
  marcarAceite(s, papel, 'esperando');
  return { ok: true };
}

/** Pede de novo as duas máquinas (a versão, o pack ou a configuração do que roda mudaram). */
function pedirAsDuas(servidores, s) {
  const r = pedirAMaquina(servidores, s, 'principal');
  if (!r.ok) return r;
  return s.reserva ? pedirAMaquina(servidores, s, 'reserva') : r;
}

// ---------------------------------------------------------------- o servidor SEELE que sobe

/**
 * **Chama de volta a máquina de um papel** com a oferta que ela aceitou —
 * igual, para o app religar a metade de máquina que seguiu rodando sem quem
 * hospeda (S2 do SEELE) em vez de subir outra —, e diz a dona de novo (a
 * posse mora na memória do servidor, que nasceu na principal).
 */
function chamarDeVolta(servidores, s, papel) {
  const quem = quemOpera(s, papel);
  const { oferta } = daOfertaDe(s, papel);
  if (!oferta) return pedirAMaquina(servidores, s, papel);
  try {
    declararADona(s);
    mundo.maquinas.pedir({ quem, servidor: s.id, papel, oferta });
  } catch (erro) {
    return { ok: false, erro: 'oferta-recusada', porque: fraseDoErro(erro) };
  }
  marcarAceite(s, papel, 'esperando');
  return { ok: true };
}

/**
 * **A metade de servidor subiu** (`MetadeSubiu`, API 8): o servidor SEELE
 * reiniciou, ou o código desta metade mudou. O quintal guardou quem rodava,
 * e `maquinas` é o que o livro do servidor tem agora — vazio num servidor que
 * reiniciou. Cada papel que o quintal diz aceito (ou esperando) e que o livro
 * não tem é chamado de volta; até ele responder, o cartão diz «esperando a
 * máquina», e nunca «ligado». Sem isto, o cartão ficava LIGADO sem jogo em
 * lugar nenhum, DESLIGAR ia só ao seele.log, PASSAR ficava «passando» para
 * sempre e trocar a máquina era recusado (e2e da API 8, passo 16).
 */
function metadeSubiu(carga) {
  const servidores = lerServidores();
  const lugares = Array.isArray(carga.maquinas) ? carga.maquinas : [];
  const noLivro = (s, papel, quem, aceito) => lugares.some(m => m.servidor === s.id && m.papel === papel && String(m.pessoa) === quem && (!aceito || m.aceita === true));
  let mudou = false;
  for (const s of Object.values(servidores)) {
    let chamou = false;
    for (const papel of PAPEIS) {
      const quem = quemOpera(s, papel);
      const aceite = aceiteDe(s, papel);
      // A que caiu (saiu) também: o servidor que para derruba a conexão de
      // todos, e o MOD ouve MaquinaParou com saiu antes de ele descer.
      const caiu = aceite === 'parado' && QUEDAS.includes(papel === 'reserva' ? s.reserva?.motivo : s.motivo);
      if (!quem || !(['aceito', 'esperando', 'fora'].includes(aceite) || caiu)) continue;
      if (noLivro(s, papel, quem, aceite === 'aceito')) continue;
      const r = chamarDeVolta(servidores, s, papel);
      if (!r.ok) {
        marcarAceite(s, papel, 'parado', r.erro);
        anotarFalha(s, 'aceite', r.erro, { papel, momento: 'chamada', dados: { pessoa: quem } });
      }
      if (papel === 'reserva' && s.reserva) s.reserva.estado = null;
      chamou = true;
    }
    if (!chamou) continue;
    mudou = true;
    s.chamando = { quando: mundo.agora(), motivo: String(carga.motivo ?? '') };
    // Uma passagem em curso não sobrevive: as duas máquinas estão sendo chamadas.
    if (s.passando) {
      anotarFalha(s, 'reserva', 'passagem-interrompida', { papel: s.passando.para, dados: {} });
      s.passando = null;
    }
    // O que a dona contou antes não vale mais: quem diz agora é ela, ao voltar.
    if (s.estado !== 'desligado') s.estado = s.ligar ? 'esperando-maquina' : 'desligado';
    s.jogadores = [];
    mundo.registrar(`${s.id}: a metade de servidor subiu (${carga.motivo ?? '?'}); chamando as máquinas de volta`);
  }
  if (mudou) gravarServidores(servidores);
}

// ---------------------------------------------------------------- a versão do mundo

/**
 * A versão que rodou o mundo por último: a que a dona contou ligada. Num
 * servidor de antes disto, a da última oferta que uma máquina aceitou.
 */
function versaoDoMundo(s) {
  return s.versaoDoMundo ?? (s.oferta?.versao_do_jogo ?? null);
}

/** Os números de uma versão (`1.21.4`, `26.3`, `1.21.5-pre1`), ou null se não é uma versão numerada. */
function numerosDaVersao(v) {
  const m = /^([0-9]+(?:\.[0-9]+)*)/.exec(String(v ?? ''));
  return m ? m[1].split('.').map(Number) : null;
}

/** `a` é mais velha que `b`? null quando não dá para comparar (um snapshot). */
function maisVelha(a, b) {
  const x = numerosDaVersao(a);
  const y = numerosDaVersao(b);
  if (!x || !y) return null;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d < 0;
  }
  return false;
}

/**
 * **Um mundo não volta para uma versão mais velha** (e2e da API 8, passo 18:
 * o Fabric 1.21.4 caiu ao abrir o mundo do 26.3). Trocar para uma versão mais
 * velha que a que rodou o mundo pede uma escolha: `mundo: 'novo'` começa outro
 * mundo (o de antes fica na máquina, na pasta dele); sem ela, a recusa diz as
 * duas versões, e a tela oferece começar um mundo novo ou manter a versão.
 */
function conferirAVersaoDoMundo(s, versao, escolha) {
  const doMundo = versaoDoMundo(s);
  if (!versao || !doMundo || versao === doMundo || maisVelha(versao, doMundo) !== true) return { ok: true };
  if (escolha === 'novo') return { ok: true, novo: true };
  return { ok: false, erro: 'mundo-mais-novo', mundo: doMundo, pedida: versao };
}

/** Começa um mundo novo: outra pasta (o `level-name`), e o de antes fica na máquina. */
function comecarMundoNovo(s, receita) {
  const n = (s.mundos ?? 1) + 1;
  s.mundos = n;
  s.mundo = `${receita.mundo.pasta}-${n}`;
  s.versaoDoMundo = null;
  s.copia = null;
  s.copiaRecebida = null;
  mundo.registrar(`${s.id}: mundo novo em ${s.mundo}`);
}

// ---------------------------------------------------------------- as operações

function opEstado(contexto) {
  const servidores = lerServidores();
  return {
    ok: true,
    revisao: Number(dados.revisao ?? '0'),
    receitas: RECEITAS.map(r => {
      const v = validarReceita(r);
      return { id: r.id, nome: r.nome, edicao: r.edicao ?? '', icone: r.icone, descricao: r.descricao, versao: r.versao, valida: v.ok, erros: v.erros.slice(0, 4) };
    }),
    servidores: Object.values(servidores).map(publico),
    podem: Array.isArray(contexto.permissoes) ? contexto.permissoes : [],
  };
}

function opVersoes(pedido) {
  const receita = receitaPorId(pedido.receita);
  if (!receita) return { ok: false, erro: 'receita-desconhecida', receita: pedido.receita ?? null };
  const cache = lerJson(dados['versoes:' + receita.id]);
  if (cache && mundo.agora() - cache.quando < VALIDADE_DAS_VERSOES) return { ok: true, versoes: cache.versoes };
  const r = listarVersoes(receita, url => mundo.buscar(url));
  if (!r.ok) return r;
  const versoes = r.versoes.map(v => v.id);
  dados['versoes:' + receita.id] = JSON.stringify({ quando: mundo.agora(), versoes });
  return { ok: true, versoes };
}

function opCriar(pedido, contexto) {
  const receita = receitaPorId(pedido.receita);
  if (!receita) return { ok: false, erro: 'receita-desconhecida', receita: pedido.receita ?? null };
  const valida = validarReceita(receita);
  if (!valida.ok) return { ok: false, erro: 'receita-invalida', receita: receita.id, erros: valida.erros.slice(0, 4) };
  const servidores = lerServidores();
  if (Object.keys(servidores).length >= TETO_DE_SERVIDORES) return { ok: false, erro: 'servidores-demais', teto: TETO_DE_SERVIDORES };
  const contador = lerJson(dados.contadores) ?? {};
  let n = contador[receita.id] ?? 0;
  let id;
  do { id = `${receita.id}-${++n}`; } while (servidores[id]);
  contador[receita.id] = n;
  dados.contadores = JSON.stringify(contador);
  // **O nome padrão se distingue** (e2e da API 8, 31/10: três cartões
  // «Servidor do SEELE»): o nome do jogo e o número do servidor de jogo.
  const config = configPadrao(receita);
  const campoDoNome = receita.configuracao.campos.find(c => c.chave === 'nome');
  if (campoDoNome?.forma === 'segmentos') config.nome = [{ texto: `${receita.nome} ${n}`, cor: campoDoNome.padrao[0]?.cor ?? null }];
  else if (campoDoNome?.forma === 'texto') config.nome = `${receita.nome} ${n}`;
  const s = {
    id, receita: receita.id, variante: 'vanilla', versao: null, config,
    quem: null, porta: null, aceite: 'sem-maquina', motivo: null, ligar: false, estado: 'desligado',
    jogadores: [], falhas: [], linhas: [], criadoPor: contexto.person,
  };
  servidores[id] = s;
  gravarServidores(servidores);
  return { ok: true, servidor: publico(s) };
}

function opApagar(s, servidores) {
  if (RODANDO.has(s.estado)) return { ok: false, erro: 'desligue-antes', estado: s.estado };
  if (s.pack?.caminho) volume.apagar(s.pack.caminho);
  delete servidores[s.id];
  gravarServidores(servidores);
  return { ok: true };
}

function opConfigurar(s, servidores, pedido) {
  const receita = receitaPorId(s.receita);
  const variante = pedido.variante !== undefined ? pedido.variante : (s.variante ?? 'vanilla');
  const v = receita.variantes[variante];
  if (!v || v.disponivel === false || (variante === 'com-mods' && !receita.modpack)) {
    return { ok: false, erro: 'variante-indisponivel', variante, porque: v?.porque ?? null };
  }
  let config = s.config;
  if (pedido.config !== undefined) {
    const r = validarConfig(receita, pedido.config, s.config);
    if (Object.keys(r.erros).length) return { ok: false, erro: 'config-invalida', erros: r.erros };
    config = r.config;
  }
  // Com mods, a versão é a que o pack pede, e não a que a tela manda.
  const versao = variante === 'com-mods'
    ? (s.pack?.mc ?? null)
    : pedido.versao !== undefined ? (pedido.versao === null ? null : String(pedido.versao)) : (s.variante === 'com-mods' ? null : s.versao);
  const quem = pedido.quem !== undefined ? (pedido.quem === null ? null : String(pedido.quem)) : s.quem;
  if (quem !== null && !/^[1-9][0-9]*$/.test(quem)) return { ok: false, erro: 'quem-invalido', quem };
  // A reserva (parte 7): outra pessoa, que aceita na máquina dela.
  const reserva = pedido.reserva !== undefined ? (pedido.reserva === null ? null : String(pedido.reserva)) : (s.reserva?.quem ?? null);
  if (reserva !== null && !/^[1-9][0-9]*$/.test(reserva)) return { ok: false, erro: 'quem-invalido', quem: reserva };
  if (reserva !== null && reserva === quem) return { ok: false, erro: 'mesma-pessoa-nas-duas', quem };
  let intervalo = s.intervaloDaCopia ?? INTERVALO_DA_COPIA;
  if (pedido.intervaloDaCopia !== undefined) {
    const n = Number(pedido.intervaloDaCopia);
    if (!Number.isInteger(n) || n < INTERVALO_DA_COPIA_MINIMO || n > INTERVALO_DA_COPIA_MAXIMO) {
      return { ok: false, erro: 'intervalo-invalido', minimo: INTERVALO_DA_COPIA_MINIMO, maximo: INTERVALO_DA_COPIA_MAXIMO };
    }
    intervalo = n;
  }
  const mudaAReserva = reserva !== (s.reserva?.quem ?? null);
  // Pôr ou tirar a reserva muda a oferta da principal (o túnel da cópia).
  const mudaOQueRoda = versao !== s.versao || quem !== s.quem || variante !== (s.variante ?? 'vanilla') || (mudaAReserva && (reserva === null) !== (s.reserva == null));
  if (mudaOQueRoda && RODANDO.has(s.estado)) return { ok: false, erro: 'desligue-antes', estado: s.estado };
  const versaoDoMundoOk = versao !== s.versao ? conferirAVersaoDoMundo(s, versao, pedido.mundo) : { ok: true };
  if (!versaoDoMundoOk.ok) return versaoDoMundoOk;
  // A dona não sai de baixo de si mesma: trocar a reserva que é a dona pede passar antes.
  if (mudaAReserva && donaDe(s) === 'reserva') return { ok: false, erro: 'passe-antes', dona: 'reserva' };
  if (mudaOQueRoda && donaDe(s) === 'reserva' && quem !== s.quem) return { ok: false, erro: 'passe-antes', dona: 'reserva' };

  const configMudou = JSON.stringify(config) !== JSON.stringify(s.config);
  if (versaoDoMundoOk.novo) comecarMundoNovo(s, receita);
  s.config = config;
  s.versao = versao;
  s.quem = quem;
  s.variante = variante;
  s.intervaloDaCopia = intervalo;
  if (mudaAReserva) {
    s.reserva = reserva === null ? null : { quem: reserva, aceite: 'sem-maquina', motivo: null, porta: null, oferta: null, estado: null };
    s.copiaRecebida = null;
  }
  const papeis = [...(mudaOQueRoda ? ['principal'] : []), ...((mudaOQueRoda || mudaAReserva) && s.reserva ? ['reserva'] : [])];
  for (const papel of papeis) {
    if (quemOpera(s, papel) === null) {
      marcarAceite(s, papel, 'sem-maquina');
      if (papel === 'principal') { s.porta = null; s.oferta = null; }
    } else if (variante === 'com-mods' && !s.pack) {
      marcarAceite(s, papel, 'sem-pack');
    } else if (versao === null) {
      marcarAceite(s, papel, 'sem-versao');
    } else {
      const r = pedirAMaquina(servidores, s, papel);
      if (!r.ok) return r;
    }
  }
  if (configMudou && !mudaOQueRoda && aceiteDe(s, donaDe(s)) === 'aceito') {
    if (RODANDO.has(s.estado)) s.precisaReiniciar = true;
    avisarADona(s, { op: 'configurar' });
  }
  gravarServidores(servidores);
  return { ok: true, servidor: publico(s) };
}

/** Um aviso à máquina que é a dona agora (a principal, sem reserva). */
function avisarADona(s, carga) {
  mundo.maquinas.avisar({ servidor: s.id, papel: donaDe(s), carga });
}

function opLigar(s, servidores) {
  if (s.variante === 'com-mods' && !s.pack) return { ok: false, erro: 'sem-pack' };
  if (!s.versao) return { ok: false, erro: 'sem-versao' };
  const dona = donaDe(s);
  if (!quemOpera(s, dona)) return { ok: false, erro: 'sem-maquina' };
  s.ligar = true;
  let esperando = null;
  const aceite = aceiteDe(s, dona);
  if (aceite === 'aceito') {
    avisarADona(s, { op: 'ligar' });
  } else if (aceite === 'esperando') {
    esperando = 'aceite';
  } else {
    // Parada, revogada ou recusada: ligar de novo é perguntar de novo.
    const r = pedirAMaquina(servidores, s, dona);
    if (!r.ok) return r;
    esperando = 'aceite';
  }
  gravarServidores(servidores);
  return { ok: true, ...(esperando ? { esperando } : {}), servidor: publico(s) };
}

function opDesligar(s, servidores) {
  s.ligar = false;
  const dona = donaDe(s);
  let semMaquina = null;
  if (aceiteDe(s, dona) === 'aceito') {
    avisarADona(s, { op: 'desligar' });
  } else if (!['desligado', 'caiu'].includes(s.estado) || s.chamando) {
    // **Ninguém no servidor SEELE para ouvir o «desligar»** (a máquina não
    // respondeu ainda): a ordem fica no plano. A máquina que voltar pergunta
    // o plano e desliga; a que não voltar para sozinha em até 10 min sem
    // quem hospeda. A resposta diz isso, em vez de nada.
    semMaquina = { papel: dona, quem: quemOpera(s, dona) };
    s.estado = 'desligado';
    s.jogadores = [];
  }
  gravarServidores(servidores);
  return { ok: true, ...(semMaquina ? { semMaquina } : {}), servidor: publico(s) };
}

/**
 * **A passagem avisada** (parte 7): a dona para o jogo (que salva o mundo
 * inteiro), empacota e manda a cópia final; quando a outra máquina diz que a
 * recebeu igual, a posse passa — ela liga, e a de antes desliga. Nada se
 * perde; quem joga reconecta no mesmo `localhost:<porta>`.
 */
function opPassar(s, servidores) {
  const de = donaDe(s);
  const para = outroPapel(de);
  if (!s.reserva) return { ok: false, erro: 'sem-reserva' };
  if (aceiteDe(s, de) !== 'aceito' && s.chamando) return { ok: false, erro: 'esperando-as-maquinas', papel: de, aceite: aceiteDe(s, de) };
  if (aceiteDe(s, para) !== 'aceito') return { ok: false, erro: 'outra-sem-aceite', papel: para, aceite: aceiteDe(s, para) };
  if (s.passando) return { ok: false, erro: 'ja-passando', para: s.passando.para };
  s.passando = { para, desde: mundo.agora() };
  if (aceiteDe(s, de) === 'aceito') {
    avisarADona(s, { op: 'passar' });
  } else if (s.copia && s.copiaRecebida?.sha256 === s.copia.sha256) {
    // A dona não está aí, e a outra já tem a última cópia: passa agora.
    passarAPosse(s, para, null);
  } else {
    s.passando = null;
    return { ok: false, erro: 'dona-fora-e-sem-copia', papel: de };
  }
  gravarServidores(servidores);
  return { ok: true, servidor: publico(s) };
}

function opConsole(s, pedido) {
  const comando = pedido.comando;
  if (typeof comando !== 'string' || comando.trim() === '' || /[\u0000-\u001f\u007f]/.test(comando) || bytesDe(comando) > 256) {
    return { ok: false, erro: 'comando-invalido' };
  }
  if (s.estado !== 'ligado') return { ok: false, erro: 'servidor-desligado', estado: s.estado };
  avisarADona(s, { op: 'console', comando });
  return { ok: true };
}

// ---------------------------------------------------------------- o modpack

/**
 * **O pack lido vira o pack do servidor de jogo** (pelo link ou pelo envio):
 * o índice conferido pelas regras da spec, o instalador do loader que ele
 * pede, e a variante e a versão que ele define. Se já há máquina, pede o
 * aceite de novo: o pack, o loader e os comandos mudaram o que roda.
 */
function usarPack(s, servidores, pack, texto, escolha) {
  const receita = receitaPorId(s.receita);
  const lido = lerIndice(texto, receita);
  if (!lido.ok) return lido;
  const indice = lido.indice;
  const doMundo = indice.mc !== s.versao ? conferirAVersaoDoMundo(s, indice.mc, escolha) : { ok: true };
  if (!doMundo.ok) return doMundo;
  let instalador = null;
  if (indice.loader) {
    const r = instaladorDoLoader(receita, indice.loader, indice.mc, url => mundo.buscar(url));
    if (!r.ok) return r;
    instalador = r.artefato;
  }
  const antes = s.pack;
  s.pack = { ...pack, mc: indice.mc, loader: indice.loader, instalador, resumo: resumoDoIndice(indice) };
  if (antes?.caminho && antes.caminho !== s.pack.caminho) volume.apagar(antes.caminho);
  if (doMundo.novo) comecarMundoNovo(s, receita);
  s.variante = 'com-mods';
  s.versao = indice.mc;
  s.resolvido = s.resolvido?.versao === indice.mc ? s.resolvido : null;
  if (s.quem) {
    const r = pedirAsDuas(servidores, s);
    if (!r.ok) return r;
  }
  gravarServidores(servidores);
  return { ok: true, servidor: publico(s) };
}

/** O pack pelo link do Modrinth: a API dá o .mrpack e o sha512; o produto o abre. */
function opPackLink(s, servidores, pedido) {
  if (RODANDO.has(s.estado)) return { ok: false, erro: 'desligue-antes', estado: s.estado };
  const receita = receitaPorId(s.receita);
  if (!receita.modpack) return { ok: false, erro: 'variante-indisponivel', variante: 'com-mods' };
  const link = lerLinkDoModrinth(pedido.link);
  if (!link.ok) return link;
  const url = `${receita.modpack.api}/project/${link.slug}/version`;
  const lido = buscarJson(url => mundo.buscar(url), url);
  if (!lido.ok) return lido;
  const escolhida = escolherVersaoDoModrinth(lido.json, link.versao, receita);
  if (!escolhida.ok) return escolhida;
  const arquivo = escolhida.arquivo;
  if (arquivo.tamanho > TETO_DO_PACK_PELO_LINK) {
    return { ok: false, erro: 'pack-grande-para-o-link', tamanho: arquivo.tamanho, teto: TETO_DO_PACK_PELO_LINK };
  }
  const r = mundo.buscarPack({ url: arquivo.url, sha512: arquivo.sha512, tamanho: arquivo.tamanho });
  if (!r || r.ok !== true) return { ...(r ?? {}), ok: false, erro: r?.erro ?? 'busca-falhou', url: arquivo.url };
  return usarPack(s, servidores, {
    origem: 'link', link: `${receita.modpack.pagina}${link.slug}`, pagina: `${receita.modpack.pagina}${link.slug}/version/${escolhida.versao.id}`,
    url: arquivo.url, sha512: r.sha512, bytes: r.bytes, versaoDoModrinth: escolhida.versao.id,
  }, r.indice, pedido.mundo);
}

/** O envio do .mrpack: a espera no volume (o produto confere os bytes e o teto de 64 MiB). */
function opPackEnviar(s) {
  if (RODANDO.has(s.estado)) return { ok: false, erro: 'desligue-antes', estado: s.estado };
  const receita = receitaPorId(s.receita);
  if (!receita.modpack) return { ok: false, erro: 'variante-indisponivel', variante: 'com-mods' };
  const n = Number(dados.envios ?? '0') + 1;
  dados.envios = String(n);
  const token = `${s.id}-${mundo.agora()}-${n}`;
  const caminho = `packs/${s.id}/${token}.mrpack`;
  if (!volume.esperar(token, caminho, ['mrpack'], PRAZO_DO_ENVIO)) return { ok: false, erro: 'espera-recusada' };
  dados['envio:' + token] = JSON.stringify({ id: s.id, caminho });
  return { ok: true, token, teto: receita.modpack.teto };
}

/** O envio chegou: o produto abre o pack do volume, e ele vira o pack do servidor. */
function opPackChegou(s, servidores, pedido) {
  const envio = lerJson(dados['envio:' + String(pedido.token ?? '')]);
  if (!envio || envio.id !== s.id) return { ok: false, erro: 'envio-desconhecido', token: pedido.token ?? null };
  delete dados['envio:' + pedido.token];
  // Manter a versão: o pack que chegou não é usado, e sai do volume.
  if (pedido.mundo === 'manter') {
    volume.apagar(envio.caminho);
    return { ok: true, descartado: true, servidor: publico(s) };
  }
  const r = volume.pack(envio.caminho);
  if (!r || r.ok !== true) {
    volume.apagar(envio.caminho);
    return { ok: false, ...(r ?? {}), erro: r?.erro ?? 'pack-nao-chegou' };
  }
  const usado = usarPack(s, servidores, { origem: 'enviado', caminho: envio.caminho, sha512: r.sha512, bytes: r.bytes }, r.indice, pedido.mundo);
  if (!usado.ok && usado.erro === 'mundo-mais-novo') {
    // **O pack fica esperando a escolha** (um mundo novo, ou manter a
    // versão): enviar de novo 64 MiB por uma pergunta seria o custo errado.
    dados['envio:' + pedido.token] = JSON.stringify(envio);
    return { ...usado, token: pedido.token };
  }
  if (!usado.ok) volume.apagar(envio.caminho);
  return usado;
}

/** **O pack para quem pede** (quem joga, pelo `SeeleUI.salvar`, e a máquina, pelo `trazer`): o caminho no volume. */
function opPackLer(pedido) {
  const s = lerServidores()[pedido.id];
  if (!s) return { ok: false, erro: 'servidor-desconhecido', servidor: pedido.id ?? null };
  if (s.pack?.origem !== 'enviado') return { ok: false, erro: 'sem-pack-enviado' };
  const caminho = volume.servir(s.pack.caminho);
  if (!caminho) return { ok: false, erro: 'pack-sumiu' };
  return { ok: true, volume: caminho };
}

// ---------------------------------------------------------------- a máquina

/** A oferta e a porta de um papel. */
function daOfertaDe(s, papel) {
  return papel === 'reserva' ? { oferta: s.reserva?.oferta ?? null, porta: s.reserva?.porta ?? null } : { oferta: s.oferta, porta: s.porta };
}

/**
 * O que a máquina aceita precisa para baixar, configurar e rodar — **as duas**
 * (parte 7): a que não é a dona baixa e prepara também, para assumir rápido,
 * e não liga (`dona: false`, `ligar: false`).
 */
function planoDe(s, papel = 'principal') {
  const receita = receitaPorId(s.receita);
  const { oferta, porta } = daOfertaDe(s, papel);
  const dona = donaDe(s) === papel;
  const tunelDeCopia = oferta.tuneis.find(t => t.nome === tunelDaCopia(s.id)) ?? null;
  return {
    servidor: s.id,
    receita: receita.id,
    versao: s.versao,
    artefatos: s.resolvido.artefatos,
    porPlataforma: s.resolvido.porPlataforma,
    semJava: s.resolvido.semJava,
    arquivoDeConfig: receita.configuracao.arquivo,
    propriedades: escreverPropriedades(receita, s.config, porta, s.mundo ?? null),
    termos: receita.termos.filter(t => t.arquivo).map(t => ({ id: t.id, arquivo: t.arquivo, conteudo: t.conteudo })),
    rodar: oferta.rodar,
    // Os comandos de alguns sistemas (decisão W1): a máquina escolhe o par
    // dela (`comandosDaMaquina`), como o produto escolhe o que aceita.
    porSistema: oferta.por_sistema ?? [],
    tunel: oferta.tuneis[0],
    ligar: s.ligar && dona,
    // A reserva (parte 7): quem esta máquina é, se é a dona, e a cópia.
    papel,
    dona,
    copia: {
      tunel: tunelDeCopia,
      intervalo: s.intervaloDaCopia ?? INTERVALO_DA_COPIA,
      // A dona só copia quando há outra máquina aceita para receber.
      comOutra: aceiteDe(s, outroPapel(papel)) === 'aceito',
      pasta: s.mundo ?? receita.mundo.pasta,
      // A última cópia que esta máquina recebeu e disse que chegou.
      recebida: s.copiaRecebida?.por === papel ? s.copiaRecebida.sha256 : null,
    },
    ...(s.variante === 'com-mods' && s.pack ? planoDoPack(s, oferta) : {}),
  };
}

/** O que a máquina precisa do pack: de onde ele vem, o hash, o loader e o passo de instalar. */
function planoDoPack(s, oferta) {
  const p = s.pack;
  const extras = [];
  if (p.instalador) extras.push(p.instalador);
  if (p.origem === 'link') extras.push({ id: 'pack', nome: 'pack.mrpack', url: p.url, tamanho: p.bytes, hash: { algoritmo: 'sha512', hex: p.sha512 }, destino: 'pack.mrpack' });
  return {
    artefatos: [...s.resolvido.artefatos, ...extras],
    modpack: {
      origem: p.origem, destino: 'pack.mrpack', pedido: { op: 'pack-ler', id: s.id },
      sha512: p.sha512, bytes: p.bytes, mc: p.mc, loader: p.loader, instalar: oferta.instalar ?? null,
    },
  };
}

function daMaquina(contexto, pedido) {
  const servidores = lerServidores();
  const s = servidores[contexto.maquina.servidor];
  if (!s) return { ok: false, erro: 'servidor-desconhecido', servidor: contexto.maquina.servidor, ordem: 'desligar' };
  // **Uma dona por vez.** O anfitrião só deixa uma máquina aceita falar, e
  // diz o papel dela; a posse é desta metade.
  const papel = papelDe(s, contexto);
  if (!papel) {
    anotarFalha(s, 'maquina', 'nao-e-desta-maquina', { dados: { pessoa: contexto.person, papel: contexto.maquina.papel ?? null } });
    gravarServidores(servidores);
    return { ok: false, erro: 'nao-e-a-dona', ordem: 'desligar' };
  }
  const dona = donaDe(s) === papel;
  if (pedido.op === 'plano') {
    if (aceiteDe(s, papel) !== 'aceito' || !s.resolvido || !daOfertaDe(s, papel).oferta) return { ok: false, erro: 'sem-aceite' };
    return { ok: true, plano: planoDe(s, papel) };
  }
  if (pedido.op === 'estado') {
    if (!ESTADOS_DA_MAQUINA.has(pedido.estado)) return { ok: false, erro: 'estado-desconhecido', estado: pedido.estado ?? null };
    if (!dona) {
      // A outra máquina conta o dela à parte; um jogo de pé nela é a
      // principal que voltou com o processo vivo: desliga, e conta.
      if (s.reserva && papel === 'reserva') s.reserva.estado = pedido.estado;
      else s.estadoDaPrincipal = pedido.estado;
      const rodando = RODANDO.has(pedido.estado) && pedido.estado !== 'parando';
      gravarServidores(servidores);
      return rodando ? { ok: true, ordem: 'desligar', dona: false } : { ok: true, dona: false };
    }
    const antes = s.estado;
    s.estado = pedido.estado;
    if (Array.isArray(pedido.jogadores)) s.jogadores = pedido.jogadores.map(j => cortar(j, 32)).slice(0, 200);
    if (s.estado === 'desligado' || s.estado === 'caiu') s.jogadores = [];
    if (pedido.progresso !== undefined) s.progresso = pedido.progresso;
    if (Array.isArray(pedido.linhas)) s.linhas = pedido.linhas.map(l => cortar(l, 160)).slice(-TETO_DE_LINHAS);
    if (s.estado === 'ligando' || s.estado === 'desligado') s.precisaReiniciar = false;
    if (s.estado === 'caiu' && antes !== 'caiu') {
      // A queda de um jogo mais velho que o mundo diz isso, além da pilha.
      const doMundo = versaoDoMundo(s);
      const velha = doMundo && s.versao && maisVelha(s.versao, doMundo) === true;
      anotarFalha(s, 'jogo', 'o-jogo-caiu', { dados: { ...(pedido.saida ?? {}), versao: s.versao ?? null, ...(velha ? { versaoDoMundo: doMundo } : {}) } });
    }
    // **A versão que rodou o mundo** é a que chegou ao «Done».
    if (s.estado === 'ligado') s.versaoDoMundo = s.versao;
    if (s.chamando && s.estado !== 'esperando-maquina') s.chamando = null;
    // **A dona seguiu rodando sem quem hospeda** e foi religada sem desligar:
    // a tela diz quanto tempo, e quando.
    if (pedido.religada) s.religada = { quando: mundo.agora(), fora: Math.max(0, Number(pedido.religada.fora) || 0), papel };
    gravarServidores(servidores);
    // O jogo de pé quando ninguém o quer de pé desliga.
    if (RODANDO.has(s.estado) && !s.ligar && s.estado !== 'parando' && !s.passando) return { ok: true, ordem: 'desligar' };
    return { ok: true };
  }
  if (pedido.op === 'copia-pronta') {
    // Só a dona copia: a cópia de quem não é a dona seria um mundo velho por cima do novo.
    if (!dona) return { ok: false, erro: 'nao-e-a-dona', ordem: 'desligar' };
    s.copia = {
      quando: mundo.agora(), de: papel, codigo: String(pedido.codigo ?? ''), sha256: String(pedido.sha256 ?? ''),
      tamanho: Number(pedido.tamanho) || 0, final: pedido.final === true,
    };
    const para = outroPapel(papel);
    if (aceiteDe(s, para) === 'aceito') {
      mundo.maquinas.avisar({
        servidor: s.id, papel: para,
        carga: { op: 'copia', tunel: tunelDaCopia(s.id), codigo: s.copia.codigo, sha256: s.copia.sha256, tamanho: s.copia.tamanho, final: s.copia.final },
      });
    }
    gravarServidores(servidores);
    return { ok: true };
  }
  if (pedido.op === 'copia-recebida') {
    if (dona) return { ok: false, erro: 'e-a-dona' };
    s.copiaRecebida = { quando: mundo.agora(), sha256: String(pedido.sha256 ?? ''), por: papel, daCopiaDe: s.copia?.quando ?? null };
    // A passagem avisada fecha quando a outra tem a cópia final, igual.
    if (s.passando && s.passando.para === papel && s.copia?.final && s.copiaRecebida.sha256 === s.copia.sha256) {
      passarAPosse(s, papel, null);
    }
    gravarServidores(servidores);
    return { ok: true };
  }
  if (pedido.op === 'perdeu-a-posse') {
    // **A principal que voltou com o processo vivo** e o encerrou: contado, nunca calado.
    s.voltouRodando = (s.voltouRodando ?? 0) + 1;
    anotarFalha(s, 'reserva', 'voltou-rodando-sem-a-posse', { dados: { papel, pessoa: contexto.person, processoVivo: pedido.processoVivo === true } });
    gravarServidores(servidores);
    return { ok: true };
  }
  if (pedido.op === 'falha') {
    anotarFalha(s, 'maquina', cortar(pedido.erro ?? 'falhou', 64), { etapa: cortar(pedido.etapa ?? '', 32), papel, dados: pedido.dados ?? {} });
    if (s.passando && (pedido.etapa === 'copia' || pedido.etapa === 'receber-copia')) s.passando = null;
    gravarServidores(servidores);
    return { ok: true };
  }
  return { ok: false, erro: 'op-desconhecida', op: pedido.op ?? null };
}

// ---------------------------------------------------------------- as portas

globalThis.aoPedir = (textoDoContexto, textoDoPedido) => {
  const contexto = lerJson(textoDoContexto) ?? {};
  const pedido = lerJson(textoDoPedido);
  if (!pedido || typeof pedido !== 'object') return JSON.stringify({ ok: false, erro: 'pedido-invalido' });
  if (contexto.maquina) return JSON.stringify(daMaquina(contexto, pedido));

  const op = pedido.op;
  const acaoPedida = ACAO_DA_OP[op];
  if (contexto.acao && contexto.acao !== acaoPedida) return JSON.stringify({ ok: false, erro: 'acao-nao-serve', acao: contexto.acao, op: op ?? null });
  if (acaoPedida && contexto.acao !== acaoPedida) return JSON.stringify({ ok: false, erro: 'pede-a-acao', acao: acaoPedida });

  let resposta;
  if (op === 'estado') resposta = opEstado(contexto);
  else if (op === 'versoes') resposta = opVersoes(pedido);
  else if (op === 'pack-ler') resposta = opPackLer(pedido);
  else if (op === 'criar') resposta = opCriar(pedido, contexto);
  else if (acaoPedida) {
    const servidores = lerServidores();
    const s = servidores[pedido.id];
    if (!s) resposta = { ok: false, erro: 'servidor-desconhecido', servidor: pedido.id ?? null };
    else if (op === 'apagar') resposta = opApagar(s, servidores);
    else if (op === 'configurar') resposta = opConfigurar(s, servidores, pedido);
    else if (op === 'ligar') resposta = opLigar(s, servidores);
    else if (op === 'desligar') resposta = opDesligar(s, servidores);
    else if (op === 'passar') resposta = opPassar(s, servidores);
    else if (op === 'pack-link') resposta = opPackLink(s, servidores, pedido);
    else if (op === 'pack-enviar') resposta = opPackEnviar(s);
    else if (op === 'pack-chegou') resposta = opPackChegou(s, servidores, pedido);
    else resposta = opConsole(s, pedido);
  } else resposta = { ok: false, erro: 'op-desconhecida', op: op ?? null };
  return JSON.stringify(resposta);
};

/** As paradas que não são a pessoa da máquina parando: a reserva pode assumir. */
const QUEDAS = Object.freeze(['saiu', 'metade-falhou']);
const MOMENTOS = Object.freeze(['MaquinaAceitou', 'MaquinaRecusou', 'MaquinaParou', 'MaquinaSumiu', 'MaquinaVoltou']);

globalThis.aoAcontecer = (momento, textoDaCarga) => {
  if (momento === 'MetadeSubiu') {
    metadeSubiu(lerJson(textoDaCarga) ?? {});
    return;
  }
  if (!MOMENTOS.includes(momento)) return;
  const carga = lerJson(textoDaCarga) ?? {};
  const servidores = lerServidores();
  const s = servidores[carga.servidor];
  if (!s) {
    mundo.registrar(`${momento} de um servidor de jogo que não existe mais: ${JSON.stringify(carga)}`);
    return;
  }
  const papel = PAPEIS.includes(carga.papel) ? carga.papel : 'principal';
  const pessoa = String(carga.pessoa ?? '');
  if (pessoa !== quemOpera(s, papel)) {
    // A máquina de antes, dispensada por um pedido a outra pessoa: conta, e não mexe na de agora.
    anotarFalha(s, 'aceite', carga.motivo ?? momento, { papel, dados: { pessoa, momento } });
    gravarServidores(servidores);
    return;
  }
  const dona = donaDe(s) === papel;
  if (momento === 'MaquinaAceitou') {
    marcarAceite(s, papel, 'aceito');
    if (dona) avisarADona(s, { op: s.ligar ? 'ligar' : 'preparar' });
    else mundo.maquinas.avisar({ servidor: s.id, papel, carga: { op: 'preparar' } });
    // A dona não precisa de aviso: a cópia agendada relê o plano a cada vez
    // (e um aviso aqui tomaria o lugar de um «ligar» ainda na fila da taxa).
  } else if (momento === 'MaquinaRecusou' && carga.motivo === 'nao-esta-aqui' && s.chamando) {
    // **Chamada de volta, e a pessoa ainda não está no servidor SEELE**: o
    // SEELE lembra o pedido, e ela ouve de novo ao chegar (MaquinaVoltou). O
    // «ligar» fica; o cartão diz que a máquina está fora.
    marcarAceite(s, papel, 'fora', 'nao-esta-aqui');
  } else if (momento === 'MaquinaRecusou') {
    marcarAceite(s, papel, 'recusado', String(carga.motivo ?? ''));
    if (dona) s.ligar = false;
    if (dona && s.estado === 'esperando-maquina') s.estado = 'desligado';
    // O momento vai junto: «pelo-dono» é o mesmo nome para recusar o pedido e
    // para DESLIGAR depois de aceitar, e a tela diz qual dos dois foi.
    anotarFalha(s, 'aceite', String(carga.motivo ?? ''), { papel, momento: 'recusou', dados: { pessoa } });
  } else if (momento === 'MaquinaParou') {
    const motivo = String(carga.motivo ?? '');
    marcarAceite(s, papel, 'parado', motivo);
    anotarFalha(s, 'aceite', motivo, { papel, momento: 'parou', dados: { pessoa } });
    if (dona) {
      // **A dona que caiu (saiu) com uma reserva de pé não desliga o servidor
      // de jogo**: o prazo corre, e MaquinaSumiu decide. Uma parada da pessoa
      // da máquina (DESLIGAR, REVOGAR) desliga, como sempre.
      const temReserva = aceiteDe(s, outroPapel(papel)) === 'aceito';
      // A metade que falhou (metade-falhou) também não foi a pessoa parando:
      // com reserva, o prazo corre do mesmo jeito (revisão final, M12).
      // **A dona que saiu sem reserva também não desliga** (e2e da API 8,
      // 31/10): «saiu» é a conexão que caiu — inclusive a de todo mundo quando
      // o servidor SEELE para —, e a metade de máquina segue rodando órfã até
      // 10 min. O «ligar» fica, ela é chamada de volta (MaquinaVoltou, ou
      // MetadeSubiu num servidor que reiniciou), e o cartão espera a máquina.
      const caiu = motivo === 'saiu';
      if (!(caiu || (QUEDAS.includes(motivo) && temReserva))) s.ligar = false;
      s.estado = caiu && s.ligar ? 'esperando-maquina' : 'desligado';
      s.jogadores = [];
    } else if (papel === 'reserva' && s.reserva) {
      s.reserva.estado = null;
    }
  } else if (momento === 'MaquinaSumiu') {
    sumiu(s, papel, Number(carga.segundos) || 0);
  } else if (momento === 'MaquinaVoltou') {
    // **A que volta não liga sozinha**: é chamada de novo, e o plano diz a ela
    // quem é a dona. Se não é ela, ela desliga o que tiver de pé.
    // A oferta guardada, igual à aceita: a metade que seguiu rodando é religada.
    const r = chamarDeVolta(servidores, s, papel);
    if (!r.ok) anotarFalha(s, 'reserva', r.erro, { papel, dados: r });
  }
  gravarServidores(servidores);
};

/**
 * **A dona sumiu além do prazo** (MaquinaSumiu): com a outra máquina aceita
 * e com uma cópia, a posse passa a ela, que liga com a última cópia; o tempo
 * de jogo perdido é o que passou entre essa cópia e a queda, e todos veem.
 * Sem cópia, não passa — ligar um mundo vazio seria um segundo mundo — e a
 * tela diz por quê.
 */
function sumiu(s, papel, segundos) {
  if (donaDe(s) !== papel) return;
  const outra = outroPapel(papel);
  if (!s.ligar) return;
  if (aceiteDe(s, outra) !== 'aceito') {
    if (s.reserva) anotarFalha(s, 'reserva', 'outra-sem-aceite', { papel: outra, dados: { aceite: aceiteDe(s, outra) } });
    return;
  }
  if (!s.copiaRecebida || s.copiaRecebida.por !== outra) {
    anotarFalha(s, 'reserva', 'reserva-sem-copia', { papel: outra, dados: {} });
    return;
  }
  const caiuEm = mundo.agora() - segundos;
  const daCopia = s.copiaRecebida.daCopiaDe ?? s.copiaRecebida.quando;
  const perdido = { segundos: Math.max(0, caiuEm - daCopia), quando: mundo.agora(), de: papel, para: outra, copiaDe: daCopia };
  passarAPosse(s, outra, perdido);
  anotarFalha(s, 'reserva', 'a-reserva-assumiu', { papel: outra, dados: { perdidoSegundos: perdido.segundos } });
}

})();
