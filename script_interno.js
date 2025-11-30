// ============ CONSTANTES E VARIÁVEIS GLOBAIS ============
// A FORM_STRUCTURE é carregada de 'data_structure_interno.js'
const JUMP_MENU_TAGS = []; // Array para armazenar os tags dos equipamentos

// Identifica o tipo de formulário a partir do atributo data-form-type no <body>.
const formType = 'interno';
const STORAGE_KEY = 'inspecao_dados_interno';
const LAST_NAMES_KEY = 'inspecao_nomes_interno';


// URL para carregar última inspeção (Interna)
const SCRIPT_URL_CARREGAR_INTERNA =
  'https://script.google.com/macros/s/AKfycbzwbNHEWGZiraZDQWpfzb6qMHUTnSMy_bC6naTppcLn7hWHKnpXxaHBgjwhoB9jtIk3/exec';

// URLs dos WebApps do Google Apps Script para envio dos relatórios.
const SCRIPT_URL_INTERNA =
  'https://script.google.com/macros/s/AKfycbzhfNsjAGEgp93CgL34uxhF27ZAsbQAbEEvtfH3ZQCV1BtHCiuosif64bRlRx8sK1cH-g/exec';
const SCRIPT_URL_EXTERNA =
  'https://script.google.com/macros/s/AKfycbxpU9oTqUKpRnSaPu2Ywtj3IhJnH4PEzULkPEnjQpFAiwsepAdONhTlNdmVIesWAAxPNA/exec';

let currentWindowId = null;
let inspectionData = loadData();
let lastNames = loadLastNames();

// VARIÁVEL CRÍTICA: Armazena objetos File/Blob dos inputs de arquivo e da assinatura.
window.fileStorage = {};

// Ajustes adicionais na estrutura após carregamento de FORM_STRUCTURE
if (typeof FORM_STRUCTURE !== 'undefined') {
  // 1. Janela Dados Iniciais: adicionar Turno e Status da usina
  if (FORM_STRUCTURE['dados-iniciais']) {
    const di = FORM_STRUCTURE['dados-iniciais'];
    di.title = di.title || 'Dados iniciais';
    const fields = di.fields || [];

    const turnoField = {
      name: 'turno',
      label: 'Turno',
      type: 'select',
      options: ['07h as 15h', '15h as 23h', '23h as 07h'],
      required: true
    };

    const statusUsinaField = {
      name: 'status_usina',
      label: 'Status da usina',
      type: 'select',
      options: ['QUENTE ♨️', 'FRIA ❄️', 'OPERANDO🚀'],
      required: true
    };

    const idxTurma = fields.findIndex(f => f.name === 'turma');
    let insertIndex = idxTurma >= 0 ? idxTurma + 1 : fields.length;
    fields.splice(insertIndex, 0, turnoField, statusUsinaField);
    di.fields = fields;
  }

  // 2. Janela Anormalidades: renomear e adicionar Observações 1 e 2
  if (FORM_STRUCTURE['anormalidades']) {
    const an = FORM_STRUCTURE['anormalidades'];
    an.title = 'Anormalidades e observações';
    an.fields = an.fields || [];
    an.fields.push(
      {
        name: 'observacao_1',
        label: 'Observação 1',
        type: 'textarea',
        placeholder: 'Descreva a observação 1',
        required: false
      },
      {
        name: 'observacao_2',
        label: 'Observação 2',
        type: 'textarea',
        placeholder: 'Descreva a observação 2',
        required: false
      }
    );
  }
}

// ============ FUNÇÕES UTILITÁRIAS BÁSICAS ============

/**
 * Gera uma cor HSL com matizes diferentes para cada índice de tag.
 */
function generateTagColor(index, total) {
  const hue = Math.floor((index / Math.max(total, 1)) * 360);
  return `hsl(${hue}, 60%, 50%)`;
}

/**
 * Constrói o menu horizontal de tags para navegar entre equipamentos repetitivos.
 */
function createTagMenu(tags) {
  if (!tags || tags.length === 0) return null;
  const menu = document.createElement('div');
  menu.className = 'tag-menu';
  const total = tags.length;
  tags.forEach((tagItem, index) => {
    const span = document.createElement('span');
    span.className = 'tag-item';
    span.textContent = tagItem.tag;
    span.style.backgroundColor = generateTagColor(index, total);
    span.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.querySelectorAll('.tag-item').forEach(item => item.classList.remove('active'));
      span.classList.add('active');
      const target = document.getElementById(tagItem.id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.classList.add('highlight');
        setTimeout(() => target.classList.remove('highlight'), 1500);
      }
    });
    menu.appendChild(span);
  });
  const first = menu.querySelector('.tag-item');
  if (first) first.classList.add('active');
  return menu;
}

function getCurrentDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getCurrentTime() {
  const now = new Date();
  try {
    // Força horário de Brasília independentemente do fuso do dispositivo
    return now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo'
    });
  } catch (e) {
    // Fallback caso o navegador não suporte timeZone
    return now.toTimeString().slice(0, 5);
  }
}

function setFinalTime() {
  const finalTimeField = document.getElementById('dados-iniciais-hora_final');
  if (finalTimeField) {
    finalTimeField.value = getCurrentTime();
  }
}

function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadLastNames() {
  const stored = localStorage.getItem(LAST_NAMES_KEY);
  return stored ? JSON.parse(stored) : { operador: '', supervisor: '' };
}

function saveLastNames(names) {
  localStorage.setItem(LAST_NAMES_KEY, JSON.stringify(names));
}

function getStatusColorClass(status) {
  if (!status) return '';
  const normalized = status.toString().toUpperCase();
  if (normalized === 'OPE') return 'ope';
  if (normalized === 'ST-BY' || normalized === 'STBY') return 'st-by';
  if (normalized === 'MNT' || normalized === 'MANUTENCAO' || normalized === 'MANUTENÇÃO') return 'mnt';
  if (normalized === 'NORMAL') return 'normal';
  if (normalized === 'FALHA') return 'falha';
  if (normalized === 'LIGADO') return 'ligado';
  if (normalized === 'DESLIGADO') return 'desligado';
  return '';
}

/**
 * Verifica se todos os campos obrigatórios de uma janela foram preenchidos.
 * CRÍTICO: Para campos de arquivo, verifica a flag de preenchimento.
 */
function checkWindowCompletion(windowId) {
  const windowFields = FORM_STRUCTURE[windowId].fields;
  if (!inspectionData[windowId]) return false;
  return windowFields.every(field => {
    if (field.required) {
      const value = inspectionData[windowId][field.name];
      if (field.type === 'file' || field.type === 'signature') {
        return (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          (typeof value === 'string') &&
          (value.startsWith('FILE_SET_') || value.startsWith('data:image'))
        );
      }
      return value !== undefined && value !== null && value !== '';
    }
    return true;
  });
}

function updateCompletionStatus() {
  let allCompleted = true;
  Object.keys(FORM_STRUCTURE).forEach(windowId => {
    const button = document.querySelector(`[data-window="${windowId}"]`);
    if (button) {
      const isCompleted = checkWindowCompletion(windowId);
      button.classList.toggle('completed', isCompleted);
      if (!isCompleted) {
        allCompleted = false;
      }
    }
  });
  const submitBtn = document.getElementById('submitReport');
  if (submitBtn) {
    submitBtn.disabled = !allCompleted;
  }
}

// ============ GERAÇÃO DE HTML DO FORMULÁRIO ============

/**
 * Cria o HTML para um único campo de formulário com base na sua configuração.
 */
