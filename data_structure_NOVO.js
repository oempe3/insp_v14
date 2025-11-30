// ============================================================================
// ESTRUTURA DE DADOS DO FORMULÁRIO DE INSPEÇÃO EXTERNA
// UTE Pernambuco III
// ============================================================================
// Esta estrutura está alinhada com:
// - Template: inspecao_externa_template.docx
// - Planilha: Inspecoes_UTE-PE3.xlsx (aba "Externa" - 219 colunas)
// ============================================================================

const FORM_STRUCTURE = {
    'dados-iniciais': {
        title: 'Dados Iniciais',
        icon: '📋',
        fields: [
            { name: 'hora_inicial', label: 'Hora Inicial', type: 'time', auto: 'start_time', required: true },
            { name: 'hora_final', label: 'Hora Final', type: 'time', auto: 'end_time', readonly: true },
            { name: 'data', label: 'Data', type: 'date', auto: 'start_date', required: true },
            { name: 'operador', label: 'Operador', type: 'text', placeholder: 'Nome do operador', auto: 'suggest_name', required: true },
            { name: 'supervisor', label: 'Supervisor', type: 'text', placeholder: 'Nome do supervisor', auto: 'suggest_name', required: true },
            { name: 'turma', label: 'Turma', type: 'select', options: ['A', 'B', 'C', 'D', 'E'], required: true },
            { name: 'assinatura', label: 'Assinatura', type: 'signature', required: false }
        ]
    },
    
    'bomba-pocos': {
        title: 'Bomba dos Poços',
        icon: '💧',
        fields: [
            { name: 'bomba1_status', label: 'Status da Bomba 1', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true },
            { name: 'bomba1_hidrometro', label: 'Hidrômetro Bomba 1', type: 'number', unit: 'm³', placeholder: 'Leitura acumulada' },
            { name: 'bomba2_status', label: 'Status da Bomba 2', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true },
            { name: 'bomba2_hidrometro', label: 'Hidrômetro Bomba 2', type: 'number', unit: 'm³', placeholder: 'Leitura acumulada' }
        ]
    },
    
    'container-incendio': {
        title: 'Container de Combate a Incêndio',
        icon: '🔥',
        fields: [
            { name: 'jockey_status', label: 'Bomba Jockey - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true },
            { name: 'incendio_pressao', label: 'Pressão Linha de Incêndio', type: 'range', min: 0, max: 15, step: 0.1, unit: 'Bar', default: 10 },
            { name: 'sprinkler_status', label: 'Bomba Sprinkler (Elétrica) - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true },
            { name: 'sprinkler_oleo', label: 'Nível de Óleo Cavalete Sprinkler', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'diesel_status', label: 'Bomba Diesel - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true },
            { name: 'bateria01_tensao', label: 'Tensão Bateria 01', type: 'range', min: 0, max: 16, step: 0.1, unit: 'V', default: 12 },
            { name: 'bateria02_tensao', label: 'Tensão Bateria 02', type: 'range', min: 0, max: 16, step: 0.1, unit: 'V', default: 12 },
            { name: 'radiador_agua', label: 'Nível Água do Radiador', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'oleo_lubrificante', label: 'Nível de Óleo Lubrificante', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'oleo_combustivel', label: 'Nível de Óleo Combustível', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'horimetro', label: 'Horímetro', type: 'number', unit: 'h', placeholder: 'Horas acumuladas', default: 0 },
            { name: 'diesel_oleo_cavalete', label: 'Nível de Óleo Cavalete Bomba Diesel', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 }
        ]
    },
    
    'eta': {
        title: 'Estação de Tratamento de Água (ETA)',
        icon: '🧪',
        fields: [
            { name: 'abrandado_status', label: 'Tratamento Abrandado - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true },
            { name: 'abrandado_nivel', label: 'Nível do Tanque Abrandado', type: 'range', min: 0, max: 10, step: 0.1, unit: 'm³', default: 5 },
            { name: 'osmose_status', label: 'Osmose Reversa - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true },
            { name: 'agua_tratada_pressao', label: 'Pressão Linha de Água Tratada', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar', default: 5 },
            { name: 'ph_bruta', label: 'pH Água Bruta', type: 'range', min: 0, max: 14, step: 0.1, default: 7 },
            { name: 'ph_tratada', label: 'pH Água Tratada', type: 'range', min: 0, max: 14, step: 0.1, default: 7 },
            { name: 'hidrometro_bruta', label: 'Hidrômetro Água Bruta', type: 'number', unit: 'm³', placeholder: 'Leitura acumulada', default: 0 },
            { name: 'hidrometro_tratada', label: 'Hidrômetro Água Tratada', type: 'number', unit: 'm³', placeholder: 'Leitura acumulada', default: 0 },
            { name: 'soda_caustica', label: 'Nível Soda Cáustica', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'complexante_ferro', label: 'Nível Complexante de Ferro', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'biocida', label: 'Nível Biocida', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'anti_incrustante', label: 'Nível Anti-incrustante O.R.', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 }
        ]
    },
    
    'tancagem': {
        title: 'Área de Tancagem',
        icon: '🛢️',
        fields: [
            { name: 'storage_hfo_volume', label: 'Storage HFO PAB901 - Volume', type: 'number', unit: 'm³', placeholder: 'Volume atual', digits: 6 },
            { name: 'storage_hfo_temp', label: 'Storage HFO PAB901 - Temperatura', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC', default: 80 },
            { name: 'buffer_hfo_volume', label: 'Buffer HFO PBA901 - Volume', type: 'number', unit: 'm³', placeholder: 'Volume atual', digits: 6 },
            { name: 'buffer_hfo_temp', label: 'Buffer HFO PBA901 - Temperatura', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC', default: 80 },
            { name: 'day_hfo_volume', label: 'Day HFO PBC901 - Volume', type: 'number', unit: 'm³', placeholder: 'Volume atual', digits: 6 },
            { name: 'day_hfo_temp', label: 'Day HFO PBC901 - Temperatura', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC', default: 80 },
            { name: 'lfo_volume', label: 'LFO PBF901 - Volume', type: 'number', unit: 'm³', placeholder: 'Volume atual', digits: 6 },
            { name: 'lfo_temp', label: 'LFO PBF901 - Temperatura', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC', default: 40 },
            { name: 'agua_oleosa_volume', label: 'Água Oleosa DAB901 - Volume', type: 'number', unit: 'm³', placeholder: 'Volume atual', digits: 6 },
            { name: 'agua_oleosa_temp', label: 'Água Oleosa DAB901 - Temperatura', type: 'range', min: 0, max: 100, step: 1, unit: 'ºC', default: 25 },
            { name: 'borra_volume', label: 'Borra DDB901 - Volume', type: 'number', unit: 'm³', placeholder: 'Volume atual', digits: 6 },
            { name: 'borra_temp', label: 'Borra DDB901 - Temperatura', type: 'range', min: 0, max: 100, step: 1, unit: 'ºC', default: 25 },
            { name: 'agua_bruta_incendio_temp', label: 'Água Bruta/Incêndio VBA/VBE901 - Temperatura', type: 'range', min: 0, max: 50, step: 1, unit: 'ºC', default: 25 },
            { name: 'agua_tratada_volume', label: 'Água Tratada VBC901 - Volume', type: 'number', unit: 'm³', placeholder: 'Volume atual' },
            { name: 'oleo_novo_volume', label: 'Óleo Lubrificante Novo QAC901 - Volume', type: 'number', unit: 'm³', placeholder: 'Volume atual' },
            { name: 'oleo_usado_volume', label: 'Óleo Lubrificante Usado QAD901 - Volume', type: 'number', unit: 'm³', placeholder: 'Volume atual' },
            { name: 'oleo_manutencao1_volume', label: 'Óleo Lubrificante Manutenção QAM901 - Volume', type: 'number', unit: 'm³', placeholder: 'Volume atual' },
            { name: 'oleo_manutencao2_volume', label: 'Óleo Lubrificante Manutenção QAM902 - Volume', type: 'number', unit: 'm³', placeholder: 'Volume atual' }
        ]
    },
    
    'separadoras-hfo': {
        title: 'Separadoras de HFO',
        icon: '⚙️',
        fields: [
            // PBB901.1 (BJJ902)
            { name: 'pbb901_1_status', label: 'PBB901 #1 - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true, tag: 'PBB901.1' },
            { name: 'pbb901_1_temp', label: 'PBB901 #1 - Temperatura', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC', default: 90 },
            { name: 'pbb901_1_vazao', label: 'PBB901 #1 - Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h', default: 6 },
            { name: 'pbb901_1_frequencia', label: 'PBB901 #1 - Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz', default: 50 },
            { name: 'pbb901_1_pressao_saida', label: 'PBB901 #1 - Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar', default: 2 },
            { name: 'pbb901_1_nivel_oleo', label: 'PBB901 #1 - Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'pbb901_1_horimetro', label: 'PBB901 #1 - Horímetro', type: 'number', unit: 'h', placeholder: 'Horas acumuladas' },
            
            // PBB901.2 (BJJ902)
            { name: 'pbb901_2_status', label: 'PBB901 #2 - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true, tag: 'PBB901.2' },
            { name: 'pbb901_2_temp', label: 'PBB901 #2 - Temperatura', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC', default: 90 },
            { name: 'pbb901_2_vazao', label: 'PBB901 #2 - Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h', default: 6 },
            { name: 'pbb901_2_frequencia', label: 'PBB901 #2 - Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz', default: 50 },
            { name: 'pbb901_2_pressao_saida', label: 'PBB901 #2 - Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar', default: 2 },
            { name: 'pbb901_2_nivel_oleo', label: 'PBB901 #2 - Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'pbb901_2_horimetro', label: 'PBB901 #2 - Horímetro', type: 'number', unit: 'h', placeholder: 'Horas acumuladas' },
            
            // PBB901.3 (BJJ903)
            { name: 'pbb901_3_status', label: 'PBB901 #3 - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true, tag: 'PBB901.3' },
            { name: 'pbb901_3_temp', label: 'PBB901 #3 - Temperatura', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC', default: 90 },
            { name: 'pbb901_3_vazao', label: 'PBB901 #3 - Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h', default: 6 },
            { name: 'pbb901_3_frequencia', label: 'PBB901 #3 - Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz', default: 50 },
            { name: 'pbb901_3_pressao_saida', label: 'PBB901 #3 - Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar', default: 2 },
            { name: 'pbb901_3_nivel_oleo', label: 'PBB901 #3 - Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'pbb901_3_horimetro', label: 'PBB901 #3 - Horímetro', type: 'number', unit: 'h', placeholder: 'Horas acumuladas' },
            
            // PBB902.1 (BJJ904)
            { name: 'pbb902_1_status', label: 'PBB902 #1 - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true, tag: 'PBB902.1' },
            { name: 'pbb902_1_temp', label: 'PBB902 #1 - Temperatura', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC', default: 90 },
            { name: 'pbb902_1_vazao', label: 'PBB902 #1 - Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h', default: 6 },
            { name: 'pbb902_1_frequencia', label: 'PBB902 #1 - Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz', default: 50 },
            { name: 'pbb902_1_pressao_saida', label: 'PBB902 #1 - Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar', default: 2 },
            { name: 'pbb902_1_nivel_oleo', label: 'PBB902 #1 - Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'pbb902_1_horimetro', label: 'PBB902 #1 - Horímetro', type: 'number', unit: 'h', placeholder: 'Horas acumuladas' },
            
            // PBB902.2 (BJJ905)
            { name: 'pbb902_2_status', label: 'PBB902 #2 - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true, tag: 'PBB902.2' },
            { name: 'pbb902_2_temp', label: 'PBB902 #2 - Temperatura', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC', default: 90 },
            { name: 'pbb902_2_vazao', label: 'PBB902 #2 - Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h', default: 6 },
            { name: 'pbb902_2_frequencia', label: 'PBB902 #2 - Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz', default: 50 },
            { name: 'pbb902_2_pressao_saida', label: 'PBB902 #2 - Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar', default: 2 },
            { name: 'pbb902_2_nivel_oleo', label: 'PBB902 #2 - Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'pbb902_2_horimetro', label: 'PBB902 #2 - Horímetro', type: 'number', unit: 'h', placeholder: 'Horas acumuladas' },
            
            // PBB902.3 (BJJ906)
            { name: 'pbb902_3_status', label: 'PBB902 #3 - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true, tag: 'PBB902.3' },
            { name: 'pbb902_3_temp', label: 'PBB902 #3 - Temperatura', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC', default: 90 },
            { name: 'pbb902_3_vazao', label: 'PBB902 #3 - Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h', default: 6 },
            { name: 'pbb902_3_frequencia', label: 'PBB902 #3 - Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz', default: 50 },
            { name: 'pbb902_3_pressao_saida', label: 'PBB902 #3 - Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar', default: 2 },
            { name: 'pbb902_3_nivel_oleo', label: 'PBB902 #3 - Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            { name: 'pbb902_3_horimetro', label: 'PBB902 #3 - Horímetro', type: 'number', unit: 'h', placeholder: 'Horas acumuladas' }
        ]
    },
    
    'bombas-transferencia': {
        title: 'Bombas de Transferência O.C.',
        icon: '🔄',
        fields: [
            { name: 'pac901_1_status', label: 'PAC901-1 - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true },
            { name: 'pac901_2_status', label: 'PAC901-2 - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true },
            { name: 'pca902_status', label: 'PCA902 - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true },
            { name: 'pca903_1_status', label: 'PCA903-1 - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true },
            { name: 'pca903_2_status', label: 'PCA903-2 - Status', type: 'status', options: ['OPE', 'ST-BY', 'MNT'], required: true }
        ]
    },
    
    'anormalidades': {
        title: 'Anormalidades',
        icon: '⚠️',
        fields: [
            // Anormalidade 1
            { name: 'descricao_anomalia1', label: 'Anormalidade 1 - Descrição', type: 'textarea', placeholder: 'Descreva a anormalidade encontrada', rows: 3 },
            { name: 'local_anomalia1', label: 'Anormalidade 1 - Local', type: 'text', placeholder: 'Local onde foi identificada' },
            { name: 'foto_anomalia1', label: 'Anormalidade 1 - Foto', type: 'file', accept: 'image/*' },
            
            // Anormalidade 2
            { name: 'descricao_anomalia2', label: 'Anormalidade 2 - Descrição', type: 'textarea', placeholder: 'Descreva a anormalidade encontrada', rows: 3 },
            { name: 'local_anomalia2', label: 'Anormalidade 2 - Local', type: 'text', placeholder: 'Local onde foi identificada' },
            { name: 'foto_anomalia2', label: 'Anormalidade 2 - Foto', type: 'file', accept: 'image/*' },
            
            // Anormalidade 3
            { name: 'descricao_anomalia3', label: 'Anormalidade 3 - Descrição', type: 'textarea', placeholder: 'Descreva a anormalidade encontrada', rows: 3 },
            { name: 'local_anomalia3', label: 'Anormalidade 3 - Local', type: 'text', placeholder: 'Local onde foi identificada' },
            { name: 'foto_anomalia3', label: 'Anormalidade 3 - Foto', type: 'file', accept: 'image/*' },
            
            // Anormalidade 4
            { name: 'descricao_anomalia4', label: 'Anormalidade 4 - Descrição', type: 'textarea', placeholder: 'Descreva a anormalidade encontrada', rows: 3 },
            { name: 'local_anomalia4', label: 'Anormalidade 4 - Local', type: 'text', placeholder: 'Local onde foi identificada' },
            { name: 'foto_anomalia4', label: 'Anormalidade 4 - Foto', type: 'file', accept: 'image/*' },
            
            // Anormalidade 5
            { name: 'descricao_anomalia5', label: 'Anormalidade 5 - Descrição', type: 'textarea', placeholder: 'Descreva a anormalidade encontrada', rows: 3 },
            { name: 'local_anomalia5', label: 'Anormalidade 5 - Local', type: 'text', placeholder: 'Local onde foi identificada' },
            { name: 'foto_anomalia5', label: 'Anormalidade 5 - Foto', type: 'file', accept: 'image/*' },
            
            // Anormalidade 6
            { name: 'descricao_anomalia6', label: 'Anormalidade 6 - Descrição', type: 'textarea', placeholder: 'Descreva a anormalidade encontrada', rows: 3 },
            { name: 'local_anomalia6', label: 'Anormalidade 6 - Local', type: 'text', placeholder: 'Local onde foi identificada' },
            { name: 'foto_anomalia6', label: 'Anormalidade 6 - Foto', type: 'file', accept: 'image/*' }
        ]
    }
};

// Exportar para uso no script.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FORM_STRUCTURE };
}
