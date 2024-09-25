## Como publicar uma nova versão?

**1 - Execute o comando de build:** No terminal, rode `npm run build` para gerar a nova versão do pacote.

**2 - Verifique os arquivos:** Confirme se os arquivos foram criados corretamente após o build.

**3 - Abra um Pull Request (PR):** Crie um PR com as alterações necessárias.

**4 - Atualize a versão no package.json:** Verifique se o arquivo package.json foi atualizado automaticamente pelo build. Caso contrário, faça a mudança de versão do package (por exemplo: `1.0.7` para `1.0.8`).

**5 - Descreva o PR:** Ao abrir o PR, forneça um contexto claro do que está sendo adicionado ou alterado.

**6 - Faça login no npm:** Autentique-se no npm com `npm login`, utilizando suas credenciais.

**7 - Publicação:** Após o PR ser aprovado e mesclado na branch principal (main), no terminal, execute `npm publish` para publicar a nova versão.
