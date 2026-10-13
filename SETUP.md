# Cadu Motors — Checklist de implantação (saindo do Base44)

Siga nesta ordem. Cada passo diz exatamente onde clicar. Pare e me chame se
algum passo der um erro que não está previsto no "Se der problema" do fim.

## 0. O que você precisa ter em mãos

- [ ] Conta grátis na **Vercel** (vercel.com) — pode entrar com GitHub
- [ ] Conta grátis no **Supabase** (supabase.com)
- [ ] Conta no **GitHub** (github.com) — provavelmente você já tem
- [ ] Acesso ao **developers.facebook.com**, app "Cadu Motors Site" (já existe —
      Instagram App ID `1078142764728001`) pra pegar o **Client Secret**
- [ ] Acesso ao DNS do domínio **cadumotors.com** (onde ele foi registrado)

---

## 1. Criar o projeto no Supabase

1. supabase.com → **New Project**. Nome: `cadu-motors`. Senha do banco: gere
   uma forte e guarde (não precisa decorar, só salvar em algum lugar seguro).
   Região: `South America (São Paulo)` se disponível.
2. Espere o projeto provisionar (~2 min).
3. **Project Settings → API** → anote três valores:
   - `Project URL` → vai virar `VITE_SUPABASE_URL` e `SUPABASE_URL`
   - `anon public` key → vira `VITE_SUPABASE_ANON_KEY`
   - `service_role` key (clique em "Reveal") → vira `SUPABASE_SERVICE_ROLE_KEY`
     — **esta é secreta, nunca cole no código nem em lugar público.**
4. **SQL Editor** → cole o conteúdo inteiro de `supabase/migrations/0001_init.sql`
   (está neste projeto) → **Run**. Deve rodar sem erro.
5. **Storage** → confirme que o bucket `vehicle-photos` foi criado (o SQL já
   cria, mas confira) e que está marcado como **Public**.
6. **Authentication → Providers → Google** → ative, cole o Client ID/Secret
   de um OAuth do Google Cloud (se você já tem um projeto Google OAuth de
   outro app, pode reusar; se não, crie um rápido em
   console.cloud.google.com → APIs & Services → Credentials → OAuth Client ID,
   tipo "Web application", e adicione como Authorized redirect URI a URL que
   o próprio Supabase mostra nessa tela).
7. **Authentication → URL Configuration** → em "Site URL" e "Redirect URLs",
   coloque `https://cadumotors.com` (e também a URL temporária da Vercel, tipo
   `https://cadu-motors-app.vercel.app`, até o domínio final estar apontado).

## 2. Configurar o app do Meta (Instagram)

O app já existe (criado numa sessão anterior) — só precisa adicionar a nova
URL de callback:

1. developers.facebook.com → app **Cadu Motors Site** → **Instagram →
   Configuração da API com login do Instagram** → **Configurar login
   empresarial**.
2. Em **URIs de redirecionamento OAuth**, adicione (mantenha a antiga do
   Base44 também, não custa nada, mas a que importa agora é esta):
   ```
   https://cadumotors.com/api/instagram-oauth-callback
   ```
3. Copie o **ID do app do Instagram** (`1078142764728001`) e a **Chave
   secreta** — vão virar `INSTAGRAM_APP_ID` e `INSTAGRAM_APP_SECRET`.

## 3. Publicar na Vercel

1. Suba esta pasta (`cadu-motors-app/`) pra um repositório no GitHub (pode ser
   privado). Se não souber fazer isso, me chame que eu te guio com o Git.
2. vercel.com → **Add New → Project** → importe esse repositório.
3. Em **Environment Variables**, adicione todas as do arquivo `.env.example`
   com os valores reais que você coletou nos passos 1 e 2:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `INSTAGRAM_APP_ID`
   - `INSTAGRAM_APP_SECRET`
   - `PUBLIC_SITE_URL` → coloque `https://cadumotors.com` desde já (mesmo
     antes do domínio estar apontado — a Vercel aceita o deploy normalmente)
   - `CRON_SECRET` → invente uma string longa e aleatória (ex.: peça pro
     navegador gerar uma senha forte de 40 caracteres e use ela)
4. **Deploy**. Em alguns minutos você tem uma URL tipo
   `https://cadu-motors-app.vercel.app` já funcionando.
5. Teste essa URL: a home deve carregar (sem veículos ainda, tudo bem).
   Faça login em `/login` com "Continuar com o Google" usando
   `vvsoave@gmail.com` ou `motorscadu@gmail.com` — deve entrar como admin
   automaticamente (a tabela `admin_emails` já tem os dois).

## 4. Migrar os dados e fotos do Base44

No seu computador, dentro da pasta `cadu-motors-app/`:

1. Crie um arquivo `.env.local` (copie de `.env.example`) e preencha
   `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` com os valores reais.
2. `npm install`
3. `npm run migrate-data`
4. Acompanhe o log — ele avisa quais veículos não conseguiu recuperar foto
   (posts antigos cujo link do Instagram já expirou). Esses você resolve
   depois no Admin → Editar, subindo a foto na mão (ou esperando o próximo
   post do Instagram se o anúncio ainda estiver lá).

## 5. Apontar o domínio cadumotors.com pra Vercel

1. Vercel → seu projeto → **Settings → Domains** → adicione `cadumotors.com`.
   Ele mostra um registro DNS (tipo A ou CNAME) pra configurar.
2. No painel onde o domínio foi registrado, troque o DNS atual (que aponta
   pro Base44/Render) pelo que a Vercel pediu.
3. Espera a propagação (minutos a poucas horas) — eu posso te ajudar a
   verificar quando terminar.

## 6. Ligar a automação (GitHub Actions)

1. No repositório do GitHub → **Settings → Secrets and variables → Actions**
   → **New repository secret**, crie dois:
   - `SITE_URL` = `https://cadumotors.com`
   - `CRON_SECRET` = o mesmo valor que você colocou na Vercel no passo 3
2. Os workflows já estão no projeto (`.github/workflows/sync-instagram.yml` e
   `refresh-instagram-token.yml`) — assim que o repositório tiver esses
   secrets, eles começam a rodar sozinhos no horário.
3. Pra testar sem esperar: GitHub → aba **Actions** → escolha o workflow →
   **Run workflow** (botão manual).

## 7. Conectar o Instagram de verdade

1. Acesse `https://cadumotors.com/admin/instagram` logado como admin.
2. Clique em **Conectar conta**, autorize com @cadu.motors.
3. Clique em **Sincronizar** pra confirmar que está trazendo os posts.

## 8. Só agora: cancelar o Base44

Só faça isso depois de confirmar que `cadumotors.com` está servindo o site
novo, o admin funciona, o Instagram está conectado e um ciclo do GitHub
Actions já rodou com sucesso. Base44 → Settings → Plan & Subscriptions →
cancelar.

---

## Se der problema

- **Build falha na Vercel** → geralmente é uma variável de ambiente faltando
  ou um import quebrado. Manda o log de erro que eu olho.
- **Login com Google não funciona** → confira se a "Redirect URL" no Google
  Cloud bate exatamente com a que o Supabase pede em Authentication →
  Providers → Google.
- **Botão "Conectar conta" do Instagram dá erro** → confira
  `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` na Vercel e se a redirect URI
  do passo 2 foi salva certinha no Meta.
- **GitHub Actions falha** → confira os secrets `SITE_URL` e `CRON_SECRET` —
  têm que ser exatamente iguais aos da Vercel.