function createFieldHTML(fieldConfig, currentValue) {
  const fieldId = `${currentWindowId}-${fieldConfig.name}`;
  const value =
    currentValue !== undefined && currentValue !== null ? currentValue : fieldConfig.default || '';
  const required = fieldConfig.required ? 'required' : '';
  const readonly = fieldConfig.readonly ? 'readonly' : '';
  const placeholder = fieldConfig.placeholder || '';
  const labelText = fieldConfig.label + (fieldConfig.required ? ' *' : '');
  const config = FORM_STRUCTURE[currentWindowId] || {};
  const titleLower = (config.title || '').toLowerCase();
  const labelLower = (fieldConfig.label || '').toLowerCase();

  const isDadosIniciais = titleLower.includes('dados iniciais');
  let inputHTML = '';
  let indicatorHTML = '';
  let unitHTML = '';
  let helpHTML = '';

  // Campos de hora inicial/final em Dados Iniciais: mantidos, porém ocultos
  if (isDadosIniciais && (fieldConfig.name === 'hora_inicial' || fieldConfig.name === 'hora_final')) {
    inputHTML = `<input type="hidden" id="${fieldId}" name="${fieldConfig.name}" data-field-name="${fieldConfig.name}" value="${value}">`;
    return `<div class="form-group" id="group-${fieldId}" style="display:none;">${inputHTML}</div>`;
  }

  // Indicador de status
  if (fieldConfig.type === 'status') {
    indicatorHTML = `<span id="indicator-${fieldId}" class="status-indicator ${getStatusColorClass(
      value
    )}"></span>`;
  }

  // Unidade
  if (fieldConfig.unit) {
    unitHTML = `<span class="unit">${fieldConfig.unit}</span>`;
  }

  switch (fieldConfig.type) {
    case 'text':
    case 'number':
    case 'date':
    case 'time':
      inputHTML = `<input type="${fieldConfig.type}" id="${fieldId}" name="${fieldConfig.name}" data-field-name="${fieldConfig.name}" value="${value}" ${required} ${readonly} placeholder="${placeholder}" ${
        fieldConfig.digits ? `maxlength="${fieldConfig.digits}"` : ''
      } onchange="handleFieldChange('${fieldConfig.name}', this.value)">`;
      break;

    case 'textarea': {
      const isDescricaoAnormalidade = /anormalidade|observa/i.test(fieldConfig.label || '');
      const textareaHTML = `<textarea id="${fieldId}" name="${fieldConfig.name}" data-field-name="${fieldConfig.name}" ${required} placeholder="${placeholder}" rows="3" onchange="handleFieldChange('${fieldConfig.name}', this.value)">${value}</textarea>`;
      const micButton = isDescricaoAnormalidade
        ? `<button type="button" class="mic-button" onclick="startDictation('${fieldId}')">🎙️</button>`
        : '';
      inputHTML = `<div class="textarea-with-mic">${textareaHTML}${micButton}</div>`;
      break;
    }

    case 'select':
      inputHTML = `<select id="${fieldId}" name="${fieldConfig.name}" data-field-name="${fieldConfig.name}" ${required} onchange="handleFieldChange('${fieldConfig.name}', this.value)">`;
      inputHTML += `<option value="" disabled ${value === '' ? 'selected' : ''}>Selecione...</option>`;
      fieldConfig.options.forEach(option => {
        const selected = option.toString() === value.toString() ? 'selected' : '';
        inputHTML += `<option value="${option}" ${selected}>${option}</option>`;
      });
      inputHTML += `</select>`;
      break;

        case 'range': {
      const rangeMin = fieldConfig.min ?? 0;
      const rangeMax = fieldConfig.max ?? 100;
      const displayValue = value === '' ? (fieldConfig.default ?? rangeMin) : value;

      const isNivelOleoGovernor =
        labelLower.includes('óleo governor') || labelLower.includes('oleo governor');
      const isNivelCarter =
        labelLower.includes('nível do cárter') || labelLower.includes('nivel do carter');
      const isTanqueExpansao =
        labelLower.includes('tanque de expansão') || labelLower.includes('tanque de expansao');
      const isNivelMancalAcoplado = labelLower.includes('mancal acoplado');
      const isNivelMancalNaoAcoplado =
        labelLower.includes('mancal não acoplado') || labelLower.includes('mancal nao acoplado');
      const isNivelCarterSep =
        labelLower.includes('nível cárter') || labelLower.includes('nivel carter');

      // Novos integradores especiais
      const isPressaoAr =
        labelLower.includes('pressão de ar') || labelLower.includes('pressao de ar');
      const titleLowerLocal = (config.title || '').toLowerCase();
      const isSeparadora = titleLowerLocal.includes('separadora');

      const isVazaoSepOL =
        isSeparadora && (labelLower.includes('vazão') || labelLower.includes('vazao'));
      const isTempSepOL =
        isSeparadora && labelLower.includes('temp');
      const isRotacaoSepOL =
        isSeparadora && labelLower.includes('rotação');

      const useIntegrator =
        isNivelOleoGovernor ||
        isNivelCarter ||
        isTanqueExpansao ||
        isNivelMancalAcoplado ||
        isNivelMancalNaoAcoplado ||
        isNivelCarterSep ||
        isPressaoAr ||
        isVazaoSepOL ||
        isTempSepOL ||
        isRotacaoSepOL;

      if (useIntegrator) {
        if (isRotacaoSepOL) {
          // Integrador duplo para rotação: ±100 e ±1000 RPM
          inputHTML = `
          <div class="integrator-container integrator-rotacao">
            <button type="button" class="integrator-btn" onclick="adjustIntegrator('${fieldId}', '${fieldConfig.name}', -1000, ${rangeMin}, ${rangeMax})">−1000</button>
            <button type="button" class="integrator-btn" onclick="adjustIntegrator('${fieldId}', '${fieldConfig.name}', -100, ${rangeMin}, ${rangeMax})">−100</button>
            <span class="integrator-value" id="display-${fieldId}">${displayValue}</span>
            ${unitHTML}
            <button type="button" class="integrator-btn" onclick="adjustIntegrator('${fieldId}', '${fieldConfig.name}', 100, ${rangeMin}, ${rangeMax})">+100</button>
            <button type="button" class="integrator-btn" onclick="adjustIntegrator('${fieldId}', '${fieldConfig.name}', 1000, ${rangeMin}, ${rangeMax})">+1000</button>
          </div>
          <input type="hidden" id="${fieldId}" name="${fieldConfig.name}" data-field-name="${fieldConfig.name}" value="${displayValue}">
          `;
        } else {
          // Integrador simples com step ajustado
          let step = 10;
          if (isNivelCarter) {
            step = 1;
          } else if (isPressaoAr) {
            step = 0.2;
          } else if (isVazaoSepOL) {
            step = 100;
          } else if (isTempSepOL) {
            step = 5;
          }
          inputHTML = `
          <div class="integrator-container">
            <button type="button" class="integrator-btn" onclick="adjustIntegrator('${fieldId}', '${fieldConfig.name}', -${step}, ${rangeMin}, ${rangeMax})">−</button>
            <span class="integrator-value" id="display-${fieldId}">${displayValue}</span>
            ${unitHTML}
            <button type="button" class="integrator-btn" onclick="adjustIntegrator('${fieldId}', '${fieldConfig.name}', ${step}, ${rangeMin}, ${rangeMax})">+</button>
          </div>
          <input type="hidden" id="${fieldId}" name="${fieldConfig.name}" data-field-name="${fieldConfig.name}" value="${displayValue}">
          `;
        }
        // Evita unidade duplicada no label
        unitHTML = '';
      } else {
        const rangeStep = fieldConfig.step || 1;
        inputHTML = `
          <div class="range-container">
            <input type="range" id="${fieldId}" name="${fieldConfig.name}" data-field-name="${fieldConfig.name}" min="${rangeMin}" max="${rangeMax}" step="${rangeStep}" value="${displayValue}" 
                   oninput="document.getElementById('display-${fieldId}').textContent=this.value; handleFieldChange('${fieldConfig.name}', this.value)" ${required}>
            <span class="range-value" id="display-${fieldId}">${displayValue}</span>
            ${unitHTML}
          </div>
        `;
        unitHTML = '';
      }
      break;
    }

    case 'status':
      inputHTML = `<select id="${fieldId}" name="${fieldConfig.name}" data-field-name="${fieldConfig.name}" ${required} onchange="updateStatusIndicator('${fieldId}', this.value); handleFieldChange('${fieldConfig.name}', this.value)">`;
      inputHTML += `<option value="" disabled ${value === '' ? 'selected' : ''}>Status...</option>`;
      fieldConfig.options.forEach(option => {
        const selected = option.toString() === value.toString() ? 'selected' : '';
        inputHTML += `<option value="${option}" ${selected}>${option}</option>`;
      });
      inputHTML += `</select>`;
      break;

    case 'file': {
      const fileSet = value && typeof value === 'string' && value.startsWith('FILE_SET_');
      const fileStatusText = fileSet ? 'Arquivo Selecionado' : 'Nenhum arquivo';
      const fileStatusClass = fileSet ? 'file-set' : 'file-unset';

      inputHTML = `
        <input type="file" id="${fieldId}" name="${fieldConfig.name}" data-field-name="${fieldConfig.name}" ${required} accept="${fieldConfig.accept || ''}"
          onchange="document.getElementById('status-${fieldId}').textContent=this.files.length > 0 ? 'Arquivo Selecionado: ' + this.files[0].name : 'Nenhum arquivo';
                   document.getElementById('status-${fieldId}').className=this.files.length > 0 ? 'file-status file-set' : 'file-status file-unset';
                   handleFileChange(this, '${fieldConfig.name}')">
        <label for="${fieldId}" class="custom-file-upload">
          Escolher Arquivo
        </label>
        <span id="status-${fieldId}" class="file-status ${fileStatusClass}">${fileStatusText}</span>
      `;
      break;
    }

    case 'signature':
      inputHTML = `
        <div class="signature-pad-container">
          <canvas id="${fieldId}_canvas" class="signature-canvas" width="300" height="100"></canvas>
          <input type="hidden" id="${fieldId}" name="${fieldConfig.name}" data-field-name="${fieldConfig.name}" value="${value}" ${required}>
          <button type="button" class="clear-signature">Limpar Assinatura</button>
        </div>
      `;
      helpHTML = `<small class="help-text">Assine no quadro acima</small>`;
      break;

    default:
      inputHTML = `<input type="text" id="${fieldId}" name="${fieldConfig.name}" data-field-name="${fieldConfig.name}" value="${value}" ${required} ${readonly} placeholder="${placeholder}" onchange="handleFieldChange('${fieldConfig.name}', this.value)">`;
  }

  // Estrutura o HTML do grupo de formulário
  return `
    <div class="form-group" id="group-${fieldId}">
      <label for="${fieldId}">
        ${indicatorHTML}
        ${labelText}
        ${unitHTML}
      </label>
      <div class="input-wrapper">${inputHTML}</div>
      ${helpHTML}
    </div>
  `;
}

