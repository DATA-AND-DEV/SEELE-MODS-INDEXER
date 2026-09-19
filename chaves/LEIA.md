# As chaves

`mods.pub` é a chave pública de MOD. É comitada porque é pública, e porque o
cliente Rust a traz compilada — a que está aqui é conveniência humana, para
alguém conferir uma assinatura à mão.

**A privada não está aqui e nunca vai estar.** Ela mora em
`~/.minisign/mods.key`, nunca entra na Cloudflare, nunca entra em CI. Um
segredo em CI é um segredo em máquina de terceiro; este não precisa ser
(ADR 0026).

**A chave de produção entrou em 17/09** (commit `7d4ec1f`), e é ela que assina o
catálogo desde então. O `mods.pub` acima é o dela — `32D58C50C0AB34E8` —, e é o
mesmo que os clientes publicados trazem compilado.

**A de desenvolvimento ainda existe no disco**, em `~/.minisign/mods-dev.key`, e
esta página mandava usá-la até 19/09. Vale dizer por que isso importa mais do
que um nome errado num documento: assinar o catálogo com a de desenvolvimento
produz um `.minisig` que **todo SEELE no mundo recusa**, e o modo como isso
aparece é o indexador parecendo fora do ar para todo mundo ao mesmo tempo. O
comando não reclama; o erro só aparece do outro lado.

Antes de assinar, confira que é a de produção — e a conferência não precisa da
senha:

```sh
minisign -Vm publicado/catalogo.json -p chaves/mods.pub
```

A chave de MOD é separada da do atualizador: uma chave que atesta duas coisas
deixa as duas se passarem uma pela outra (ADR 0044).

**Nunca `minisign -G -f`.** O `-f` sobrescreve a chave privada que está lá, e
não há segunda cópia dela em lugar nenhum.
