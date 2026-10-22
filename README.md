# EdgeSense — demonstração de IoT + Edge Computing

Projeto didático com frontend HTML/CSS/JavaScript e backend Node.js/Express. Ele compara:

- **Edge:** a regra de temperatura é calculada no cliente, sem chamar a API.
- **Cloud:** a leitura é enviada para `POST /api/cloud-decision`, e a regra é calculada no backend.
- **Conectividade:** o botão de internet simula uma falha. Ele não desliga a conexão real do computador.

> Importante: o sensor é virtual. O modo Edge representa a lógica que seria executada em um dispositivo de borda, mas neste protótipo ela roda no navegador. Para provar Edge em hardware real, seria necessário executar a regra em um ESP32/Raspberry Pi ou simulador de microcontrolador.

## Como executar localmente

1. Instale Node.js 18 ou superior: https://nodejs.org/
2. Extraia a pasta do projeto.
3. Abra um terminal dentro da pasta `edgesense`.
4. Execute `npm install`.
5. Execute `npm start`.
6. Acesse http://localhost:3000 no navegador.

Não abra `index.html` diretamente: o modo Cloud precisa do servidor Express.

## Roteiro de demonstração

1. Deixe 28 °C e clique em **Aplicar leitura**: deve aparecer operação normal.
2. Ajuste para 40 °C e aplique: deve aparecer alerta térmico.
3. Selecione **Cloud** e aplique uma leitura: o backend calcula a decisão.
4. Desconecte a conexão simulada: Cloud fica indisponível.
5. Selecione **Edge** com a conexão simulada desligada: a regra local continua funcionando.
6. Mostre o gráfico, o histórico e o registro de eventos.

## Arquivos

- `server.js`: servidor Express e endpoint de decisão Cloud.
- `public/index.html`: estrutura e conteúdo da interface.
- `public/styles.css`: layout, cores e responsividade.
- `public/app.js`: estado da interface, sensor virtual, gráfico, eventos e regras de decisão.

O código contém comentários em português explicando as principais partes.