/**
 * Gera o formulário para a janela (modal) e o exibe.
 */
function generateForm(windowId) {
  currentWindowId = windowId;
  const config = FORM_STRUCTURE[windowId];
  const modalBody = document.getElementById('formFields');
  const modalTitle = document.getElementById('modalTitle');
  const modalOverlay = document.getElementById('modalOverlay');
  const tagMenuModal = document.getElementById('tagMenuModal');

  if (!config || !modalBody || !modalTitle || !modalOverlay) return;

  modalTitle.textContent = config.title;

  let formContent = '';
  const currentData = windowId === 'anormalidades' ? {} : (inspectionData[windowId] || {});
  const jumpTags = [];

  config.fields.forEach(field => {
    if (field.tag) {
      jumpTags.push({ tag: field.tag, id: `group-${currentWindowId}-${field.name}` });
    }
    const value = currentData[field.name];
    formContent += createFieldHTML(field, value);
  });

  modalBody.innerHTML = formContent;

  tagMenuModal.innerHTML = '';
  if (jumpTags.length > 0) {
    const menu = createTagMenu(jumpTags);
    if (menu) {
      tagMenuModal.appendChild(menu);
      tagMenuModal.style.display = 'flex';
    } else {
      tagMenuModal.style.display = 'none';
    }
  } else {
    tagMenuModal.style.display = 'none';
  }

  modalOverlay.classList.add('active');

  initializeSignatures();
  initializeAutomaticFields(windowId);
}

