// VARIÁVEIS GLOBAIS
let formDataState = {};
let activeWindowName = null;

// Referências DOM
const windowsGrid = document.querySelector('.windows-grid');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const formFieldsDiv = document.getElementById('formFields');
const windowForm = document.getElementById('windowForm');
const submitReportButton = document.getElementById('submitReport');
const jumpMenu = document.getElementById('jumpMenu');
const modalClose = document.getElementById('modalClose'); 
const modalCancel = document.getElementById('modalCancel'); 

// Variáveis de Canvas para Assinatura
let signatureCanvas, signatureCtx, isDrawing = false;
let signatureBlob = null; 

// URL do Google Apps Script (ATUALIZADA)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwIgi_6PoRAWrIwTyB-CSrVJhB5WufKL1SV51j3bIlwRIMisJ_gz7lzdIYTSHt80lvcNA/exec'; 

// =========================================================================
// 1. RENDERIZAÇÃO E INICIALIZAÇÃO
// =========================================================================

/**
 * Inicializa o grid de janelas e o menu de navegação rápida.
 */
function initializeGrid() {
    // Verifica se FORM_STRUCTURE existe e é um objeto
    if (!windowsGrid || typeof FORM_STRUCTURE !== 'object' || FORM_STRUCTURE === null) {
        console.error("FORM_STRUCTURE não está definido ou é inválido.");
        return;
    }
    
    windowsGrid.innerHTML = '';
    jumpMenu.innerHTML = '<option value="">Navegação Rápida</option>';
    
    // Preencher o menu rápido e o grid
    Object.keys(FORM_STRUCTURE).forEach(sectionKey => {
        const section = FORM_STRUCTURE[sectionKey];

        // Se a seção for inválida (ex: array em vez de objeto), pula
        if (!section || !section.title || !section.icon) return; 

        // 1. Criar opção no menu de Navegação Rápida
        const option = document.createElement('option');
        option.value = sectionKey;
        option.textContent = `${section.icon} ${section.title}`;
        jumpMenu.appendChild(option);

        // 2. Criar Janela no Grid
        const windowDiv = document.createElement('div');
        windowDiv.className = 'window-card incomplete';
        windowDiv.id = `card-${sectionKey}`;
        windowDiv.dataset.section = sectionKey;
        
        windowDiv.innerHTML = `
            <h2>${section.icon} ${section.title}</h2>
            <p id="status-${sectionKey}">Faltando dados</p>
            <button class="edit-button">Editar</button>
        `;

        const editButton = windowDiv.querySelector('.edit-button');
        if (editButton) {
            editButton.addEventListener('click', () => openModal(sectionKey));
        }
        windowsGrid.appendChild(windowDiv);
        
        // Inicializar o estado dos dados
        formDataState[sectionKey] = {};
    });

    const jumpMenuContainer = document.getElementById('jumpMenuContainer');
    if (jumpMenuContainer) {
        jumpMenuContainer.style.display = 'block';
    }
}

/**
 * Navega rapidamente para a seção clicada no menu suspenso.
 */
