// Importa o Express, usado para criar o servidor HTTP e a API.
const express = require('express');
// O path ajuda a montar caminhos de arquivos de forma compatível entre sistemas.
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Permite que a API receba e interprete requisições com corpo JSON.
app.use(express.json());

// Disponibiliza os arquivos do frontend (HTML, CSS e JavaScript) em /public.
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint de exemplo para representar o processamento feito na nuvem/servidor.
// Diferente do modo Edge, a decisão deste modo é calculada aqui no backend.
app.post('/api/cloud-decision', (req, res) => {
  const temperature = Number(req.body.temperature);
  const threshold = Number(req.body.threshold ?? 35);

  // Valida os dados recebidos para evitar processar valores inválidos.
  if (!Number.isFinite(temperature) || !Number.isFinite(threshold)) {
    return res.status(400).json({ error: 'Informe temperatura e limite numéricos.' });
  }

  // Regra de negócio executada no servidor: a partir de 35 °C, gerar alerta.
  const alert = temperature >= threshold;

  // Retorna o resultado ao frontend, como ocorreria em uma aplicação cliente-servidor.
  res.json({
    mode: 'cloud',
    temperature,
    threshold,
    alert,
    action: alert ? 'Acionar resfriamento e gerar alerta' : 'Manter operação normal',
    processedBy: 'Decisão processada na nuvem',
    processedAt: new Date().toISOString()
  });
});

// Inicia o servidor na porta configurada.
app.listen(PORT, () => {
  console.log(`EdgeSense disponível em http://localhost:${PORT}`);
});