// ============ MANIPULAÇÃO DE CAMPOS ============

/**
 * Campo simples (texto, número, etc.)
 */
window.handleFieldChange = function (fieldName, value) {
  if (!inspectionData[currentWindowId]) {
    inspectionData[currentWindowId] = {};
  }
  inspectionData[currentWindowId][fieldName] = value;
  saveData(inspectionData);

  if (
    FORM_STRUCTURE[currentWindowId].fields.find(f => f.name === fieldName && f.type === 'status')
  ) {
    const fieldId = `${currentWindowId}-${fieldName}`;
    updateStatusIndicator(fieldId, value);
  }
};

/**
 * Campo de arquivo
 */
window.handleFileChange = function (inputElement, fieldName) {
  if (!inspectionData[currentWindowId]) {
    inspectionData[currentWindowId] = {};
  }

  if (inputElement.files.length > 0) {
    const file = inputElement.files[0];
    window.fileStorage[fieldName] = file;
    inspectionData[currentWindowId][fieldName] = `FILE_SET_${fieldName}`;
  } else {
    delete window.fileStorage[fieldName];
    inspectionData[currentWindowId][fieldName] = '';
  }
  saveData(inspectionData);
};

/**
 * Preenche automáticos em Dados Iniciais
 */
function initializeAutomaticFields(windowId) {
  if (windowId !== 'dados-iniciais') return;

  const dataField = document.getElementById('dados-iniciais-data');
  if (dataField && !dataField.value) {
    const hoje = getCurrentDate();
    dataField.value = hoje;
    handleFieldChange('data', hoje);
  }

  const operadorField = document.getElementById('dados-iniciais-operador');
  const supervisorField = document.getElementById('dados-iniciais-supervisor');

  if (operadorField && lastNames.operador && !operadorField.value) {
    operadorField.value = lastNames.operador;
    handleFieldChange('operador', lastNames.operador);
  }
  if (supervisorField && lastNames.supervisor && !supervisorField.value) {
    supervisorField.value = lastNames.supervisor;
    handleFieldChange('supervisor', lastNames.supervisor);
  }
}

// Atualiza indicador de status
window.updateStatusIndicator = function (fieldId, value) {
  const indicator = document.getElementById(`indicator-${fieldId}`);
  if (indicator) {
    indicator.className = 'status-indicator ' + getStatusColorClass(value);
  }
};

// ============ EVENTOS PRINCIPAIS ============

function handleWindowClick(event) {
  const button = event.currentTarget;
  const windowId = button.dataset.window;
  generateForm(windowId);
}

/**
 * Salva os dados da janela (modal)
 */
