// Estado principal da aplicação. Ele guarda os valores que mudam durante a demonstração.
const state = {
  temperature: 28,
  threshold: 35,
  mode: 'edge', // 'edge' = decisão local; 'cloud' = decisão na API Node.js.
  internet: true,
  history: [28],
  events: []
};

// Atalho para selecionar elementos da página pelo id.
const $ = (id) => document.getElementById(id);

// Registra eventos com horário para que o apresentador consiga mostrar o que ocorreu.
function addEvent(message, type = 'info') {
  state.events.unshift({ message, type, time: new Date() });
  state.events = state.events.slice(0, 7); // Mantém apenas os sete eventos mais recentes.
  renderEvents();
}

// Formata o horário local para aparecer no registro de eventos.
function formatTime(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Atualiza os números e textos relacionados ao sensor.
function renderTemperature() {
  const hot = state.temperature >= state.threshold;
  $('temperatureValue').textContent = state.temperature;
  $('largeTemperature').textContent = state.temperature;
  $('sliderValue').textContent = `${state.temperature} °C`;
  $('thresholdValue').textContent = state.threshold;
  $('temperatureSlider').value = state.temperature;
  $('thresholdInput').value = state.threshold;
  $('temperatureStatus').textContent = hot ? '● Alerta' : '● Normal';
  $('temperatureStatus').className = `status-pill ${hot ? 'alert' : 'normal'}`;
  $('temperatureDescription').textContent = hot ? 'Temperatura acima do limite de segurança' : 'Temperatura dentro da faixa segura';
}

// Desenha o gráfico SVG sem usar bibliotecas externas. Cada leitura vira um ponto.
function renderChart() {
  const svg = $('chart');
  const values = state.history.slice(-12); // Exibe até 12 leituras recentes.
  const width = 620, height = 190, left = 34, right = 12, top = 14, bottom = 28;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const min = 20, max = 45;
  const x = (i) => left + (values.length <= 1 ? plotWidth / 2 : i * plotWidth / (values.length - 1));
  const y = (value) => top + ((max - value) / (max - min)) * plotHeight;
  let markup = '';

  // Linhas horizontais e rótulos de escala tornam os valores mais fáceis de comparar.
  [20, 25, 30, 35, 40, 45].forEach((tick) => {
    const yy = y(tick);
    markup += `<line x1="${left}" y1="${yy}" x2="${width-right}" y2="${yy}" stroke="#29394e" stroke-dasharray="3 5"/>`;
    markup += `<text x="${left-8}" y="${yy+4}" text-anchor="end" fill="#71869f" font-size="10">${tick}°</text>`;
  });

  // A linha tracejada marca o limite configurado para o alerta térmico.
  const thresholdY = y(state.threshold);
  markup += `<line x1="${left}" y1="${thresholdY}" x2="${width-right}" y2="${thresholdY}" stroke="#ff7e87" stroke-dasharray="5 4" opacity=".9"/>`;

  const points = values.map((value, i) => `${x(i)},${y(value)}`).join(' ');
  if (values.length > 1) markup += `<polyline points="${points}" fill="none" stroke="#66e0bd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  values.forEach((value, i) => {
    const alertColor = value >= state.threshold ? '#ff7e87' : '#66e0bd';
    markup += `<circle cx="${x(i)}" cy="${y(value)}" r="4" fill="${alertColor}" stroke="#102033" stroke-width="2"/>`;
  });
  markup += `<text x="${width-right}" y="${Math.max(11, thresholdY-6)}" text-anchor="end" fill="#ff9ba2" font-size="9">Limite ${state.threshold}°C</text>`;
  svg.innerHTML = markup;
  $('historyCount').textContent = `${state.history.length} ${state.history.length === 1 ? 'leitura registrada' : 'leituras registradas'}`;
}

// Renderiza o registro de eventos usando texto escapado pelo textContent para evitar HTML vindo de dados.
function renderEvents() {
  const list = $('eventLog');
  list.replaceChildren();
  state.events.forEach((event) => {
    const item = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = `event-dot ${event.type}`;
    const content = document.createElement('div');
    const message = document.createElement('span');
    message.textContent = event.message;
    const time = document.createElement('time');
    time.textContent = formatTime(event.time);
    content.append(message, time);
    item.append(dot, content);
    list.append(item);
  });
  $('logCount').textContent = `${state.events.length} eventos`;
}

// Atualiza os rótulos e o diagrama conforme o modo selecionado.
function renderMode() {
  document.querySelectorAll('.mode-button').forEach((button) => {
    const selected = button.dataset.mode === state.mode;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  const edge = state.mode === 'edge';
  $('flowLabel').textContent = edge ? 'Dados seguem para processamento local' : 'Leitura enviada pela rede ao servidor';
  $('processorName').textContent = edge ? 'Dispositivo / Edge' : 'Backend / Cloud';
  $('processorDescription').textContent = edge ? 'Aplica a regra no local' : 'API Node.js calcula a decisão';
  $('actionNodeDescription').textContent = edge ? 'Decisão sem depender da internet' : 'Resultado devolvido pelo servidor';
  $('modeNote').textContent = edge
    ? 'No modo Edge, a regra é executada neste cliente de demonstração; não depende da API para decidir.'
    : 'No modo Cloud, a leitura é enviada à API Node.js. Sem conexão, o servidor não consegue calcular a decisão.';
  $('processorNode').classList.toggle('active-node', edge || state.internet);
}

// Atualiza o indicador de conexão no topo e o botão de simulação.
function renderInternet() {
  $('connectionValue').textContent = state.internet ? 'Online' : 'Offline';
  $('connectionFoot').textContent = state.internet ? 'Servidor acessível' : 'Conexão indisponível';
  $('connectionIndicator').classList.toggle('off', !state.internet);
  $('internetToggle').classList.toggle('off', !state.internet);
  $('internetToggle').classList.toggle('on', state.internet);
  $('internetToggle').setAttribute('aria-pressed', String(state.internet));
  $('internetLabel').textContent = state.internet ? 'Conectada' : 'Desconectada';
}

// Mostra o resultado da decisão na interface.
function renderDecision(result, unavailable = false) {
  const box = $('decisionResult');
  box.classList.toggle('alert', !unavailable && result.alert);
  box.classList.toggle('unavailable', unavailable);
  box.querySelector('.result-icon').textContent = unavailable ? '!' : result.alert ? '!' : '✓';
  box.querySelector('b').textContent = unavailable ? 'Servidor indisponível' : result.alert ? 'Alerta térmico' : 'Operação normal';
  box.querySelector('p').textContent = unavailable
    ? 'A conexão caiu; o processamento remoto não pode responder.'
    : `${result.action}. Processado por: ${result.processedBy}.`;
}

// Modo Edge: a regra é executada diretamente no cliente, representando o processamento no dispositivo.
function decideLocally() {
  const alert = state.temperature >= state.threshold;
  return {
    alert,
    action: alert ? 'Acionar resfriamento e gerar alerta' : 'Manter operação normal',
    processedBy: 'Cliente local (simulação Edge)'
  };
}

// Decide o que fazer com a leitura atual. No modo Cloud, consulta o backend de verdade.
async function processReading() {
  renderTemperature();
  renderChart();
  renderMode();
  renderInternet();

  if (state.mode === 'edge') {
    // A decisão local continua disponível mesmo quando state.internet é false.
    const result = decideLocally();
    renderDecision(result);
    addEvent(`Edge: ${state.temperature} °C — ${result.alert ? 'alerta acionado' : 'operação normal'}`, result.alert ? 'warn' : 'info');
    return;
  }

  // Cloud precisa de conexão para enviar a leitura ao endpoint remoto.
  if (!state.internet) {
    renderDecision({}, true);
    addEvent('Cloud: sem conexão; não foi possível consultar o servidor.', 'warn');
    return;
  }

  try {
    // Envia temperatura e limite para o backend Node.js calcular o resultado.
    const response = await fetch('/api/cloud-decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temperature: state.temperature, threshold: state.threshold })
    });
    if (!response.ok) throw new Error('O servidor retornou um erro.');
    const result = await response.json();
    renderDecision(result);
    addEvent(`Cloud: ${state.temperature} °C — ${result.alert ? 'alerta retornado pelo servidor' : 'operação normal'}`, result.alert ? 'warn' : 'info');
  } catch (error) {
    // Informa o problema sem fingir que o servidor respondeu.
    renderDecision({}, true);
    addEvent(`Falha ao consultar a API: ${error.message}`, 'warn');
  }
}

// Quando o usuário movimenta o controle, atualizamos a prévia, mas só registramos a leitura ao aplicar.
$('temperatureSlider').addEventListener('input', (event) => {
  $('sliderValue').textContent = `${event.target.value} °C`;
});

// Aplicar leitura grava o valor, adiciona ao gráfico e executa a regra no modo escolhido.
$('applyReading').addEventListener('click', () => {
  state.temperature = Number($('temperatureSlider').value);
  state.threshold = Number($('thresholdInput').value);
  if (!Number.isFinite(state.threshold)) state.threshold = 35;
  state.threshold = Math.min(45, Math.max(20, state.threshold));
  state.history.push(state.temperature);
  state.history = state.history.slice(-30); // Guarda até 30 leituras nesta sessão.
  addEvent(`Nova leitura do sensor: ${state.temperature} °C`, 'info');
  processReading();
});

// Gera uma leitura aleatória para simular mudanças naturais no ambiente.
$('randomReading').addEventListener('click', () => {
  const min = 20, max = 45;
  const value = Math.floor(Math.random() * (max - min + 1)) + min;
  $('temperatureSlider').value = value;
  $('sliderValue').textContent = `${value} °C`;
  $('applyReading').click();
});

// Trocar modo recalcula a decisão atual para que a comparação seja imediata.
document.querySelectorAll('.mode-button').forEach((button) => {
  button.addEventListener('click', () => {
    state.mode = button.dataset.mode;
    addEvent(`Modo alterado para ${state.mode === 'edge' ? 'Edge (local)' : 'Cloud (servidor)'}.`, 'info');
    renderMode();
    processReading();
  });
});

// Alterna apenas a conectividade simulada; não desliga a conexão real do computador.
$('internetToggle').addEventListener('click', () => {
  state.internet = !state.internet;
  addEvent(`Conexão simulada ${state.internet ? 'restaurada' : 'interrompida'}.`, state.internet ? 'info' : 'warn');
  renderInternet();
  processReading();
});

// Ao alterar o limite, atualiza a visualização e reprocessa a leitura atual.
$('thresholdInput').addEventListener('change', () => {
  state.threshold = Math.min(45, Math.max(20, Number($('thresholdInput').value) || 35));
  renderTemperature();
  renderChart();
  processReading();
});

// Limpa o histórico visual e inicia uma nova série com a leitura atual.
$('clearHistory').addEventListener('click', () => {
  state.history = [state.temperature];
  renderChart();
  addEvent('Histórico de leituras reiniciado.', 'info');
});

// Inicialização: preenche a tela com os valores iniciais e registra os primeiros eventos.
addEvent('Painel EdgeSense iniciado. Sensor virtual conectado.', 'info');
addEvent('Regra de segurança configurada: alerta a partir de 35 °C.', 'info');
addEvent('Modo Edge selecionado por padrão.', 'info');
renderTemperature();
renderChart();
renderMode();
renderInternet();
processReading();
