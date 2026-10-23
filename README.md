# Harvestão — cena de retomada

Versão 0.13. Primeira cena jogável, ainda em desenvolvimento.

## Controles e personagem 0.13

Barra vertical à esquerda, com + no topo e − na base. Arraste para ajustar de 70% a 340%; porcentagem ou tecla 0 restauram 100%. A barra também aceita teclado e não interfere no movimento.

Olhos castanhos menores, mangas e lenço menos volumosos, macacão violeta acinzentado, boné verde e mochila laranja gasta. Sem aumento na geometria. Orientação inicializada pelo progresso, normalizada e protegida contra valores inválidos; giro suave pelo menor arco. O giro atual foi conferido no direcional do jogo; matemática validada em oito direções a 30/60/120 FPS. Importações versionadas em 0.13 para renovar o cache.

Esta revisão foi editada diretamente no GitHub devido à falha local de início de processos (0x80070020). Antes da próxima edição local, sincronize main nas pastas de desenvolvimento e publicação.

## Personagem e câmera 0.12

Boné mais baixo com abertura real, cabelo em duas mechas curvas, rosto e olhos revisados, luvas menores e macacão contínuo com deformação nas pernas. Paleta verde e roxo desbotados, mochila de lona laranja gasta. O controlador de caminhada, corrida e ferramentas foi preservado.

Zoom suave de 70% a 340%: botões + e −, roda do mouse ou pinça com dois dedos. O botão da porcentagem e a tecla 0 restauram 100%. A aproximação centraliza o personagem e a preferência fica salva no dispositivo.

Validação: 12 verificações de zoom, 19 de movimento/interação, controles por toque e 11 testes de regras sem erros.

## Desempenho 0.11

Vegetação separada em regiões visíveis, plantas com malhas menores e canteiros atualizados por bloco. As geometrias fundidas preservam os índices dos vértices e dispensam cópias temporárias. Sombras PCF com área próxima ao jogador, atualização a até 30 Hz durante o movimento e custo reduzido nos pequenos detalhes. A lente usa menos amostras. O jogo suspende a renderização com menus abertos ou aba oculta, limita a resolução em telas de toque e ajusta-a automaticamente após lentidão sustentada.

Comparação local no Chrome, sem medição de celular físico: durante movimento, cerca de 3,93 milhões para 0,92–1,25 milhão de triângulos médios por quadro nas cenas medidas. Em lavoura com 144 cultivos, regar um canteiro caiu de 456,4 ms para 9,3 ms; buffers de geometria de 262,7 MB para 56,2 MB. São medidas do ambiente de teste, não garantia de FPS em todos os aparelhos.

Validação: 11 testes de regras, 19 verificações de movimento/interação, sete cultivos maduros e carregados, chuva e entardecer, ajuste de resolução, suspensão no menu e 24 reconstruções sem crescimento da contagem de geometrias da GPU.

## Personagem 0.10

Proporções refeitas para a miniatura da referência: cabeça e boné maiores, rosto curto com bochechas arredondadas, mechas mais curtas e volumosas e corpo compacto. Botas e solas arredondadas. Calças contínuas com skinning nos dois ossos originais de cada perna, removendo a divisão visual dos joelhos. Cabeça e ombros foram reposicionados; as medidas das pernas, velocidades e o controlador de animação continuam iguais. Mantida a paleta verde, roxo e laranja desbotados e a mochila gasta.

Verificação: 19 testes de integração no navegador e inspeção de 64 poses de caminhada/corrida, sem erros.

## Referências visuais 0.9

Personagem remodelado com boné arredondado para trás, abertura frontal, duas mechas grandes, olhos verticais e luvas claras. Verde, roxo e laranja desbotados na roupa e mochila. Mantidos os pivôs e o código da caminhada, corrida e ferramentas.

Plantas refeitas com folhas curvas e espessas, nervuras, rosetas de hortaliças e cachos de morango. Árvores com ramificações e folhas individuais, grama curva mais densa e tocos com anéis irregulares. O terreno ganhou relevo e textura de terra compacta mais suave.

## Personagem 0.8

