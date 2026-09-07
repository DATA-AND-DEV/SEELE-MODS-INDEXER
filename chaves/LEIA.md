# As chaves

`mods.pub` é a chave pública de MOD. É comitada porque é pública, e porque o
cliente Rust a traz compilada — a que está aqui é conveniência humana, para
alguém conferir uma assinatura à mão.

**A privada não está aqui e nunca vai estar.** Ela mora em
`~/.minisign/mods-dev.key`, nunca entra na Cloudflare, nunca entra em CI. Um
segredo em CI é um segredo em máquina de terceiro; este não precisa ser
(ADR 0026).

**Esta é uma chave de desenvolvimento.** Antes do primeiro MOD real, gere a de
produção e troque `mods.pub`. A chave de MOD é separada da do atualizador:
uma chave que atesta duas coisas deixa as duas se passarem uma pela outra
(ADR 0044).
