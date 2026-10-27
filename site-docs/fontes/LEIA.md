# As oito faces

Copiadas de `SEELE/apps/seele-app/ui/fontes/`:

    saira-condensed-500.woff2  saira-condensed-700.woff2  saira-condensed-900.woff2
    ibm-plex-mono-400.woff2    ibm-plex-mono-500.woff2    ibm-plex-mono-600.woff2
    noto-sans-jp-700.woff2     noto-sans-jp-900.woff2

Junto com `LICENCA-*.txt` e `PROCEDENCIA.md`, que não são opcionais.

**Por que não vêm do Google Fonts.** O app não pode — a CSP é
`default-src 'self'`. O indexador poderia, e não deve: seria um segundo
terceiro vendo quem pediu o quê, num produto cujo argumento é não ter
serviço no meio.

Sem elas a página cai nos fallbacks e fica feia. Funciona.