function handleFormSubmit(event) {
  event.preventDefault();
  const windowForm = document.getElementById('windowForm');
  const formData = new FormData(windowForm);
  const data = {};
  const windowFields = FORM_STRUCTURE[currentWindowId].fields;

  windowFields.forEach(field => {
    const formValue = formData.get(field.name);

    if (field.type === 'file') {
      if (formValue instanceof File && formValue.size > 0) {
        data[field.name] = `FILE_SET_${field.name}`;
      } else if (
        inspectionData[currentWindowId] &&
        inspectionData[currentWindowId][field.name] &&
        inspectionData[currentWindowId][field.name].startsWith('FILE_SET')
      ) {
        data[field.name] = inspectionData[currentWindowId][field.name];
      } else {
        data[field.name] = '';
      }
    } else if (field.type === 'signature') {
      data[field.name] = formValue || '';
    } else if (formValue !== null) {
      data[field.name] = formValue;
    }
  });

  if (currentWindowId === 'dados-iniciais') {
    if (!data.hora_inicial) {
      data.hora_inicial = getCurrentTime();
    }
    lastNames.operador = data.operador || '';
    lastNames.supervisor = data.supervisor || '';
    saveLastNames(lastNames);
  }

  inspectionData[currentWindowId] = data;
  saveData(inspectionData);

  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
  updateCompletionStatus();

  if (currentWindowId === 'dados-iniciais') {
    setTimeout(() => {
      const desejaCarregar = confirm('Deseja carregar dados da inspeção anterior?');
      if (desejaCarregar) {
        carregarUltimaInspecaoInterna();
      }
    }, 50);
  }
}

/**
 * Envia relatório completo
 */
function handleReportSubmit() {
  const submitBtn = document.getElementById('submitReport');
  if (submitBtn && submitBtn.disabled) {
    alert('Por favor, preencha todas as janelas obrigatórias antes de enviar o relatório.');
    return;
  }

  if (typeof showSpinner === 'function') {
    showSpinner('Enviando relatório, aguarde...');
  }

  const newInspectionData = { ...inspectionData };
  Object.keys(FORM_STRUCTURE).forEach(windowId => {
    const cfg = FORM_STRUCTURE[windowId];
    if (cfg && cfg.required && !newInspectionData[windowId]) {
      newInspectionData[windowId] = { completed: false };
    }
  });

  const dataToSend = {};
  Object.keys(newInspectionData).forEach(key => {
    if (key === 'previous') return;
    const windowData = newInspectionData[key];
    if (!windowData || typeof windowData !== 'object') return;

    Object.keys(windowData).forEach(fieldName => {
      if (fieldName === 'completed') return;
      const fieldValue = windowData[fieldName];
      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        dataToSend[fieldName] = fieldValue;
      }
    });
  });

  // Garante que dados iniciais existam
  if (!dataToSend.data || !dataToSend.operador) {
    alert('Preencha os dados iniciais (Data e Operador) antes de enviar o relatório.');
    if (typeof hideSpinner === 'function') hideSpinner();
    return;
  }

  // Confirmação extra para INTERNA
  const confirmarEnvio = confirm('Deseja realmente enviar o relatório INTERNA neste momento?');
  if (!confirmarEnvio) {
    if (typeof hideSpinner === 'function') hideSpinner();
    return;
  }

  sendReportToScript('interno', dataToSend)
    .then(response => {
      if (typeof hideSpinner === 'function') {
        hideSpinner();
      }
      if (!response.ok) {
        throw new Error('Falha HTTP ao enviar dados: ' + response.status);
      }
      return response.json().catch(() => ({ success: false, message: 'Resposta inválida do servidor.' }));
    })
    .then(result => {
      if (!result || result.success === false) {
        throw new Error(result && result.message ? result.message : 'Falha ao processar o retorno do servidor.');
      }

      const pdfUrl = result.pdfUrl || '';

      inspectionData.previous = { ...inspectionData };
      Object.keys(inspectionData).forEach(key => {
        if (key !== 'previous') {
          delete inspectionData[key];
        }
      });

      saveData({});
      lastNames = {
        operador: dataToSend.operador || '',
        supervisor: dataToSend.supervisor || ''
      };
      saveLastNames(lastNames);

      const compartilhar = confirm('✅ Relatório enviado com sucesso!\n\nDeseja compartilhar o PDF pelo WhatsApp agora?');
      if (compartilhar && pdfUrl) {
        const msg = `Relatório de inspeção INTERNA - ${dataToSend.data || ''} - Operador: ${dataToSend.operador || ''}\n${pdfUrl}`;
        const waUrl = 'https://wa.me/?text=' + encodeURIComponent(msg);
        window.open(waUrl, '_blank');
      }

      alert('✅ Relatório enviado com sucesso! O formulário foi limpo para uma nova inspeção.');
      window.location.reload();
    })
    .catch(err => {
      if (typeof hideSpinner === 'function') {
        hideSpinner();
      }
      console.error(err);
      alert('Erro ao enviar relatório: ' + err.message);
    });
}

      saveData(newInspectionData);
      alert('✅ Relatório enviado com sucesso! O formulário foi limpo para uma nova inspeção.');
      window.location.reload();
    })
    .catch(err => {
      if (typeof hideSpinner === 'function') {
        hideSpinner();
      }
      console.error(err);
      alert('❌ Ocorreu um erro ao enviar o relatório. Detalhes: ' + err.message);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '📤 Enviar Relatório Completo';
      }
    });
}

