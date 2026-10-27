# Auditoria estática de colisões dos interiores — v0.28

Escopo: region-interiors.js, rural-room.js, interiors-workshops.js, interiors-homes.js, interiors-civic.js e lighthouse-upper.js. A arte foi preservada; só foram acrescentados/ajustados colisores e metadados.

Todos estes interiores agora usam `createInteriorKit`, que força `jumpable:false` nos sólidos. Mesas, estantes e cadeiras mantêm colisões explícitas; cadeiras usam retângulo com o ângulo real, em vez de um círculo que deixava cantos atravessáveis. Os objetos novos usam `height` adequado; o valor padrão conservador de outros sólidos internos é1.6m.

| Região | Achado e ajuste |
| --- | --- |
| Casa | Mesinha de cabeceira e os dois vasos no chão não bloqueavam; adicionados. Colisores da poltrona, cadeiras, estante e móvel da TV acompanham a rotação real. Cama, cozinha, lareira, mesa e baú já bloqueavam. |
| Celeiro | Pilhas/fardos de feno sem colisão; criadas pegadas sólidas, com deduplicação dos fardos empilhados. Bebedouro baixo adicionado. Cochos passam seu ângulo. Divisórias, baías, depósito, barril, ninhos e cesto já possuíam colisores. |
| Pousada | Divisória alta ao lado da cama estava atravessável; adicionado retângulo estreito no local. Balcão, mesas, cama, cadeiras, estante e barril já bloqueavam. |
| Casa da Rosa | Cama, roda de fiar, cozinha, mesinha, ateliê e estante já bloqueavam; cadeiras recebem a correção comum de rotação. Objetos suspensos e utensílios sobre móveis não ganharam volumes no chão. |
| Casa do Pescador | Rack de varas, barris, cama, mesas e mesinha já bloqueavam. Cadeiras recebem a correção comum. Redes e o barquinho na prateleira continuam decoração suspensa. |
| Capela | Bancos, altar, púlpito e mesinhas já tinham colisores explícitos; preservados o corredor central e a aproximação do altar. |
| Biblioteca | Mesas, arquivo, estantes e expositor já bloqueavam; cadeiras acompanham sua rotação. O relógio e quadros suspensos não bloqueiam a circulação. |
| Clínica | Cama, armário, lavatório e bancadas já bloqueavam. O biombo agora tem três volumes estreitos com as dobras reais, em lugar de um único retângulo largo. |
| Ferraria | A bigorna ultrapassava o volume do barril de suporte; adicionado volume para seu corpo. O fole tinha colisão no eixo errado e deslocada do bico; corrigidas posição e rotação. Forja, mesa, caixa e barris preservados. |
| Carpintaria | Bancadas, cavaletes, madeira empilhada e estante já tinham colisores. Mantidos corredores e entrada. Lascas no chão e ferramentas penduradas não viraram paredes invisíveis. |
| Mina | As pedras baixas nas laterais estavam atravessáveis; adicionados círculos ajustados às rochas. Pilares, vagoneta, caixa, mesa e bloqueio do túnel já bloqueavam. Trilhos rasos permanecem piso transitável. |
| Farol térreo | Escada, lanterna, mesa, cadeira e barril já bloqueavam; passagem até o portal e retorno[-2.7,.7] preservados. |
| Galeria do Farol | Base da luneta ajustada ao tripé, corrimãos do poço de escada passaram a bloquear. Lanterna, mesa, banco e barril preservados. Spawn[-2.7,2.0] livre e portal de descida alcançável a distância. O limite circular4.85m é responsabilidade do manager. |

Revisão das entradas por coordenadas: casa[0,3.3], celeiro[0,4.4], pousada/capela[0,4.3], biblioteca[0,4.05], clínica/Rosa/pescador/ferraria/carpinteiro[0,3.8], mina[0,4.8], farol[0,3.3] e galeria[-2.7,2.0] continuam fora dos novos volumes. As posições de interação podem ficar junto ao móvel, pois a interação X admite aproximação pelo corredor e não exige ocupar exatamente o ponto.

Validação: sintaxe dos seis módulos passou; os seis imports nomeados resolveram em Node. Não foi executada bateria de testes nem navegação automática pelos interiores, conforme a prioridade de publicar com reserva de créditos. Limite: é uma auditoria estática de pegadas, não uma garantia de toda trajetória ou animação possível. Mercado e exteriores não pertenciam a este lote de arquivos e devem ser tratados pelo responsável deles. Objetos suspensos, folhagens, antenas, tapetes e utensílios sobre suportes não receberam colisão automática da caixa de toda a cena.