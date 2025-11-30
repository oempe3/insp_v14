# Formulário de Inspeção Interna e Externa – v14

Este pacote contém a versão atualizada do projeto de inspeções da UTE Pernambuco III, com:

- Separação de scripts: `script_interno.js` e `script_externo.js`
- Estruturas de dados internas e externas independentes:
  - `data_structure_interno.js`
  - `data_structure_externo.js`
- Ajustes nas janelas **Dados Iniciais** e **Anormalidades e observações**
- Lógica de carregamento da última inspeção para **Interna** e **Externa**
- Envio do relatório para Google Apps Script com retorno em **JSON** (`success`, `message`, `pdfUrl`)
- Pergunta opcional para compartilhamento do PDF via **WhatsApp**

## Arquivos principais

- `interno.html` – Formulário de inspeção interna
- `externo.html` – Formulário de inspeção externa
- `data_structure_interno.js` – Estrutura das janelas e campos da inspeção interna
- `data_structure_externo.js` – Estrutura das janelas e campos da inspeção externa
- `script_interno.js` – Lógica de front-end da inspeção interna
- `script_externo.js` – Lógica de front-end da inspeção externa
- `style.css` – Estilos visuais (layout estilo Flutter)
- `spinner.css` / `spinner.js` – Tela de carregamento
- `logo.png` – Logomarca UTE Pernambuco III

## Principais mudanças

### 1. Script separado (interno x externo)

- `interno.html` agora importa:
  - `data_structure_interno.js`
  - `spinner.js`
  - `script_interno.js`

- `externo.html` agora importa:
  - `data_structure_externo.js`
  - `spinner.js`
  - `script_externo.js`

Cada script usa seu próprio `STORAGE_KEY`, `LAST_NAMES_KEY` e `formType` fixo (`interno` ou `externo`).

### 2. Janela **Dados Iniciais**

Em **ambas** as inspeções:

- Removido o campo de **assinatura** da janela de dados iniciais (o campo ainda existe na planilha, mas não é exibido).
- Campos visíveis:
  - `hora_inicial`
  - `hora_final` (preenchido automaticamente)
  - `data`
  - `operador`
  - `supervisor`
  - `turma`

Os campos de **Turno** e **Status da Usina** continuam sendo injetados via `script_interno.js` / `script_externo.js`, como já estava no projeto anterior.

### 3. Janela **Anormalidades e observações**

- **Interna (`data_structure_interno.js`)**
  - 4 campos:
    - `descricao_1` – Descrição Anormalidade 1
    - `descricao_2` – Descrição Anormalidade 2
    - `observacao_1` – Observação 1
    - `observacao_2` – Observação 2

- **Externa (`data_structure_externo.js`)**
  - 4 campos (aproveitando as colunas já existentes da aba **Externa**):
    - `descricao_1` – Descrição Anomalia 1
    - `descricao_2` – Descrição Anomalia 2
    - `descricao_3` – Observação 1
    - `descricao_4` – Observação 2

Além disso:

- A janela **Anormalidades** **não carrega** dados da inspeção anterior (sempre começa vazia).

### 4. Carregar inspeção anterior

- **Interna**
  - Continua usando o WebApp `Carregar_INT` (action `getLastRecord`).
  - Função: `carregarUltimaInspecaoInterna()` em `script_interno.js`.

- **Externa**
  - Novo fluxo:
    - WebApp dedicado (exemplo: `Carregar_EXT`) lendo da aba **Externa**.
    - Função: `carregarUltimaInspecaoExterna()` em `script_externo.js`.
  - Ao salvar **Dados Iniciais**, aparece o `confirm()`:
    - “Deseja carregar dados da inspeção anterior?”
    - Se **Sim**, busca a última linha da aba correspondente e preenche todas as janelas (exceto **Anormalidades**).

### 5. Botão **Enviar Relatório Completo**

- Usa a mesma lógica do interno:
  - Valida janelas obrigatórias.
  - Consolida todos os campos em `dataToSend`.
  - Gera confirmação extra:
    - Interno: “Deseja realmente enviar o relatório INTERNA neste momento?”
    - Externo: “Deseja realmente enviar o relatório EXTERNA neste momento?”
  - Envia os dados para o Apps Script:
    - Interno → `SCRIPT_URL_INTERNA`
    - Externo → `SCRIPT_URL_EXTERNA`
  - Espera resposta JSON do Apps Script no formato:

```json
{
  "success": true,
  "message": "Relatório gerado e enviado com sucesso.",
  "pdfUrl": "https://..."
}
```

- Se **success = true**:
  - Salva cópia da inspeção em `inspectionData.previous`.
  - Limpa os dados atuais.
  - Mantém os últimos nomes de operador/supervisor (`localStorage`).
  - Pergunta:
    - “✅ Relatório enviado com sucesso! Deseja compartilhar o PDF pelo WhatsApp agora?”
  - Se **Sim** e houver `pdfUrl`, abre:
    - `https://wa.me/?text=...` com texto padronizado + link do PDF.
  - Depois exibe alerta final e recarrega a página.

### 6. WhatsApp (sem custos)

O envio por WhatsApp usa apenas o link público do PDF criado no Google Drive:

- **Nenhum serviço pago externo.**
- Apenas abre o WhatsApp Web / aplicativo com a mensagem pré-preenchida.

---

## Ajustes necessários no Google Apps Script

Os scripts do Apps Script (interna, externa e carregamento da última inspeção) devem ser atualizados para:

1. **Retornar JSON em vez de texto simples** (`ok`).
2. Incluir o `pdfUrl` do relatório gerado.

No corpo do Chat, foi enviado o código completo sugerido para:

- WebApp **Interna** (envio + geração de PDF)
- WebApp **Externa** (envio + geração de PDF)
- WebApp **Carregar_INT** (buscar última interna)
- WebApp **Carregar_EXT** (buscar última externa)

Use o código do Chat diretamente no editor do Google Apps Script.

