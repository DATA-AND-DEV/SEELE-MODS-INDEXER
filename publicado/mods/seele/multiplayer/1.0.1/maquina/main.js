/* Gerado por ferramentas/build.mjs a partir de fonte/ e receitas/. API 8. Não edite aqui. */
(() => {
"use strict";
const RECEITAS = [{"formato":1,"id":"minecraft","nome":"Minecraft","edicao":"Java Edition","icone":"MC","versao":"1.0.0","descricao":"O servidor oficial da Mojang, com o Java que cada versão pede.","variantes":{"vanilla":{"nome":"Vanilla","descricao":"Minecraft puro, sem mods. Você escolhe só a versão."},"com-mods":{"nome":"Com mods","descricao":"Um modpack do Modrinth define a versão, o loader e os mods."}},"versoes":{"fonte":"mojang","manifesto":"https://piston-meta.mojang.com/mc/game/version_manifest_v2.json","tipos":["release"],"quantas":24},"artefatos":[{"id":"servidor","fonte":"mojang-servidor","destino":"server.jar"},{"id":"java","fonte":"adoptium","destino":"java","consulta":"https://api.adoptium.net/v3/assets/latest/{major}/hotspot?image_type=jre&vendor=eclipse","majorPadrao":8,"plataformas":[{"plataforma":"windows-x64","os":"windows","arquitetura":"x64","raiz":"{release}-jre"},{"plataforma":"mac-aarch64","os":"mac","arquitetura":"aarch64","raiz":"{release}-jre/Contents/Home","senaoHouver":"mac-x64"},{"plataforma":"mac-x64","os":"mac","arquitetura":"x64","raiz":"{release}-jre/Contents/Home"},{"plataforma":"linux-x64","os":"linux","arquitetura":"x64","raiz":"{release}-jre"},{"plataforma":"linux-aarch64","os":"linux","arquitetura":"aarch64","raiz":"{release}-jre"}]}],"origens":["piston-data.mojang.com","github.com","objects.githubusercontent.com","release-assets.githubusercontent.com"],"dominiosDoJogo":["sessionserver.mojang.com","api.minecraftservices.com","api.mojang.com"],"rodar":{"comando":"java/bin/java","argumentos":["-Xms1G","-Xmx2G","-jar","server.jar","nogui"]},"rede":{"protocolo":"tcp","portaPadrao":25565},"disco":{"mundoMaximo":8589934592},"termos":[{"id":"eula","titulo":"EULA do Minecraft (Mojang)","url":"https://aka.ms/MinecraftEULA","arquivo":"eula.txt","conteudo":"eula=true\n"}],"configuracao":{"arquivo":"server.properties","formato":"properties","campos":[{"chave":"nome","aba":"geral","forma":"segmentos","rotulo":"Nome que aparece na lista do jogo","ajuda":"Cada palavra tem a sua cor, entre as 16 do Minecraft.","padrao":[{"texto":"Servidor do SEELE","cor":"aqua"}],"tamanhoMaximo":59,"maximoSegmentos":6,"opcoes":[{"valor":"white","rotulo":"Branco","amostra":"#FFFFFF","codigo":"f"},{"valor":"gray","rotulo":"Cinza","amostra":"#AAAAAA","codigo":"7"},{"valor":"dark_gray","rotulo":"Cinza-escuro","amostra":"#555555","codigo":"8"},{"valor":"black","rotulo":"Preto","amostra":"#000000","codigo":"0"},{"valor":"yellow","rotulo":"Amarelo","amostra":"#FFFF55","codigo":"e"},{"valor":"gold","rotulo":"Dourado","amostra":"#FFAA00","codigo":"6"},{"valor":"red","rotulo":"Vermelho","amostra":"#FF5555","codigo":"c"},{"valor":"dark_red","rotulo":"Vermelho-escuro","amostra":"#AA0000","codigo":"4"},{"valor":"light_purple","rotulo":"Rosa","amostra":"#FF55FF","codigo":"d"},{"valor":"dark_purple","rotulo":"Roxo","amostra":"#AA00AA","codigo":"5"},{"valor":"blue","rotulo":"Azul","amostra":"#5555FF","codigo":"9"},{"valor":"dark_blue","rotulo":"Azul-escuro","amostra":"#0000AA","codigo":"1"},{"valor":"aqua","rotulo":"Ciano","amostra":"#55FFFF","codigo":"b"},{"valor":"dark_aqua","rotulo":"Ciano-escuro","amostra":"#00AAAA","codigo":"3"},{"valor":"green","rotulo":"Verde","amostra":"#55FF55","codigo":"a"},{"valor":"dark_green","rotulo":"Verde-escuro","amostra":"#00AA00","codigo":"2"}]},{"chave":"maximo","aba":"geral","grupo":"regras","forma":"numero","rotulo":"Máx. jogadores","padrao":10,"minimo":1,"maximo":100},{"chave":"dificuldade","aba":"geral","grupo":"regras","forma":"escolha","rotulo":"Dificuldade","padrao":"normal","opcoes":[{"valor":"peaceful","rotulo":"Pacífica"},{"valor":"easy","rotulo":"Fácil"},{"valor":"normal","rotulo":"Normal"},{"valor":"hard","rotulo":"Difícil"}]},{"chave":"modo","aba":"geral","grupo":"regras","forma":"escolha","rotulo":"Modo","padrao":"survival","opcoes":[{"valor":"survival","rotulo":"Sobrevivência"},{"valor":"creative","rotulo":"Criativo"},{"valor":"adventure","rotulo":"Aventura"},{"valor":"spectator","rotulo":"Espectador"}]},{"chave":"pvp","aba":"geral","forma":"interruptor","rotulo":"PvP","padrao":true},{"chave":"hardcore","aba":"jogadores","forma":"interruptor","rotulo":"Hardcore","ajuda":"Quem morre vira espectador até o mundo acabar.","padrao":false},{"chave":"protecao","aba":"jogadores","grupo":"convivio","forma":"numero","rotulo":"Proteção em volta do nascimento","ajuda":"Em blocos. Só quem é operador constrói ali.","padrao":16,"minimo":0,"maximo":64},{"chave":"inativo","aba":"jogadores","grupo":"convivio","forma":"numero","rotulo":"Tirar quem fica parado","ajuda":"Em minutos. Zero é nunca.","padrao":0,"minimo":0,"maximo":120}],"propriedades":{"motd":"{nome}","max-players":"{maximo}","difficulty":"{dificuldade}","gamemode":"{modo}","pvp":"{pvp}","hardcore":"{hardcore}","spawn-protection":"{protecao}","player-idle-timeout":"{inativo}","server-ip":"127.0.0.1","server-port":"{porta}","online-mode":"true","enable-rcon":"false","enable-query":"false"}},"modpack":{"formato":"modrinth","teto":67108864,"api":"https://api.modrinth.com/v2","pagina":"https://modrinth.com/modpack/","cdn":"cdn.modrinth.com","dominios":["cdn.modrinth.com","github.com","raw.githubusercontent.com","gitlab.com"],"configuracoesDoPack":["default-server.properties"],"loaders":{"fabric-loader":{"nome":"Fabric","medido":true,"instalador":{"fonte":"fixo","destino":"fabric-installer.jar","url":"https://maven.fabricmc.net/net/fabricmc/fabric-installer/1.1.2/fabric-installer-1.1.2.jar","hash":{"algoritmo":"sha512","hex":"3cbe7b69498c44d814fc95e71cd9ce9c12c45a9e1dcf01085cb3e9aaf6fe63134b701065167be1fa6e4c2df19dfa5400bc5b6b1b7fb5e99e334d24dcdca55c20"},"tamanho":212123},"instalar":["-jar","fabric-installer.jar","server","-mcversion","{mc}","-loader","{loader}"],"rodar":["-Xms1G","-Xmx2G","-jar","fabric-server-launch.jar","nogui"],"dominiosDoJogo":["meta.fabricmc.net","maven.fabricmc.net"],"disco":134217728},"quilt-loader":{"nome":"Quilt","medido":false,"instalador":{"fonte":"fixo","destino":"quilt-installer.jar","url":"https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/0.15.1/quilt-installer-0.15.1.jar","hash":{"algoritmo":"sha512","hex":"f001e6e5ee5bed04e8f51a5519fae03874ecf8c7ece0db390896b5a6ea5fdb4a5b43abd77d0c6be5902d846d90cf032167d86af09253e3965be6480181fe07eb"},"tamanho":8734533},"instalar":["-jar","quilt-installer.jar","install","server","{mc}","{loader}","--install-dir=."],"rodar":["-Xms1G","-Xmx2G","-jar","quilt-server-launch.jar","nogui"],"dominiosDoJogo":["meta.quiltmc.org","maven.quiltmc.org","maven.fabricmc.net"],"disco":134217728},"forge":{"nome":"Forge","medido":true,"instalador":{"fonte":"reposilite","destino":"forge-installer.jar","url":"https://maven.minecraftforge.net/net/minecraftforge/forge/{mc}-{loader}/forge-{mc}-{loader}-installer.jar","detalhes":"https://maven.minecraftforge.net/api/maven/details/releases/net/minecraftforge/forge/{mc}-{loader}/forge-{mc}-{loader}-installer.jar","algoritmo":"sha256"},"instalar":["-jar","forge-installer.jar","--installServer"],"rodar":["-Xms1G","-Xmx2G","@libraries/net/minecraftforge/forge/{mc}-{loader}/unix_args.txt","nogui"],"porSistema":[{"plataformas":["windows-x64"],"comando":"java/bin/java.exe","rodar":["-Xms1G","-Xmx2G","@libraries/net/minecraftforge/forge/{mc}-{loader}/win_args.txt","nogui"]}],"dominiosDoJogo":["maven.minecraftforge.net","libraries.minecraft.net","piston-data.mojang.com","piston-meta.mojang.com","launchermeta.mojang.com"],"disco":536870912},"neoforge":{"nome":"NeoForge","medido":true,"instalador":{"fonte":"reposilite","destino":"neoforge-installer.jar","url":"https://maven.neoforged.net/releases/net/neoforged/neoforge/{loader}/neoforge-{loader}-installer.jar","detalhes":"https://maven.neoforged.net/api/maven/details/releases/net/neoforged/neoforge/{loader}/neoforge-{loader}-installer.jar","algoritmo":"sha256"},"instalar":["-jar","neoforge-installer.jar","--install-server"],"rodar":["-Xms1G","-Xmx2G","@libraries/net/neoforged/neoforge/{loader}/unix_args.txt","nogui"],"porSistema":[{"plataformas":["windows-x64"],"comando":"java/bin/java.exe","rodar":["-Xms1G","-Xmx2G","@libraries/net/neoforged/neoforge/{loader}/win_args.txt","nogui"]}],"dominiosDoJogo":["maven.neoforged.net","libraries.minecraft.net","piston-data.mojang.com","piston-meta.mojang.com","launchermeta.mojang.com"],"disco":536870912}}},"mundo":{"pasta":"world","salvar":[{"console":"save-off"},{"console":"save-all flush","esperar":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: Saved the game","prazo":60},{"copiar":"world"},{"console":"save-on"}]},"saida":{"pronto":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: Done \\(","entrou":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: ([A-Za-z0-9_]{1,16}) joined the game$","saiu":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: ([A-Za-z0-9_]{1,16}) left the game$","parar":{"console":"stop","esperar":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: Stopping the server","prazo":60}}}];
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

// ---- adaptador.js: a única porta para a API da máquina ----
//
// **Todo nome da API 8 que a metade de máquina chama está aqui, e só aqui.**
// Os nomes são os que o SEELE entregou nas partes 3 e 4 (api/v8.json,
// «metade-de-maquina», copiado em test/contrato/api-v8.json):
//
//   maquina.servidor, maquina.oferta, maquina.plataforma
//   maquina.pedir(valor) -> Promise<texto>       maquina.aoAviso(fn(carga em texto))
//   maquina.aoParar(fn(motivo))                 maquina.aoReconectar(fn({ fora }))
//   maquina.porta.servir({ nome, protocolo, porta }) / parar(nome) / quedas(nome)
//   maquina.programa.baixar({ url, sha1|sha256|sha512, tamanho, destino, aoProgresso })
//   maquina.programa.escrever({ destino, texto })
//   maquina.programa.desempacotar({ arquivo, destino, raiz, mesclar })
//   maquina.programa.trazer({ pedido, destino }) -> { destino, tamanho, hash, jaEstava }
//   maquina.programa.ler({ arquivo }) -> texto
//   maquina.programa.rodar({ comando, argumentos, pasta }) -> processo
//     processo.aoLinha(fn(linha, fluxo)) / aoSair(fn(fim)) / fim / escrever(texto) / matar()
//   maquina.programa.recusas() -> Promise<{ nome: vezes }>
//   maquina.programa.empacotar({ origem, arquivo }) -> { arquivo, tamanho, sha256, arquivos, bytes, linksPulados }
//   maquina.programa.oferecerCopia({ arquivo, porta }) -> { codigo, tamanho, sha256, porta }
//   maquina.programa.receberCopia({ tunel, codigo, sha256, tamanho, destino, aoProgresso })
//     -> { destino, tamanho, sha256, retomadas, jaEstavam, caminho }
//
// **Uma metade de máquina é um servidor de jogo**: o produto sobe uma por
// (MOD, servidor), já presa à pasta daquele servidor. Nenhuma chamada leva o
// servidor; quem precisa do nome lê `servidor`.
//
// O que o resto da metade de máquina vê:
//
//   servidor                                        -> o servidor de jogo desta metade
//   plataforma()                                    -> 'mac-aarch64' | 'windows-x64' | ...
//   baixar({ url, hash, tamanho, destino, aoProgresso })  -> Promise
//   desempacotar({ arquivo, destino, raiz, mesclar }) -> Promise
//   trazer({ pedido, destino })                     -> Promise<{ jaEstava, ... }>: o pack da metade de servidor
//   ler(arquivo)                                    -> Promise<texto>
//   rodar({ comando, argumentos, pasta })           -> Promise<{ aoLinha, aoSair, escrever, encerrar }>
//   servirPorta({ nome, protocolo, porta })         -> Promise<{ fechar }>
//   escrever(caminho, texto)                        -> Promise
//   empacotar(origem, arquivo)                      -> Promise: a pasta do mundo num .tar.gz (parte 7)
//   oferecerCopia(arquivo, porta)                   -> Promise<{ codigo, tamanho, sha256 }>
//   receberCopia({ tunel, codigo, sha256, tamanho, destino }) -> Promise<{ sha256, caminho, ... }>
//   pedir(valor)                                    -> Promise<resposta da metade de servidor, já lida>
//   aoAviso(fn(servidor, carga já lida))
//   aoParar(fn(motivo))
//   aoReconectar(fn({ fora }))                      -> a volta de quem hospeda (sem ela, nada)
//   recusas()                                       -> Promise<{ nome: vezes }>
//   esperar(ms)                                     -> Promise
//   registrar(texto)

/** Uma promessa, mesmo de quem devolveu um valor ou lançou. */
const promessa = fn => {
  try {
    return Promise.resolve(fn());
  } catch (erro) {
    return Promise.reject(erro);
  }
};

/** JSON.parse que devolve o texto cru quando ele não é JSON. */
const lido = texto => {
  if (typeof texto !== 'string') return texto;
  try { return JSON.parse(texto); } catch { return texto; }
};

function criarAdaptador(g = globalThis) {
  const m = g.maquina;
  if (!m || !m.programa || !m.porta) {
    throw new Error('a metade de máquina subiu sem «maquina.programa» e «maquina.porta» da API 8');
  }
  return {
    servidor: String(m.servidor ?? ''),

    // O sistema desta máquina, já no nome das receitas.
    plataforma: () => String(m.plataforma ?? ''),

    baixar: ({ url, hash, tamanho, destino, aoProgresso }) => promessa(() => m.programa.baixar({
      url, [hash.algoritmo]: hash.hex, tamanho, destino, ...(aoProgresso ? { aoProgresso } : {}),
    })),

    desempacotar: ({ arquivo, destino, raiz, mesclar }) => promessa(() => m.programa.desempacotar({
      arquivo, destino, raiz, ...(mesclar ? { mesclar: true } : {}),
    })),

    // O pack que a metade de servidor guardou (parte 6): o produto o traz pelo
    // volume e só o grava com o hash do aceite.
    trazer: ({ pedido, destino }) => promessa(() => m.programa.trazer({ pedido, destino })),
    ler: arquivo => promessa(() => m.programa.ler({ arquivo })),

    rodar: ({ comando, argumentos, pasta }) => promessa(() => m.programa.rodar({ comando, argumentos, pasta }))
      .then(proc => ({
        aoLinha: fn => proc.aoLinha(linha => fn(linha)),
        // O fim do produto, na forma que a metade lê: o código, e se foi
        // morto a pedido (encerrar, ou a parada da metade).
        aoSair: fn => proc.aoSair(fim => fn({
          codigo: fim.codigo, sinal: fim.mortoAPedido ? 'morto-a-pedido' : null,
          linhasPerdidas: fim.linhasPerdidas, linhasNaoOuvidas: fim.linhasNaoOuvidas,
        })),
        escrever: texto => promessa(() => proc.escrever(texto)),
        encerrar: () => promessa(() => proc.matar()),
      })),

    servirPorta: ({ nome, protocolo, porta }) => promessa(() => m.porta.servir({ nome, protocolo, porta }))
      .then(() => ({ fechar: () => m.porta.parar(nome) })),

    escrever: (caminho, texto) => promessa(() => m.programa.escrever({ destino: caminho, texto })),

    // **A cópia do mundo** (parte 7): empacotar depois do salvamento seguro,
    // oferecer na porta do túnel da cópia, e receber na outra máquina.
    empacotar: (origem, arquivo) => promessa(() => m.programa.empacotar({ origem, arquivo })),
    oferecerCopia: (arquivo, porta) => promessa(() => m.programa.oferecerCopia({ arquivo, porta })),
    receberCopia: ({ tunel, codigo, sha256, tamanho, destino }) => promessa(() => m.programa.receberCopia({
      tunel, codigo, sha256, tamanho, destino,
    })),

    pedir: valor => promessa(() => m.pedir(valor)).then(lido),
    aoAviso: fn => m.aoAviso(carga => fn(String(m.servidor ?? ''), lido(carga))),
    aoParar: fn => m.aoParar(fn),
    // **A volta de quem hospeda**: a metade seguiu rodando sem ele e foi
    // religada sem subir de novo. Um SEELE sem o nome não religa (a metade
    // para e sobe de novo, como antes), e não há o que ouvir.
    aoReconectar: fn => (typeof m.aoReconectar === 'function' ? m.aoReconectar(fn) : undefined),
    recusas: () => promessa(() => m.programa.recusas()),

    // O relógio do executor (o mesmo `setTimeout` das outras metades).
    esperar: ms => new Promise(resolve => g.setTimeout(resolve, ms)),
    registrar: texto => g.console?.log?.(texto),
  };
}

// ---- maquina.js: a metade de máquina ----
//
// Roda só numa máquina cujo dono aceitou, na tela do produto, rodar aquele
// servidor de jogo. Baixa e confere o que a receita pede, escreve os termos e
// a configuração, roda o jogo, lê a saída (pronto, quem entrou, quem saiu),
// serve o túnel quando o jogo está pronto, aceita comandos do console e para
// limpo.
//
// **Não confia em si para saber se foi aceita**: cada passo começa pedindo o
// plano à metade de servidor, que só o entrega à máquina aceita. Sem o plano,
// nada é baixado, nada é escrito e nada roda.
//
// **Nada calado.** Toda falha vai à metade de servidor (`op: 'falha'`), com a
// etapa, o nome do erro e os dados dele, e de lá à tela de quem configura.
//
// Toda a API da máquina passa pelo adaptador (adaptador.js).

const LINHAS_GUARDADAS = 8;
/** Onde a dona empacota o mundo, e onde a outra máquina guarda o que recebe (parte 7). */
const PACOTE_DA_COPIA = 'copias/mundo.tar.gz';
const COPIA_RECEBIDA = 'copias/recebida.tar.gz';
/** A marca do último mundo que esta máquina tem: o sha256 da cópia que ela abriu ou fez. */
const MARCA_DO_MUNDO = '.seele-mundo';
/** Quanto a parada da metade espera o jogo sair depois do `stop`, abaixo dos 20 s do produto. */
const PRAZO_DA_PARADA_DA_METADE = 15000;

function criarMaquina(ad) {
  const instancias = new Map();

  function instancia(servidor) {
    let i = instancias.get(servidor);
    if (!i) {
      i = {
        servidor, fila: Promise.resolve(), plano: null, preparado: null, proc: null, tunel: null,
        estado: 'desligado', jogadores: [], linhas: [], parando: false, esperas: [], progresso: null,
        casar: null, dona: true, vezDaCopia: 0, tunelDaCopia: null, recebida: null,
      };
      instancias.set(servidor, i);
    }
    return i;
  }

  // ---- falar com a metade de servidor ----

  async function falha(i, etapa, erro, dados = {}) {
    const frase = typeof erro === 'string' ? erro : fraseDoErro(erro);
    ad.registrar(`${i.servidor}: ${etapa}: ${frase} ${JSON.stringify(dados)}`);
    // As recusas do produto nesta máquina, contadas por nome, vão junto: é o
    // que diz à tela se a falha é a primeira ou a décima.
    let recusas = null;
    try { recusas = ad.recusas ? await ad.recusas() : null; } catch { recusas = null; }
    try {
      await ad.pedir({ op: 'falha', etapa, erro: frase, dados: { ...dados, ...(recusas && Object.keys(recusas).length ? { recusas } : {}) } });
    } catch (e) {
      // Sem a metade de servidor, o log desta máquina é o que sobra.
      ad.registrar(`${i.servidor}: a falha não chegou à metade de servidor: ${fraseDoErro(e)}`);
    }
  }

  async function contar(i, estado, extra = {}) {
    i.estado = estado;
    let resposta;
    try {
      resposta = await ad.pedir({
        op: 'estado', estado, jogadores: i.jogadores, linhas: i.linhas,
        ...(i.progresso ? { progresso: i.progresso } : {}), ...extra,
      });
    } catch (e) {
      ad.registrar(`${i.servidor}: o estado não chegou à metade de servidor: ${fraseDoErro(e)}`);
      return;
    }
    // A metade de servidor é quem decide quem roda: se ela manda parar, para.
    // Sem a posse (parte 7), é a principal que voltou com o jogo de pé: o
    // desligar é contado, e não calado.
    if (resposta?.ordem === 'desligar' && i.proc && !i.parando) {
      if (resposta.dona === false) enfileirar(i, () => perdeuAPosse(i));
      else enfileirar(i, () => desligar(i));
    }
  }

  async function lerPlano(i) {
    const r = await ad.pedir({ op: 'plano' });
    if (!r || r.ok !== true || !r.plano) {
      // Sem aceite, a máquina nem é ouvida (o produto a dispensa); com outro
      // motivo, a tela fica sabendo.
      if (r && r.erro && r.erro !== 'sem-aceite') await falha(i, 'plano', r.erro, dadosDoErro(r));
      ad.registrar(`${i.servidor}: sem plano: ${JSON.stringify(r)}`);
      return null;
    }
    i.plano = r.plano;
    const receita = receitaPorId(r.plano.receita);
    if (!receita) {
      await falha(i, 'plano', 'receita-desconhecida', { receita: r.plano.receita });
      return null;
    }
    i.receita = receita;
    i.casar = casarSaida(receita);
    i.dona = r.plano.dona !== false;
    // **A que não é a dona não roda** (parte 7): um jogo de pé aqui é o de
    // antes da queda, e sai — contado.
    if (!i.dona && i.proc && !i.parando) await perdeuAPosse(i);
    return r.plano;
  }

  // ---- preparar: baixar e conferir ----

  async function preparar(i) {
    const plano = await lerPlano(i);
    if (!plano) return false;
    const chave = JSON.stringify([plano.artefatos, plano.modpack?.sha512 ?? null]);
    if (i.preparado === chave) return true;

    const plataforma = ad.plataforma();
    // **O loader que não roda aqui é dito antes de baixar** (um loader cuja
    // receita limita `sistemas`): antes, a máquina baixava o servidor e o
    // Java (~90 MB no Forge 1.20.1) para só então recusar. O Forge e o
    // NeoForge rodam em todos desde a decisão W1 (o `win_args.txt` no Windows).
    const sistemas = plano.modpack?.loader ? receitaPorId(plano.receita)?.modpack?.loaders?.[plano.modpack.loader.id]?.sistemas : null;
    if (sistemas && !sistemas.includes(plataforma)) {
      await falha(i, 'loader', 'loader-sem-este-sistema', { loader: plano.modpack.loader.id, plataforma, sistemas });
      await contar(i, 'desligado');
      return false;
    }
    const java = new Set(Object.values(plano.porPlataforma));
    const meuJava = plano.porPlataforma[plataforma];
    if (java.size && !meuJava) {
      await falha(i, 'java', 'sem-java-para-esta-maquina', { plataforma, plataformas: Object.keys(plano.porPlataforma) });
      return false;
    }
    const baixar = plano.artefatos.filter(a => !java.has(a.nome) || a.nome === meuJava);
    i.progresso = { feitos: 0, total: baixar.length };
    await contar(i, 'baixando');
    for (const a of baixar) {
      // Um pacote (o Java) é baixado ao lado e aberto no destino: o produto
      // confere o hash do pacote, e abre só o que está sob a raiz dele.
      const destino = a.desempacotar ? `pacotes/${a.nome}` : a.destino;
      try {
        await ad.baixar({ url: a.url, hash: a.hash, tamanho: a.tamanho, destino });
      } catch (erro) {
        await falha(i, 'baixar', erro, { arquivo: a.nome, url: a.url, tamanho: a.tamanho, hash: a.hash, ...dadosDoErro(erro) });
        await contar(i, 'desligado');
        return false;
      }
      if (a.desempacotar) {
        try {
          await ad.desempacotar({ arquivo: destino, destino: a.destino, raiz: a.desempacotar.raiz });
        } catch (erro) {
          await falha(i, 'desempacotar', erro, { arquivo: a.nome, raiz: a.desempacotar.raiz, ...dadosDoErro(erro) });
          await contar(i, 'desligado');
          return false;
        }
      }
      i.progresso = { feitos: i.progresso.feitos + 1, total: baixar.length };
    }
    if (plano.modpack && !(await prepararModpack(i, plano))) {
      await contar(i, 'desligado');
      return false;
    }
    i.preparado = chave;
    await contar(i, 'pronto');
    return true;
  }

  // ---- o modpack (parte 6) ----

  /** Um passo do modpack que falhou: a falha vai à tela com a etapa e os dados. */
  async function falhaDoPack(i, etapa, erro, dados = {}) {
    await falha(i, etapa, erro, { ...dados, ...dadosDoErro(erro) });
    return false;
  }

  /**
   * **O pack aceito, aberto e aplicado**, na ordem da spec: o pack (trazido da
   * metade de servidor pelo volume, ou baixado do CDN do Modrinth pelo link),
   * o índice lido e conferido pelas mesmas regras da metade de servidor, cada
   * arquivo do servidor baixado com o `sha512`, os `overrides` e depois os
   * `server-overrides` por cima, e o instalador do loader que o pack pede.
   */
  async function prepararModpack(i, plano) {
    const mp = plano.modpack;
    if (mp.origem === 'enviado') {
      try {
        await ad.trazer({ pedido: mp.pedido, destino: mp.destino });
      } catch (erro) {
        return falhaDoPack(i, 'trazer-pack', erro, { destino: mp.destino, sha512: mp.sha512 });
      }
    }
    try {
      await ad.desempacotar({ arquivo: mp.destino, destino: 'pack', raiz: '' });
    } catch (erro) {
      return falhaDoPack(i, 'abrir-pack', erro, { arquivo: mp.destino });
    }
    let texto;
    try {
      texto = await ad.ler('pack/modrinth.index.json');
    } catch (erro) {
      return falhaDoPack(i, 'ler-indice', erro, {});
    }
    // As regras de novo, aqui: o índice que vale é o dos bytes aceitos.
    const lido = lerIndice(texto, i.receita);
    if (!lido.ok) return falhaDoPack(i, 'indice', lido.erro, lido);
    const indice = lido.indice;
    // Revisão final (I2): nem o índice nem os overrides trocam o que o aceite diz que roda.
    const protegidos = caminhosProtegidosDoPack(plano);
    const noIndice = indice.arquivos.find(a => protegidos.includes(a.path));
    if (noIndice) return falhaDoPack(i, 'indice', 'pack-troca-o-que-roda', { path: noIndice.path, protegidos });
    for (const raiz of ['overrides', 'server-overrides']) {
      for (const p of protegidos) {
        if (await existeNoPack(`pack/${raiz}/${p}`)) {
          return falhaDoPack(i, 'aplicar-' + raiz, 'pack-troca-o-que-roda', { raiz, path: p, protegidos });
        }
      }
    }
    const loaderIgual = JSON.stringify(indice.loader) === JSON.stringify(mp.loader);
    if (indice.mc !== mp.mc || !loaderIgual) {
      return falhaDoPack(i, 'indice', 'pack-nao-confere', { mc: indice.mc, mcDoPlano: mp.mc, loader: indice.loader, loaderDoPlano: mp.loader });
    }
    const sistemas = mp.loader ? i.receita.modpack.loaders[mp.loader.id]?.sistemas : null;
    if (sistemas && !sistemas.includes(ad.plataforma())) {
      return falhaDoPack(i, 'loader', 'loader-sem-este-sistema', { loader: mp.loader.id, plataforma: ad.plataforma(), sistemas });
    }
    const feitos = i.progresso?.feitos ?? 0;
    i.progresso = { feitos, total: feitos + indice.arquivos.length };
    await contar(i, 'baixando', { excluidos: indice.excluidos });
    for (const a of indice.arquivos) {
      try {
        await ad.baixar({ url: a.url, hash: { algoritmo: 'sha512', hex: a.sha512 }, tamanho: a.tamanho, destino: a.path });
      } catch (erro) {
        return falhaDoPack(i, 'baixar-do-pack', erro, { path: a.path, url: a.url, tamanho: a.tamanho });
      }
      i.progresso = { feitos: i.progresso.feitos + 1, total: i.progresso.total };
    }
    for (const raiz of ['overrides', 'server-overrides']) {
      try {
        await ad.desempacotar({ arquivo: mp.destino, destino: '', raiz, mesclar: true });
      } catch (erro) {
        // Um pack sem a pasta não tem o que aplicar: não é falha.
        if (erro?.erro === 'nada-sob-a-raiz') continue;
        return falhaDoPack(i, 'aplicar-' + raiz, erro, { raiz });
      }
    }
    // O passo de instalar **desta máquina** (decisão W1): o da entrada de
    // `por_sistema` do sistema dela, ou o de cima.
    const { instalar } = comandosDaMaquina({ rodar: plano.rodar, instalar: mp.instalar, porSistema: plano.porSistema }, ad.plataforma());
    if (mp.loader && instalar && !(await instalarLoader(i, { ...mp, instalar }))) return false;
    return true;
  }

  /**
   * Um arquivo do pack aberto existe? `ler` diz: lido, ou grande ou binário
   * demais para ler, é que está lá; a recusa `disco` (não achou, ou é pasta) é
   * que não está.
   */
  async function existeNoPack(caminho) {
    try {
      await ad.ler(caminho);
      return true;
    } catch (erro) {
      return erro?.erro === 'nao-e-texto' || erro?.erro === 'texto-grande-demais';
    }
  }

  /**
   * **O instalador do loader roda uma vez** (o segundo comando aceito): a
   * marca `.seele-loader` diz que este loader, nesta versão, já foi
   * instalado. Um instalador que sai com erro para tudo, com o código e as
   * últimas linhas.
   */
  async function instalarLoader(i, mp) {
    const marca = `${mp.loader.id}@${mp.loader.versao}@${mp.mc}\n`;
    let feita = null;
    try { feita = await ad.ler('.seele-loader'); } catch { feita = null; }
    if (feita === marca) return true;
    await contar(i, 'instalando');
    const linhas = [];
    let proc;
    try {
      proc = await ad.rodar({ comando: mp.instalar.comando, argumentos: mp.instalar.argumentos, pasta: '' });
    } catch (erro) {
      return falhaDoPack(i, 'instalar', erro, { comando: mp.instalar.comando, loader: mp.loader });
    }
    const saida = await new Promise(resolver => {
      proc.aoLinha(linha => { linhas.push(cortar(String(linha), 160)); if (linhas.length > LINHAS_GUARDADAS) linhas.shift(); });
      proc.aoSair(resolver);
    });
    if (saida?.codigo !== 0) {
      return falhaDoPack(i, 'instalar', 'instalador-falhou', { codigo: saida?.codigo ?? null, sinal: saida?.sinal ?? null, linhas, loader: mp.loader });
    }
    try {
      await ad.escrever('.seele-loader', marca);
    } catch (erro) {
      return falhaDoPack(i, 'instalar', erro, {});
    }
    return true;
  }

  // ---- ligar: escrever, rodar e vigiar ----

  async function escreverArquivos(i, plano) {
    // **Os termos só são escritos aqui**, com o plano que só a máquina aceita
    // recebe: o EULA foi aceito por quem é dono desta máquina, na tela do produto.
    for (const t of plano.termos) await ad.escrever(t.arquivo, t.conteudo);
    await ad.escrever(plano.arquivoDeConfig, plano.propriedades);
    // **O que um mod copia por cima da configuração** (medido no Create Live 5,
    // Forge 1.20.1: o Default Server Properties troca o `server.properties`
    // inteiro pelo `default-server.properties` do pack na primeira subida, e o
    // jogo subia em `*:25565`, com o nome e o máximo do pack): a máquina
    // escreve nele as chaves que a tela promete, e o resto do pack fica.
    if (plano.modpack) {
      for (const arquivo of i.receita?.modpack?.configuracoesDoPack ?? []) {
        let deles;
        try { deles = await ad.ler(arquivo); } catch { continue; }
        await ad.escrever(arquivo, mesclarPropriedades(deles, plano.propriedades));
      }
    }
  }

  /**
   * **O jogo usa o que a tela promete?** Lido de volta no «pronto», antes do
   * túnel: o jogo reescreve o arquivo com o que carregou, e um mod pode ter
   * trocado o que o MOD escreveu (o endereço, a porta, o modo online, o
   * nome). Trocado, o túnel não abre e o jogo para — dito, com cada chave.
   */
  async function configuracaoTrocada(i) {
    if (i.receita?.configuracao?.formato !== 'properties') return null;
    const plano = i.plano;
    let lido;
    try {
      lido = await ad.ler(plano.arquivoDeConfig);
    } catch (erro) {
      return { arquivo: plano.arquivoDeConfig, ilegivel: fraseDoErro(erro) };
    }
    const trocadas = propriedadesTrocadas(plano.propriedades, lido);
    const curto = v => (v === null ? null : cortar(v, 60));
    return trocadas.length
      ? { arquivo: plano.arquivoDeConfig, trocadas: trocadas.slice(0, 8).map(t => ({ chave: t.chave, esperado: curto(t.esperado), lido: curto(t.lido) })) }
      : null;
  }

  function lembrar(i, linha) {
    i.linhas = [...i.linhas, cortar(linha, 160)].slice(-LINHAS_GUARDADAS);
  }

  function aoLinha(i, cru) {
    // As cores do terminal fora (medido no NeoForge 1.21.1: as linhas do
    // `main/` chegam com `\x1b[32m` mesmo sem terminal): os padrões começam
    // em `^[`, e a tela mostra as últimas linhas de um jogo que caiu.
    const linha = semCores(cru);
    lembrar(i, linha);
    for (const e of [...i.esperas]) {
      if (e.re.test(linha)) {
        i.esperas = i.esperas.filter(x => x !== e);
        e.resolver(true);
      }
    }
    const lido = i.casar?.(linha);
    if (!lido) return;
    if (lido.tipo === 'pronto') enfileirar(i, () => abrirTunel(i));
    else if (lido.tipo === 'entrou') {
      if (!i.jogadores.includes(lido.jogador)) i.jogadores = [...i.jogadores, lido.jogador];
      contar(i, i.estado);
    } else if (lido.tipo === 'saiu') {
      i.jogadores = i.jogadores.filter(j => j !== lido.jogador);
      contar(i, i.estado);
    }
  }

  async function abrirTunel(i) {
    const t = i.plano.tunel;
    const trocada = await configuracaoTrocada(i);
    if (trocada) {
      await falha(i, 'config', trocada.ilegivel ? 'config-ilegivel' : 'config-trocada', trocada);
      await desligar(i);
      return;
    }
    try {
      i.tunel = await ad.servirPorta({ nome: t.nome, protocolo: t.protocolo, porta: t.porta });
    } catch (erro) {
      await falha(i, 'tunel', erro, { nome: t.nome, protocolo: t.protocolo, porta: t.porta, ...dadosDoErro(erro) });
    }
    await contar(i, 'ligado');
    // A dona começa a copiar o mundo para a outra máquina (parte 7).
    if (i.dona) agendarCopia(i);
  }

  function fecharTunel(i) {
    try {
      i.tunel?.fechar?.();
    } catch (erro) {
      falha(i, 'tunel', erro, { fechando: true });
    }
    i.tunel = null;
    // A cópia agendada para com o jogo; o túnel da cópia fica, para a outra
    // máquina terminar de receber a final (o produto o para quando a posse muda).
    i.vezDaCopia++;
  }

  async function aoSair(i, saida) {
    const pedido = i.parando;
    i.proc = null;
    i.parando = false;
    i.jogadores = [];
    fecharTunel(i);
    for (const e of i.esperas.splice(0)) e.resolver(false);
    i.aoTerminar?.();
    i.aoTerminar = null;
    const codigo = saida?.codigo ?? null;
    if (pedido) await contar(i, 'desligado');
    else await contar(i, 'caiu', { saida: { codigo, sinal: saida?.sinal ?? null, linhas: i.linhas } });
  }

  async function ligar(i) {
    if (i.proc) return;
    if (!(await preparar(i))) return;
    const plano = i.plano;
    try {
      await escreverArquivos(i, plano);
    } catch (erro) {
      await falha(i, 'escrever', erro, dadosDoErro(erro));
      return;
    }
    i.linhas = [];
    i.jogadores = [];
    await contar(i, 'ligando');
    let proc;
    let comandoRodado = null;
    try {
      // `pasta: ''` é a pasta deste servidor de jogo. O par **desta máquina**
      // (decisão W1): o `win_args.txt` do Forge no Windows, o de cima no resto.
      const { rodar } = comandosDaMaquina({ rodar: plano.rodar, instalar: plano.modpack?.instalar ?? null, porSistema: plano.porSistema }, ad.plataforma());
      comandoRodado = rodar;
      proc = await ad.rodar({ comando: rodar.comando, argumentos: rodar.argumentos, pasta: '' });
    } catch (erro) {
      await falha(i, 'rodar', erro, { comando: comandoRodado?.comando ?? null, ...dadosDoErro(erro) });
      await contar(i, 'desligado');
      return;
    }
    i.proc = proc;
    proc.aoLinha(linha => aoLinha(i, String(linha)));
    proc.aoSair(saida => { aoSair(i, saida); });
  }

  /** Espera uma linha que case, ou o prazo; resolve com true ou false. */
  function esperarLinha(i, fonte, prazo) {
    return new Promise(resolver => {
      const e = { re: new RegExp(fonte), resolver };
      i.esperas.push(e);
      ad.esperar(prazo * 1000).then(() => {
        if (i.esperas.includes(e)) {
          i.esperas = i.esperas.filter(x => x !== e);
          resolver(false);
        }
      });
    });
  }

  /** Um passo de console da receita: manda a linha e, se pedir, espera a resposta. */
  async function passoDeConsole(i, passo) {
    if (!i.proc) return false;
    const espera = passo.esperar ? esperarLinha(i, passo.esperar, passo.prazo ?? 60) : null;
    i.proc.escrever(passo.console + '\n');
    return espera ? espera : true;
  }

  async function desligar(i) {
    if (!i.proc) {
      await contar(i, 'desligado');
      return;
    }
    i.parando = true;
    await contar(i, 'parando');
    const passo = i.receita.saida.parar;
    const prazo = passo.prazo ?? 60;
    const proc = i.proc;
    const saiu = new Promise(resolver => { i.aoTerminar = resolver; });
    // O jogo sai sozinho depois do stop; o prazo é o da receita.
    proc.escrever(passo.console + '\n');
    const venceu = await Promise.race([saiu.then(() => false), ad.esperar(prazo * 1000).then(() => true)]);
    if (venceu && i.proc === proc) {
      await falha(i, 'parar', 'nao-parou-no-prazo', { prazo });
      proc.encerrar();
    }
  }

  async function salvar(i, opcoes = {}) {
    if (!i.proc) {
      await falha(i, 'salvar', 'servidor-desligado');
      return null;
    }
    const passos = i.receita.mundo.salvar;
    const ultimo = passos.at(-1);
    await contar(i, 'salvando');
    let falhou = null;
    let semCopia = null;
    let pacote = null;
    for (const passo of passos) {
      if (passo.copiar && !(opcoes.copiar && ad.empacotar)) {
        // Sem quem receba (sem reserva), o mundo foi salvo com segurança e
        // não há o que copiar. Dito, e não calado.
        semCopia = passo.copiar;
      } else if (passo.copiar) {
        // **A cópia, com o mundo parado de escrever** (parte 7): entre o
        // save-all flush e o save-on.
        try {
          // A pasta do mundo de agora (um mundo novo é outra pasta).
          pacote = await ad.empacotar(i.plano?.copia?.pasta ?? passo.copiar, PACOTE_DA_COPIA);
        } catch (erro) {
          falhou = { erro: fraseDoErro(erro), dados: { passo, ...dadosDoErro(erro) } };
          break;
        }
      } else {
        const ok = await passoDeConsole(i, passo);
        if (!ok) {
          falhou = { erro: i.proc ? 'o-jogo-nao-respondeu' : 'o-jogo-saiu', dados: { passo } };
          break;
        }
      }
    }
    if (falhou) {
      // O mundo não pode ficar sem salvar automático: o último passo de
      // console (o save-on) vai mesmo assim.
      if (ultimo.console && i.proc) i.proc.escrever(ultimo.console + '\n');
      await falha(i, opcoes.copiar ? 'copia' : 'salvar', falhou.erro, falhou.dados);
    } else if (semCopia && !opcoes.copiar) {
      await falha(i, 'salvar', 'sem-reserva-para-a-copia', { pasta: semCopia });
    }
    if (i.proc) await contar(i, 'ligado');
    return falhou ? null : pacote;
  }

  // ---- a cópia do mundo (parte 7) ----

  /** O sha256 do mundo que esta máquina tem (a cópia que abriu ou que fez), ou null. */
  async function marcaDoMundo() {
    try { return String(await ad.ler(MARCA_DO_MUNDO)).trim() || null; } catch { return null; }
  }

  /**
   * **A dona copia o mundo** para a outra máquina: o salvamento seguro com o
   * pacote no meio (ou, na passagem avisada, o jogo parado inteiro antes), a
   * oferta na porta do túnel da cópia, o túnel servido, e a metade de
   * servidor avisada, que avisa a outra. Toda falha vai à tela.
   */
  async function copiar(i, final) {
    const plano = await lerPlano(i);
    if (!plano || !plano.dona) return;
    const c = plano.copia;
    // Sem outra máquina aceita não há para quem copiar — e, sem reserva, a
    // oferta nem tem o túnel da cópia: a agendada não é falha.
    if (!final && !c?.comOutra) return;
    if (!c?.tunel) return falha(i, 'copia', 'sem-tunel-de-copia', {});
    let pacote;
    if (final || !i.proc) {
      // **A passagem avisada para o jogo antes**: o stop salva o mundo
      // inteiro, e nada do que se joga depois fica para trás.
      if (i.proc) await desligar(i);
      try {
        pacote = await ad.empacotar(c.pasta, PACOTE_DA_COPIA);
      } catch (erro) {
        return falha(i, 'copia', erro, { pasta: c.pasta, final, ...dadosDoErro(erro) });
      }
    } else {
      pacote = await salvar(i, { copiar: true });
      if (!pacote) return;
    }
    let oferta;
    try {
      oferta = await ad.oferecerCopia(PACOTE_DA_COPIA, c.tunel.porta);
    } catch (erro) {
      return falha(i, 'copia', erro, { porta: c.tunel.porta, ...dadosDoErro(erro) });
    }
    if (!i.tunelDaCopia) {
      try {
        i.tunelDaCopia = await ad.servirPorta({ nome: c.tunel.nome, protocolo: 'tcp', porta: c.tunel.porta });
      } catch (erro) {
        return falha(i, 'copia', erro, { tunel: c.tunel.nome, porta: c.tunel.porta, ...dadosDoErro(erro) });
      }
    }
    try { await ad.escrever(MARCA_DO_MUNDO, oferta.sha256 + '\n'); } catch { /* a marca é um atalho */ }
    const r = await ad.pedir({
      op: 'copia-pronta', codigo: oferta.codigo, sha256: oferta.sha256, tamanho: oferta.tamanho, final,
      arquivos: pacote.arquivos ?? null, bytes: pacote.bytes ?? null,
    });
    if (!r || r.ok !== true) await falha(i, 'copia', r?.erro ?? 'copia-recusada', dadosDoErro(r ?? {}));
  }

  /** **A cópia agendada**: de `intervalo` em `intervalo` minutos, enquanto o jogo roda e esta é a dona. */
  function agendarCopia(i) {
    const vez = ++i.vezDaCopia;
    const minutos = Number(i.plano?.copia?.intervalo) || 5;
    ad.esperar(minutos * 60000).then(() => {
      if (i.vezDaCopia !== vez || !i.proc || !i.dona) return;
      enfileirar(i, () => copiar(i, false));
      agendarCopia(i);
    });
  }

  /** **A outra máquina recebe a cópia** pelo túnel da dona, e diz que chegou. */
  async function receber(i, carga) {
    let chegou;
    try {
      chegou = await ad.receberCopia({ tunel: String(carga.tunel), codigo: String(carga.codigo), sha256: String(carga.sha256), tamanho: Number(carga.tamanho), destino: COPIA_RECEBIDA });
    } catch (erro) {
      return falha(i, 'receber-copia', erro, { tunel: carga.tunel, tamanho: carga.tamanho, sha256: carga.sha256, final: carga.final === true, ...dadosDoErro(erro) });
    }
    i.recebida = { sha256: chegou.sha256 };
    const r = await ad.pedir({ op: 'copia-recebida', sha256: chegou.sha256, final: carga.final === true, caminho: chegou.caminho ?? null, retomadas: chegou.retomadas ?? 0 });
    if (!r || r.ok !== true) await falha(i, 'receber-copia', r?.erro ?? 'recusada', dadosDoErro(r ?? {}));
  }

  /**
   * **Assumir** (a metade de servidor passou a posse a esta máquina): abre a
   * última cópia recebida no lugar do mundo, se ela é mais nova que o que
   * está aqui, e liga.
   */
  async function assumir(i) {
    const plano = await lerPlano(i);
    if (!plano) return;
    if (!plano.dona) return falha(i, 'assumir', 'nao-e-a-dona', {});
    const pasta = plano.copia?.pasta ?? 'world';
    const temAqui = await marcaDoMundo();
    // A metade que subiu de novo depois de receber (o app reaberto) não
    // lembra: o que ela recebeu, o plano diz.
    const recebida = i.recebida?.sha256 ?? plano.copia?.recebida ?? null;
    if (recebida && recebida !== temAqui) {
      try {
        await ad.desempacotar({ arquivo: COPIA_RECEBIDA, destino: pasta, raiz: pasta });
        await ad.escrever(MARCA_DO_MUNDO, recebida + '\n');
      } catch (erro) {
        return falha(i, 'assumir', erro, { arquivo: COPIA_RECEBIDA, pasta, ...dadosDoErro(erro) });
      }
    }
    await ligar(i);
  }

  /**
   * **A principal que voltou com o jogo de pé** e não é a dona: desliga, e
   * diz à metade de servidor, que conta e mostra. Nunca resolvido calado.
   */
  async function perdeuAPosse(i) {
    if (!i.proc) return;
    ad.registrar(`${i.servidor}: não é a dona, e o jogo estava de pé: desligando`);
    await desligar(i);
    try {
      await ad.pedir({ op: 'perdeu-a-posse', processoVivo: true });
    } catch (e) {
      ad.registrar(`${i.servidor}: a volta sem a posse não chegou à metade de servidor: ${fraseDoErro(e)}`);
    }
  }

  /**
   * **A volta de quem hospeda** (maquina.aoReconectar): sem ele a metade
   * seguiu rodando — a dona com o jogo de pé —, e o pedido igual ao aceito a
   * religou, sem subir de novo. Quem hospeda esqueceu o túnel dela; a posse
   * pode ter mudado enquanto ela estava fora (a reserva assumiu numa queda só
   * desta máquina). Ela pergunta o plano: sem a posse e com o jogo de pé,
   * desliga e diz (`perdeuAPosse`, em `lerPlano`); dona, serve de novo o
   * túnel do jogo, esquece o da cópia (servido de novo na próxima) e conta o
   * estado.
   */
  async function religar(i, volta) {
    const fora = Number(volta?.fora) || 0;
    ad.registrar(`${i.servidor}: religada depois de ${fora} s sem quem hospeda`);
    i.tunelDaCopia = null;
    const plano = await lerPlano(i);
    if (!plano) {
      // O aceite que o app mandou de novo ainda não chegou à metade de
      // servidor: o aviso que ela manda ao vê-lo (ligar ou preparar) religa.
      i.religarAoAceite = { fora };
      return;
    }
    i.religarAoAceite = null;
    if (!i.dona || !i.proc) return;
    // O jogo pronto (ligado) serve o túnel de novo, e também o que falhou
    // antes (revisão final, M12): sem isto, um túnel que falhou nunca voltava.
    // Antes do «Done», quem serve é o «pronto», como sempre.
    if ((i.tunel || i.estado === 'ligado') && plano.tunel) {
      const t = plano.tunel;
      try {
        i.tunel = await ad.servirPorta({ nome: t.nome, protocolo: t.protocolo, porta: t.porta });
      } catch (erro) {
        i.tunel = null;
        await falha(i, 'tunel', erro, { nome: t.nome, protocolo: t.protocolo, porta: t.porta, religada: true, ...dadosDoErro(erro) });
      }
    }
    await contar(i, i.estado, { religada: { fora } });
  }

  async function console_(i, comando) {
    if (!i.proc) {
      await falha(i, 'console', 'servidor-desligado', { comando });
      return;
    }
    i.proc.escrever(String(comando) + '\n');
  }

  async function configurar(i) {
    const plano = await lerPlano(i);
    if (!plano) return;
    try {
      await ad.escrever(plano.arquivoDeConfig, plano.propriedades);
    } catch (erro) {
      await falha(i, 'escrever', erro, dadosDoErro(erro));
    }
  }

  // ---- a fila: um passo por vez em cada servidor de jogo ----

  function enfileirar(i, passo) {
    i.fila = i.fila.then(passo).catch(erro => falha(i, 'interno', erro, dadosDoErro(erro)));
    return i.fila;
  }

  const OPERACOES = {
    preparar: i => preparar(i),
    ligar: i => ligar(i),
    desligar: i => desligar(i),
    salvar: i => salvar(i),
    configurar: i => configurar(i),
    // A reserva (parte 7).
    copia: (i, carga) => receber(i, carga),
    assumir: i => assumir(i),
    passar: i => copiar(i, true),
    console: (i, carga) => console_(i, carga.comando),
  };

  ad.aoAviso((servidor, carga) => {
    const i = instancia(String(servidor));
    i.avisado = true;
    const op = OPERACOES[carga?.op];
    if (!op) {
      falha(i, 'aviso', 'aviso-desconhecido', { op: carga?.op ?? null });
      return;
    }
    // **A religada que esperava o aceite**: o aviso que vem dele (ligar ou
    // preparar) termina a volta — perguntar a posse, servir de novo —, e não
    // sobe um jogo que já está de pé.
    if (i.religarAoAceite && (carga.op === 'ligar' || carga.op === 'preparar')) {
      const volta = i.religarAoAceite;
      i.religarAoAceite = null;
      enfileirar(i, () => religar(i, volta));
      return;
    }
    // Desligar e o console não esperam o que está na fila (um download longo).
    if (carga.op === 'console') op(i, carga).catch(erro => falha(i, 'console', erro));
    else enfileirar(i, () => op(i, carga));
  });


  // **A parada da metade** (DESLIGAR, REVOGAR, o app fechando, o MOD
  // desligado): o jogo recebe `stop` e tem o prazo do produto para salvar
  // (20 s com um processo vivo); depois disso o produto o encerra. Não passa
  // pela fila: um download longo não segura a parada.
  ad.aoParar?.(async motivo => {
    const parando = [];
    for (const i of instancias.values()) {
      if (!i.proc) continue;
      ad.registrar(`${i.servidor}: parada da metade (${motivo}): stop`);
      i.parando = true;
      const saiu = new Promise(resolver => { i.aoTerminar = resolver; });
      i.proc.escrever(i.receita.saida.parar.console + '\n');
      parando.push(Promise.race([saiu, ad.esperar(PRAZO_DA_PARADA_DA_METADE)]));
    }
    await Promise.all(parando);
  });

  // **A volta de quem hospeda**: cada servidor de jogo desta metade religa
  // na fila dele, depois do que já estava andando.
  ad.aoReconectar?.(volta => {
    for (const i of instancias.values()) enfileirar(i, () => religar(i, volta));
  });

  // **Ao subir, a máquina pergunta o plano**, em vez de esperar um aviso: o
  // aviso pode ter saído antes de esta metade estar de pé, e a metade de
  // servidor junta avisos seguidos no mais novo.
  if (ad.servidor) {
    const i = instancia(ad.servidor);
    enfileirar(i, async () => {
      const plano = await lerPlano(i);
      // Um aviso chegou enquanto o plano vinha: quem manda é ele.
      if (!plano || i.avisado) return;
      if (plano.ligar) await ligar(i);
      else await preparar(i);
    });
  }

  return { instancias };
}

// A partida: no executor, a metade de máquina sobe com o adaptador de
// verdade. Sem a API da máquina, `criarAdaptador` lança com o que falta, e o
// erro vai ao log do produto em vez de a metade ficar de pé sem fazer nada.
if (!globalThis.__testeSemPartida) criarMaquina(criarAdaptador(globalThis));

})();