Modelo do fazendeiro refeito com rosto, cabelo, boné de seis painéis, roupa e botas mais detalhados. Mochilinha de lona laranja dessaturada e gasta, com aba, bolso, alças, costuras e fivelas envelhecidas. Os pivôs e o código de caminhada, corrida e ferramentas foram preservados.

## Revisão visual 0.7

Materiais fotográficos gerados para terra, casca, musgo, folhas, madeira, pedra, argila e tecido. Os sete cultivos têm modelos próprios, com folhas nervuradas e frutos distinguíveis. As árvores têm folíolos individuais e a relva está mais densa. Terra preparada com bordas suaves, sombras de contato proporcionais ao crescimento e desfoque de miniatura fora da faixa de interação. ART-DIRECTION-v07.md contém o método, os arquivos e os prompts completos.

## Acabamento visual 0.6

Construções refeitas com madeira texturizada, telhas sobrepostas, cumeeira, venezianas, floreiras, trepadeiras e chaminés de tijolo. Copas irregulares e relva com folhas curvas substituem volumes lisos e cones. Os canteiros têm relevo com sulcos. O personagem ganhou costuras no boné e no macacão, cadarços, nó do lenço, respiração e piscadas. Calendário e ferramentas receberam molduras mais definidas. A corrida, os controles e o formato do progresso continuam compatíveis.

## Atualização de visual e movimento

Corrida ativada por padrão: velocidade máxima de 4,6 unidades/s (antes 3,3), com aceleração e frenagem suaves, curvas acompanhadas pelo personagem e câmera mais responsiva. O ciclo das pernas acompanha a distância percorrida e suaviza a troca entre apoio e balanço. R ou o botão Corrida alterna para caminhada de precisão, a 2,4 unidades/s; Shift força a corrida. Abrir menus, perder o foco ou usar ferramentas interrompe a velocidade.

Terra e musgo com texturas mais suaves, canteiros arredondados, ervas com folhas modeladas e vegetação baixa nas bordas da plantação. O cenário e o progresso salvo são preservados.

## Implementado

Cenário 3D com terra texturizada, folhas modeladas e sombras. Personagem em verde musgo, ocre, marrom e lenço roxo. Caminhada e corrida articuladas, com joelhos e pés acompanhando a distância percorrida; as colisões interrompem os passos. As ferramentas têm antecipação, recuperação e efeitos atrasados até a ação.

Direcional contínuo por toque, corrida, mochila, cultivo, rega, colheita, vendas, descanso e salvamento local. O formato de progresso anterior é compatível; use exportar/importar para transferir entre endereços.

## Estado real

O acabamento ainda está abaixo das referências aprovadas e precisa de revisão artística. Não é o jogo completo nem uma reprodução fiel de todos os sistemas de Back to Nature. Vila, NPCs, relações, animais, interiores e eventos continuam pendentes. As regras do original ainda precisam ser documentadas e conferidas.

## Jogar e desenvolver

Sirva esta pasta por HTTP. Exige WebGL; não é necessário instalar pacotes.

WASD/setas para mover, Espaço para ferramenta, E para interação, R para alternar corrida/caminhada, Shift para correr, I para mochila, F para guardar e Q para trocar ferramenta. No celular, use os controles na tela.

Validação: node --test simulation.test.js. Passaram 11 testes de regras e 19 verificações de integração no navegador, incluindo aceleração consistente a 30/120 fps, frenagem, velocidade diagonal, colisões, animação e cultivo. Também foram verificados direcional por ponteiro, alternância de corrida e parada ao abrir a mochila. O teste móvel usou janela estreita no navegador desktop; desempenho em celular físico ainda não foi medido.

caminhada-corrida.png contém 64 quadros transparentes renderizados do modelo: oito colunas; quatro direções de caminhada nas primeiras quatro linhas e corrida nas quatro seguintes. O jogo anima o modelo 3D em tempo real.

BASE-DO-PROJETO.md registra o pedido recuperado da conversa original e os próximos critérios de entrega. Arquivos antigos de arte e do renderizador 2D continuam nesta cópia como referência, mas não são carregados.
