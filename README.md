# MetaSmart - Controle de Vendas e Metas

Aplicativo inteligente de controle de vendas, metas e projeções financeiras, focado em produtividade e simplicidade.

## 🚀 Funcionalidades

- **Controle de Vendas:** Lançamento rápido com categorias e observações.
- **Metas Inteligentes:** Cálculo automático de quanto você precisa vender por dia com base nos dias trabalhados.
- **Calendário de Trabalho:** Defina quais dias você trabalha para projeções precisas.
- **Gráficos e Histórico:** Evolução semanal, mensal e distribuição por categorias.
- **100% Local:** Todos os dados são salvos no `LocalStorage` do seu dispositivo.

## 📱 Mobile (Capacitor v6)

Este projeto está configurado com Capacitor v6 para rodar como um aplicativo Android nativo.

### Comandos Mobile:

- `npm run build:mobile`: Gera o build web e sincroniza com o Android.
- `npm run cap:open-android`: Abre o projeto no Android Studio.
- `npm run cap:sync`: Sincroniza plugins e recursos web com o projeto nativo.

## 🛠️ GitHub Actions

O projeto inclui um workflow automático em `.github/workflows/build-apk.yml`.
Ao fazer push para a branch `main`, o GitHub gerará automaticamente um APK de debug para você na aba **Actions**.

## 💻 Tech Stack

- **React 19** + **Vite**
- **Tailwind CSS 4**
- **Recharts** (Gráficos)
- **Lucide React** (Ícones)
- **Motion** (Animações)
- **Capacitor 6** (Native Android)