// ============ FUNÇÕES DE ENVIOS E CONVERSÃO ============

function base64ToBlob(base64String) {
  const parts = base64String.split(';base64,');
  if (parts.length < 2) return null;

  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Envia objeto de dados da inspeção para o Apps Script.
 */
async function sendReportToScript(formType, data) {
  const url = formType === 'interno' ? SCRIPT_URL_INTERNA : SCRIPT_URL_EXTERNA;
  const formData = new FormData();
  const allWindowFields = Object.values(FORM_STRUCTURE).flatMap(w => w.fields);

  Object.keys(data).forEach(windowId => {
    if (windowId === 'previous') return;
    const windowData = data[windowId];

    Object.keys(windowData).forEach(key => {
      const value = windowData[key];
      const fieldConfig = allWindowFields.find(f => f.name === key);

      if (value !== undefined && value !== null) {
        if (
          fieldConfig &&
          fieldConfig.type === 'signature' &&
          typeof value === 'string' &&
          value.startsWith('data:image')
        ) {
          try {
            const blob = base64ToBlob(value);
            if (blob) {
              formData.append(key, blob, `${key}.png`);
            }
          } catch (e) {
            console.error(`Erro ao converter assinatura para Blob (${key}): ${e}`);
            formData.append(key, value);
          }
        } else if (
          fieldConfig &&
          fieldConfig.type === 'file' &&
          typeof value === 'string' &&
          value.startsWith('FILE_SET')
        ) {
          const fileObj = window.fileStorage && window.fileStorage[key];
          if (fileObj) {
            formData.append(key, fileObj, fileObj.name);
          } else {
            console.warn(
              `Tentou enviar arquivo ${key}, mas File não foi encontrado em fileStorage. Verifique o input.`
            );
          }
        } else {
          formData.append(key, value);
        }
      }
    });
  });

  return fetch(url, {
    method: 'POST',
    body: formData
  });
}

/**
 * Carrega última inspeção interna pela API Apps Script
 */
async function carregarUltimaInspecaoInterna() {
  try {
    if (typeof showSpinner === 'function') {
      showSpinner();
    }
    const resp = await fetch(SCRIPT_URL_CARREGAR_INTERNA + '?action=getLastRecord');
    if (!resp.ok) {
      throw new Error('HTTP ' + resp.status);
    }
    const json = await resp.json();
    if (typeof hideSpinner === 'function') {
      hideSpinner();
    }

    if (!json.success || !json.data) {
      alert(json.message || 'Não foi possível localizar a última inspeção.');
      return;
    }

    aplicarUltimaInspecaoInterna(json.data);
    alert(
      'Dados da inspeção anterior carregados com sucesso. Revise e ajuste antes de enviar o relatório.'
    );
  } catch (e) {
    if (typeof hideSpinner === 'function') {
      hideSpinner();
    }
    console.error('Erro ao carregar última inspeção:', e);
    alert('Erro ao carregar dados da inspeção anterior: ' + e.message);
  }
}

/**
 * Aplica os dados da última inspeção em todas as janelas, exceto Dados Iniciais.
 */
function aplicarUltimaInspecaoInterna(rowData) {
  if (!rowData) return;

  const camposDadosIniciais = [
    'hora_inicial',
    'hora_final',
    'data',
    'operador',
    'supervisor',
    'turma',
    'turno',
    'assinatura'
  ];

  Object.keys(FORM_STRUCTURE).forEach(windowId => {
    const config = FORM_STRUCTURE[windowId];
    if (!config || windowId === 'dados-iniciais') return;

    const windowData = inspectionData[windowId] || {};
    config.fields.forEach(field => {
      const nomeCampo = field.name;
      if (camposDadosIniciais.includes(nomeCampo)) return;
      if (Object.prototype.hasOwnProperty.call(rowData, nomeCampo)) {
        windowData[nomeCampo] = rowData[nomeCampo];
      }
    });
    inspectionData[windowId] = windowData;
  });

  saveData(inspectionData);
  updateCompletionStatus();
}

// ============ INICIALIZAÇÃO DA PÁGINA ============

document.addEventListener('DOMContentLoaded', function () {
  const windowsGrid = document.querySelector('.windows-grid');
  if (!windowsGrid) return;

  Object.keys(FORM_STRUCTURE).forEach(windowId => {
    const config = FORM_STRUCTURE[windowId];
    const button = document.createElement('button');
    button.className = 'window-btn';
    button.dataset.window = windowId;
    button.innerHTML = `<span class="icon">${config.icon}</span><span>${config.title}</span>`;
    button.addEventListener('click', handleWindowClick);
    windowsGrid.appendChild(button);
  });

  generateJumpMenu();

  const modalClose = document.getElementById('modalClose');
  const modalCancel = document.getElementById('modalCancel');
  const modalOverlay = document.getElementById('modalOverlay');
  const windowForm = document.getElementById('windowForm');
  const submitReportBtn = document.getElementById('submitReport');

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      if (modalOverlay) modalOverlay.classList.remove('active');
    });
  }
  if (modalCancel) {
    modalCancel.addEventListener('click', () => {
      if (modalOverlay) modalOverlay.classList.remove('active');
    });
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
      }
    });
  }

  if (windowForm) {
    windowForm.addEventListener('submit', handleFormSubmit);
  }
  if (submitReportBtn) {
    submitReportBtn.addEventListener('click', handleReportSubmit);
  }

  updateCompletionStatus();
});

