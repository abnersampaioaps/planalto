# Ativar o login com Google

A integração está preparada, mas **o login só funciona depois de configurar um projeto Firebase**. Não há um projeto de demonstração, identidade simulada ou credencial de terceiros no código.

## 1. Criar o projeto e o aplicativo Web

1. Abra o [console do Firebase](https://console.firebase.google.com/) com sua conta Google e crie um projeto para o jogo.
2. O Google Analytics não é necessário para esta integração.
3. Em **Configurações do projeto → Geral → Seus aplicativos**, registre um aplicativo **Web** (ícone `</>`).
4. Copie o objeto `firebaseConfig` exibido para esse aplicativo. Também é possível encontrá-lo depois em **Configuração do SDK → Configuração**.

## 2. Habilitar o Google

1. Abra **Authentication → Começar**, se ainda não estiver habilitado.
2. Em **Método de login / Sign-in method**, habilite **Google**, escolha o e-mail de suporte solicitado e salve.
3. Em **Authentication → Configurações → Domínios autorizados**, adicione:
   - `abnersampaioaps.github.io` para o endereço publicado deste repositório;
   - `localhost` se quiser testar localmente por HTTP;
   - o domínio próprio, caso passe a usar um.
4. Preserve o domínio `SEU_PROJETO.firebaseapp.com` fornecido pelo Firebase no campo `authDomain`. O caminho `/planalto/` não faz parte da lista de domínios autorizados.

Use o provedor Google criado pelo próprio Firebase. Não é necessário implementar um servidor de login ou colocar um segredo OAuth no site. Em projetos com configuração OAuth personalizada, confira também a tela de consentimento, os usuários de teste e o endereço de retorno conforme a documentação oficial.

## 3. Preencher o arquivo do jogo

No arquivo [`auth-config.js`](../auth-config.js), substitua `null` pelo objeto real fornecido pelo Firebase:

```js
window.PLANALTO_FIREBASE_CONFIG = {
  apiKey: 'VALOR_DO_SEU_PROJETO',
  authDomain: 'SEU_PROJETO.firebaseapp.com',
  projectId: 'SEU_PROJETO',
  appId: 'ID_DO_SEU_APLICATIVO_WEB'
};
```

Os valores acima são marcadores, não credenciais funcionais. Outros campos públicos do objeto, como `messagingSenderId` e `storageBucket`, podem ser mantidos. Não inclua **client secret, chave privada, JSON de conta de serviço ou credencial do Admin SDK**. Este arquivo é entregue ao navegador.

Publique `index.html`, `ui-v6.css`, `auth.js` e `auth-config.js` junto com os demais arquivos existentes do jogo. Não há etapa de build. A biblioteca oficial de Authentication é carregada do CDN do Firebase, na versão fixada em `auth.js`.

## 4. Testar

O endereço `file://` usado para abrir o HTML diretamente não oferece suporte a este login. Use a versão HTTPS publicada ou, para desenvolvimento:

```sh
python3 -m http.server 8000
```

Abra `http://localhost:8000` em um navegador comum, com `localhost` autorizado no projeto. Nenhum servidor é iniciado automaticamente pela integração.

1. Abra **Menu → Entrar com Google** ou o atalho na configuração inicial.
2. Clique no botão de login e escolha sua conta na janela oficial do Google.
3. Confira o nome e o e-mail retornados; recarregue para verificar a restauração da sessão.
4. Use **Minha conta → Sair da conta** e confirme que o jogo continua disponível.
5. Cancele um login e teste uma tentativa com popup bloqueado: a mensagem deve explicar o problema, sem simular uma conexão.

Se um navegador integrado bloquear o fluxo, abra o mesmo endereço no navegador externo. Se aparecer domínio não autorizado, confira o domínio em Authentication. Se aparecer provedor desativado, habilite Google. Evite iniciar várias tentativas enquanto a janela do Google estiver aberta.

## Escopo e validação

- Login opcional: o jogo continua funcionando sem conta, sem configuração e offline.
- A identidade vem do estado de autenticação do SDK oficial. O código não decodifica tokens para fingir uma sessão e não grava tokens em logs ou no salvamento do jogo.
- A sessão é administrada pelo Firebase. Sua persistência depende do armazenamento permitido pelo navegador.
- Partidas e estatísticas continuam locais e compartilhadas entre quem usa esse navegador. Entrar ou sair não migra, apaga, sincroniza nem separa esses dados por conta.
- Não há banco de dados remoto, ranking online ou envio de dados de campanha nesta entrega. Uma futura sincronização exigirá armazenamento e regras de acesso por usuário.
- Testes automatizados usam um SDK simulado para cobrir restauração, login, cancelamento, erros, repetição de cliques e logout. O fluxo real precisa ser validado com o projeto configurado; os testes não acessam contas Google.

Referências oficiais: [login Google no Firebase](https://firebase.google.com/docs/auth/web/google-signin), [SDK via CDN](https://firebase.google.com/docs/web/alt-setup), [persistência da autenticação](https://firebase.google.com/docs/auth/web/auth-state-persistence).
