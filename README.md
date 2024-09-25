## Como publicar uma nova versão?

**1 - Abra um Pull Request (PR):** Crie um PR com as alterações necessárias.

**2 - Execute o comando de build:** No terminal, rode `npm run build` para gerar a nova versão do pacote.

**3 - Atualize a versão no package.json:** Verifique se o arquivo package.json foi atualizado automaticamente pelo build. Caso contrário, faça a alteração manualmente.

**4 - Descreva o PR:** Ao abrir o PR, forneça um contexto claro do que está sendo adicionado ou alterado.

**5 - Faça login no npm:** Autentique-se no npm com `npm login`, utilizando suas credenciais.

**6 - Publicação:** Após o PR ser aprovado e mesclado na branch principal (main), no terminal, execute `npm publish` para publicar a nova versão.
