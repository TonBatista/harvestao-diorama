# Harvestão — a vida no campo

Versão 0.14. Fazenda em miniatura para navegador, com regiões conectadas.

## Explore o vale

- **Sua casa:** piso de madeira, cozinha com pia e fogão, mesa de refeições, lareira acesa, poltrona, estante, televisão, cama e baú. A cama permite dormir; o baú abre a mochila. O tempo fica parado nos interiores.
- **Celeiro:** baias, cochos, feno, sacos de ração, barris e ninhos. Três vacas, duas ovelhas, três galinhas e dois pintinhos têm animações próprias. Você pode alimentar os animais, acariciá-los e recolher ovos uma vez por dia.
- **Vila Mineral:** praça com fonte animada, bancos, jardins, mercado, pousada, capela, biblioteca, clínica, ferraria e casa. Seis moradores têm falas. O mercado vende sementes.
- **Montanha da Lua:** bosque, riacho, ponte, cachoeira, entrada da mina, cristais, águas termais, mirante e pontos de coleta de ervas e cogumelos.
- **Praia das Conchas:** costa curva, ondas, píer, barco, pescador, quiosque, guarda-sóis, farol, conchas e gaivotas.

Use as portas e placas, ou abra o **mapa** pelo botão ao lado da mochila. O mapa permite visitar qualquer área e voltar à fazenda. O progresso preserva a região visitada e os achados.

## Controles

WASD ou setas movem. R alterna corrida e caminhada; Shift força corrida. E ou B interage. Espaço ou A usa a ferramenta na fazenda e interage nos outros lugares. M abre o mapa, I abre a mochila, F guarda a colheita e Q troca ferramenta. No celular, use o direcional e os botões na tela.

A barra vertical de zoom fica à esquerda: + no topo, − na base. Arraste a barra, use a roda do mouse ou pinça com dois dedos. A porcentagem ou a tecla 0 restauram 100%. Intervalo: 70% a 340%.

## Fazenda e desempenho

Plantio, rega, crescimento, colheita, mochila, vendas e descanso permanecem disponíveis. A corrida suave e o personagem com boné verde, macacão violeta e mochila laranja gasta foram mantidos.

As geometrias das novas áreas são criadas ao visitar cada lugar; a região anterior é removida e seus buffers próprios são liberados. Somente a região ativa é desenhada. A fazenda mantém canteiros atualizados por bloco, vegetação em regiões visíveis, sombras próximas ao jogador e resolução adaptativa. Menus e abas ocultas suspendem a animação.

Esta é a primeira implementação dos ambientes exploráveis. As fachadas da cidade ainda não têm todos os seus interiores; rotinas completas de moradores, relações, festivais, mineração profunda e sistema de pesca ficam para próximas versões. Os achados e os cuidados básicos dos animais são independentes dos sistemas sociais e de produção completos do jogo original.

## Desenvolver

Sirva esta pasta por HTTP. Não é necessário instalar dependências para jogar; exige WebGL. As regras básicas podem ser executadas com node --test simulation.test.js. package.json também lista verificações de sintaxe. A revisão adicional de navegador não foi executada nesta etapa, conforme solicitado.

Esta versão foi editada no GitHub porque os processos locais falharam ao iniciar com 0x80070020. Antes de continuar na cópia local, sincronize a branch main nas pastas de desenvolvimento e publicação.

Three.js possui licença MIT; consulte THREE-LICENSE.txt.
