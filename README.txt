
CON - Central Operacional News PRO v2.1 (Complete)
-------------------------------------------------

Estrutura:
- index.html
- assets/ (css, js, logo)
- data/ (fontes.json, rodovias.json, regioes.json)

Como publicar no GitHub Pages:
1. Crie um repositório no GitHub (público).
2. Faça upload do conteúdo desta pasta para a branch main.
3. Na Settings > Pages escolha 'Deploy from a branch' e selecione main / root (/).
4. Aguarde ~1 minuto e acesse: https://SEU_USUARIO.github.io/NOME-REPO/

Observações:
- O site busca feeds via rss2json (https://api.rss2json.com). Há limites de uso; se precisar, crie uma chave rss2json.
- A camada de rodovias tenta carregar o WFS do DNIT; dependendo do CORS do servidor, o mapa pode não carregar a malha automaticamente.
- Os marcadores são posicionados heuristically: preferem centro geométrico da BR quando o GeoJSON é carregado, ou centro aproximado do estado.
- Atualização automática configurada para 15 minutos.