// ============ INTEGRADORES E DITADO POR VOZ ============

window.adjustIntegrator = function(fieldId, fieldName, step, min, max) {
  const hidden = document.getElementById(fieldId);
  const display = document.getElementById('display-' + fieldId);
  if (!hidden || !display) return;

  let current = parseFloat(hidden.value || '0');
  if (isNaN(current)) current = 0;
  let next = current + step;
  if (typeof min === 'number') next = Math.max(min, next);
  if (typeof max === 'number') next = Math.min(max, next);

  // Arredonda para evitar 0.2000000004 etc
  if (typeof step === 'number' && !Number.isInteger(step)) {
    next = parseFloat(next.toFixed(2));
  }

  hidden.value = next;
  display.textContent = next;
  if (typeof handleFieldChange === 'function') {
    handleFieldChange(fieldName, next);
  }
};

window.startDictation = function (fieldId) {
  const textarea = document.getElementById(fieldId);
  if (!textarea) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Reconhecimento de voz não suportado neste navegador. Use Chrome/Edge mais recente.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    const current = textarea.value ? textarea.value + ' ' : '';
    textarea.value = current + transcript;
    if (typeof handleFieldChange === 'function') {
      const fieldName = textarea.dataset.fieldName || textarea.name;
      handleFieldChange(fieldName, textarea.value);
    }
  };

  recognition.onerror = function (event) {
    console.error('Erro reconhecimento de voz:', event.error);
    alert('Não foi possível capturar o áudio. Tente novamente.');
  };

  recognition.start();
};

// ============ FUNÇÕES DO JUMP MENU ============

function generateJumpMenu() {
  const jumpMenu = document.getElementById('jumpMenu');
  const jumpMenuContainer = document.getElementById('jumpMenuContainer');
  if (!jumpMenu || !jumpMenuContainer) return;

  if (JUMP_MENU_TAGS.length > 0) {
    jumpMenuContainer.style.display = 'block';
    JUMP_MENU_TAGS.forEach(item => {
      const option = document.createElement('option');
      option.value = `group-${item.id}`;
      option.textContent = item.tag;
      jumpMenu.appendChild(option);
    });
  }
}

window.jumpToField = function (elementId) {
  if (!elementId) return;
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element.classList.add('highlight');
    setTimeout(() => {
      element.classList.remove('highlight');
    }, 1500);
  }
};

(() => {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .form-group.highlight {
      box-shadow: 0 0 10px 3px var(--warning-color);
      transition: box-shadow 0.5s ease-in-out;
    }
  `;
  document.head.appendChild(styleEl);
})();

// ============ ASSINATURAS ============

function initializeSignatures() {
  document.querySelectorAll('.signature-canvas').forEach(canvas => {
    const hiddenInput = document.getElementById(canvas.id.replace('_canvas', ''));
    const clearBtn = canvas.parentElement.querySelector('.clear-signature');
    const ctx = canvas.getContext('2d');
    let drawing = false;

    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function startDraw(e) {
      drawing = true;
      ctx.beginPath();
      const pos = getPos(e);
      ctx.moveTo(pos.x, pos.y);
      e.preventDefault();
    }
    function draw(e) {
      if (!drawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      e.preventDefault();
    }
    function endDraw(e) {
      if (drawing) {
        drawing = false;
        ctx.closePath();
        hiddenInput.value = canvas.toDataURL();
      }
      e.preventDefault();
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseout', endDraw);

    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', endDraw);
    canvas.addEventListener('touchcancel', endDraw);

    if (clearBtn) {
      clearBtn.addEventListener('click', e => {
        e.preventDefault();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hiddenInput.value = '';
      });
    }

    if (hiddenInput && hiddenInput.value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = hiddenInput.value;
    }
  });
}

window.initializeSignatures = initializeSignatures;