function jumpToField(sectionKey) {
    if (sectionKey) {
        const targetElement = document.getElementById(`card-${sectionKey}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}


// =========================================================================
// 2. MODAL E CAMPOS
// =========================================================================

/**
 * Abre o modal de edição para uma seção específica.
 */
function openModal(sectionKey) {
    if (!modalOverlay || !FORM_STRUCTURE[sectionKey]) return; 
    activeWindowName = sectionKey;
    const section = FORM_STRUCTURE[sectionKey];
    modalTitle.textContent = `${section.icon} ${section.title}`;
    formFieldsDiv.innerHTML = '';

    // Renderizar campos
    section.fields.forEach(field => {
        const fieldGroup = createFieldElement(field);
        formFieldsDiv.appendChild(fieldGroup);
    });

    loadFormData(sectionKey);
    
    // Inicializa o Canvas, se presente
    if (section.fields.some(f => f.type === 'signature')) {
        initializeSignatureCanvas();
    }
    
    modalOverlay.style.display = 'flex';
}

/**
 * Cria o elemento DOM para um campo de formulário.
 */
function createFieldElement(field) {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'field-group';

    // TRATAMENTO DO CAMPO DE ASSINATURA
    if (field.type === 'signature') {
        fieldGroup.className += ' signature-container';
        fieldGroup.innerHTML = `
            <label>${field.label} ${field.required ? '*' : ''}</label>
            <canvas id="signatureCanvas" width="350" height="150" style="border: 1px solid #ccc; touch-action: none; background-color: white;"></canvas>
            <div class="signature-controls">
                <button type="button" id="clearSignatureButton" class="btn-secondary">Limpar</button>
                <p class="signature-hint">Desenhe sua assinatura acima.</p>
            </div>
        `;
        return fieldGroup;
    }

    // RENDERIZAÇÃO DE CAMPOS NORMAIS
    const label = document.createElement('label');
    label.htmlFor = field.name;
    label.textContent = field.label + (field.unit ? ` (${field.unit})` : '') + (field.required ? ' *' : '');

    let inputElement;

    if (field.type === 'textarea') {
        inputElement = document.createElement('textarea');
        inputElement.rows = 3;
    } else if (field.type === 'select' || field.type === 'status') {
        inputElement = document.createElement('select');
        (field.options || []).forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            inputElement.appendChild(option);
        });
    } else {
        inputElement = document.createElement('input');
        inputElement.type = field.type;
        if (field.placeholder) inputElement.placeholder = field.placeholder;
        if (field.min !== undefined) inputElement.min = field.min;
        if (field.max !== undefined) inputElement.max = field.max;
        if (field.step !== undefined) inputElement.step = field.step;
        if (field.default !== undefined) inputElement.value = field.default; 
    }
    
    if (field.required) inputElement.required = true;

    inputElement.id = field.name;
    inputElement.name = field.name;

    fieldGroup.appendChild(label);
    fieldGroup.appendChild(inputElement);

    return fieldGroup;
}

/**
 * Preenche o formulário modal com os dados atualmente salvos.
 */
function loadFormData(sectionKey) {
    const data = formDataState[sectionKey] || {};
    
    Object.keys(data).forEach(mappedFieldName => {
        // Encontra o nome do campo DOM original a partir do nome mapeado no estado
        const fieldConfig = FORM_STRUCTURE[sectionKey].fields.find(f => {
            let nameToCheck = f.name;
            if (f.name.startsWith('imagem_')) {
                nameToCheck = 'foto_anomalia' + f.name.split('_')[1];
            }
            return nameToCheck === mappedFieldName;
        });

        if (!fieldConfig) return; 

        const fieldElement = document.getElementById(fieldConfig.name);
        
        if (fieldElement) {
            if (fieldConfig.type === 'signature') return; 

            if (fieldElement.type === 'checkbox') {
                fieldElement.checked = data[mappedFieldName];
            } else {
                fieldElement.value = data[mappedFieldName];
            }
        }
    });
    
    // Carrega Assinatura (se houver um blob salvo)
    const isSignatureSection = FORM_STRUCTURE[sectionKey].fields.some(f => f.type === 'signature');
    if (signatureBlob && isSignatureSection) {
        signatureCanvas = document.getElementById('signatureCanvas');
        if (signatureCanvas) {
            signatureCtx = signatureCanvas.getContext('2d');
            
            const img = new Image();
            img.onload = () => {
                signatureCtx.drawImage(img, 0, 0, signatureCanvas.width, signatureCanvas.height);
            };
            // Cria um URL temporário para carregar a imagem do Blob
            img.src = URL.createObjectURL(signatureBlob);
        }
    }
}

// =========================================================================
// 3. LÓGICA DO CANVAS DE ASSINATURA
// =========================================================================

function initializeSignatureCanvas() {
    signatureCanvas = document.getElementById('signatureCanvas');
    if (!signatureCanvas) return;
    
    signatureCtx = signatureCanvas.getContext('2d');
    signatureCtx.lineWidth = 3;
    signatureCtx.lineCap = 'round';
    signatureCtx.strokeStyle = '#000';
    signatureCtx.fillStyle = '#fff';
    signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height); 

    // Remove e adiciona listeners para evitar duplicação
    const events = ['pointerdown', 'pointerup', 'pointerout', 'pointermove'];
    events.forEach(event => signatureCanvas.removeEventListener(event, window[event.replace('pointer', '').toLowerCase().replace('out', 'up')])); // Limpa listeners anteriores
    
    signatureCanvas.addEventListener('pointerdown', startDrawing);
    signatureCanvas.addEventListener('pointerup', stopDrawing);
    signatureCanvas.addEventListener('pointerout', stopDrawing);
    signatureCanvas.addEventListener('pointermove', draw);
    
    const clearButton = document.getElementById('clearSignatureButton');
    if (clearButton) {
        clearButton.removeEventListener('click', clearSignature);
        clearButton.addEventListener('click', clearSignature);
    }
}

function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    signatureCtx.beginPath();
    signatureCtx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    signatureCtx.lineTo(x, y);
    signatureCtx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

function clearSignature() {
    if (!signatureCtx || !signatureCanvas) return;
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureCtx.fillStyle = '#fff';
    signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureBlob = null;
    updateWindowStatus(activeWindowName, false); 
}

/**
 * Converte o canvas para Blob e salva na variável global.
 */
function saveSignature() {
    return new Promise(resolve => {
        if (!signatureCanvas) {
            signatureBlob = null;
            resolve();
            return;
        }
        
        const imageData = signatureCtx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
        const isCanvasBlank = !imageData.data.some((channel, index) => {
             // Checa se há cor preenchida (não 255 em RGB)
             return (index % 4 !== 3) && (channel !== 255);
        });

        if (isCanvasBlank) {
            signatureBlob = null;
            resolve();
        } else {
            signatureCanvas.toBlob(blob => {
                // Nome do arquivo para o FormData
                blob.name = 'assinatura.png'; 
                signatureBlob = blob;
                resolve();
            }, 'image/png');
        }
    });
}


// =========================================================================
// 4. LÓGICA DE ENVIO E ESTADO
// =========================================================================

/**
 * Salva os dados do formulário modal no estado global.
 */
async function saveFormData() {
    const currentData = {};
    const section = FORM_STRUCTURE[activeWindowName];
    let isComplete = true;

    // 1. Salvar Assinatura
    if (section.fields.some(f => f.type === 'signature')) {
        await saveSignature(); 
    }

    // 2. Coletar dados e verificar completude
    for (const field of section.fields) {
        const element = document.getElementById(field.name);
        
        let dataName = field.name;
        if (field.name.startsWith('imagem_')) {
            // CRUCIAL: Mapeia para o nome esperado pelo Apps Script
            dataName = 'foto_anomalia' + field.name.split('_')[1];
        }

        if (element) {
            let value;
            if (field.type === 'file') {
                value = element.files[0] ? element.files[0].name : '';
            } else if (field.type === 'signature') {
                value = signatureBlob ? 'assinatura.png' : '';
            } else if (element.type === 'checkbox') {
                value = element.checked;
            } else {
                value = element.value;
            }
            
            currentData[dataName] = value;
            
            // Checar obrigatoriedade
            if (field.required) {
                if (field.type === 'signature' && !signatureBlob) {
                    isComplete = false;
                } else if (!value) {
                    isComplete = false;
                }
            }
        } else if (field.type === 'file') {
             currentData[dataName] = '';
        }
    }
    
    // 3. Atualizar Estado
    Object.assign(formDataState[activeWindowName], currentData);
    
    // 4. Fechar Modal e atualizar status
    modalOverlay.style.display = 'none';
    updateWindowStatus(activeWindowName, isComplete);
    checkAllSectionsComplete();
}

/**
 * Atualiza o status visual de uma seção no grid.
 */
function updateWindowStatus(sectionKey, isComplete) {
    const card = document.getElementById(`card-${sectionKey}`);
    const statusP = document.getElementById(`status-${sectionKey}`);
    
    if (card && statusP) {
        if (isComplete) {
            card.classList.remove('incomplete');
            card.classList.add('complete');
            statusP.textContent = 'Completo';
        } else {
            card.classList.remove('complete');
            card.classList.add('incomplete');
            statusP.textContent = 'Faltando dados';
        }
    }
}

/**
 * Verifica se todas as seções estão completas para habilitar o botão de envio.
 */
function checkAllSectionsComplete() {
    const allComplete = Object.keys(FORM_STRUCTURE).every(key => {
        const card = document.getElementById(`card-${key}`);
        return card && card.classList.contains('complete');
    });

    submitReportButton.disabled = !allComplete;
    if (submitReportButton.disabled) {
        submitReportButton.textContent = 'Preencha todos os campos';
    } else {
        submitReportButton.textContent = 'Enviar Relatório';
    }
}

/**
 * Lida com o envio final de todos os dados e arquivos para o Apps Script.
 */
async function submitReport() {
    if (submitReportButton.disabled) return;

    if (!confirm("Tem certeza que deseja enviar o relatório?")) {
        return;
    }

    const finalFormData = new FormData();

    // 1. Coletar todos os dados e arquivos
    Object.keys(FORM_STRUCTURE).forEach(sectionKey => {
        const sectionData = formDataState[sectionKey];
        const sectionFields = FORM_STRUCTURE[sectionKey].fields;

        sectionFields.forEach(field => {
            const fieldName = field.name;
            let dataName = fieldName;

            if (fieldName.startsWith('imagem_')) {
                dataName = 'foto_anomalia' + fieldName.split('_')[1];
            }

            if (field.type === 'file') {
                // Pega o arquivo real do DOM (input) e anexa ao FormData
                const inputElement = document.getElementById(fieldName);
                if (inputElement && inputElement.files[0]) {
                    finalFormData.append(dataName, inputElement.files[0], inputElement.files[0].name);
                }
            } else if (field.type === 'signature' && signatureBlob) {
                // Pega o Blob de assinatura e anexa com o nome 'assinatura'
                finalFormData.append('assinatura', signatureBlob, signatureBlob.name);
            } else {
                // Pega dados de texto do estado (usando o nome mapeado)
                const fieldValue = sectionData[dataName] || '';
                finalFormData.append(dataName, fieldValue);
            }
        });
    });

    // 2. Exibir o spinner de carregamento (Você deve definir showSpinner/hideSpinner)
    window.showSpinner ? showSpinner('Enviando relatório e arquivos. Aguarde...') : console.log('Enviando...');

    // 3. Enviar para o Apps Script
    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: finalFormData, // O fetch enviará o FormData como multipart/form-data
        });

        const result = await response.text();
        
        // CRUCIAL: O Apps Script de sucesso retorna 'ok'
        if (result.trim().toLowerCase().includes('ok')) {
            alert('Relatório enviado com sucesso!');
            window.location.reload(); 
        } else {
            alert('Erro ao enviar o relatório. Resposta do servidor: ' + result);
        }

    } catch (error) {
        // Trata o 'Failed to fetch' e outros erros de rede/servidor
        alert('Ocorreu um erro ao enviar o relatório. Detalhes: ' + error.message);
    } finally {
        window.hideSpinner ? hideSpinner() : console.log('Envio finalizado.');
    }
}

// =========================================================================
// 5. EVENT LISTENERS E INICIALIZAÇÃO
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Inicializa o grid
    initializeGrid();
    
    // 2. Define o valor inicial da data
    const today = new Date().toISOString().split('T')[0];
    const dataSection = FORM_STRUCTURE['dados-iniciais'];
    if (dataSection) {
        const dataField = dataSection.fields.find(f => f.name === 'data');
        if (dataField) dataField.default = today;
    }
    
    // 3. Eventos do Modal
    if (modalClose) modalClose.addEventListener('click', () => modalOverlay.style.display = 'none');
    if (modalCancel) modalCancel.addEventListener('click', () => modalOverlay.style.display = 'none');
    
    if (windowForm) {
        windowForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveFormData(); 
        });
    }
    
    // 4. Evento de envio final
    if (submitReportButton) {
        submitReportButton.addEventListener('click', submitReport);
    }
    
    // 5. Evento do Jump Menu
    if (jumpMenu) {
        jumpMenu.addEventListener('change', (e) => jumpToField(e.target.value));
    }

    // 6. Atualiza o status inicial do botão de envio
    checkAllSectionsComplete();
});
