## Build local

1. Instale o [GitHub CLI](https://cli.github.com/) e rode `gh auth login`.
2. `npm ci`
3. `npm run env:create`: cria o `.env` com o `FILE` preenchido.
4. Gere o seu token no Figma (*Settings → Security → Personal access tokens*):
   escopo **apenas File content: Read-only**, todo o resto **No access**.
   Cole o token em `TOKEN=` no `.env`. A sua conta precisa ter acesso ao arquivo de ícones.
5. `npm run build`

O `.env` está no `.gitignore`. Nunca faça commit dele.

## Como publicar uma nova versão

*Actions → Release Uai Icons → Run workflow*. O workflow baixa os ícones do
Figma, gera o pacote e o semantic-release publica a nova versão no npm.

A publicação no npm usa *trusted publishing* (OIDC, `id-token: write`), então não existe `NPM_TOKEN`.
A tag e a página de release no GitHub usam o `GITHUB_TOKEN` automático do Actions, sem token pessoal.

## Credenciais da CI

| Nome | Tipo | Conteúdo |
|---|---|---|
| `FIGMA_TOKEN` | secret | token do Figma usado pela CI |
| `FIGMA_FILE` | variable | id do arquivo de ícones no Figma |

Para trocar o token, use *Settings → Secrets and variables → Actions → FIGMA_TOKEN → Update*
ou rode `gh secret set FIGMA_TOKEN` e cole o token quando o comando pedir.
O secret não pode ser lido depois de gravado.

O token expira em até 90 dias.
Responsável atual: Luis Muniz · Expira em: 18/01/2027
