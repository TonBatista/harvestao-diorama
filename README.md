# Harvestão — Fazenda em miniatura

Jogo de fazenda 3D para navegador, com controles por toque e teclado. Versão 0.11. O personagem foi reproporcionado: cabeça maior e rosto arredondado, boné alto para trás, mechas curtas volumosas, olhos delicados, mangas curtas, luvas e botas arredondadas. As calças são uma malha contínua que dobra nos joelhos. Boné e macacão verde sálvia, lenço roxo e mochila laranja gasta, todos em tons desbotados. Caminhada, corrida e ferramentas mantêm seu código de animação, velocidade e ciclo das pernas. A altura da cabeça e dos ombros acompanha as novas proporções.

A vegetação foi remodelada com folhas curvas espessas e nervuradas, cachos de morango, nabos parcialmente expostos, árvores ramificadas com folhas individuais e grama mais densa. O terreno tem relevo sutil e os tocos têm casca e anéis irregulares de crescimento.

## Desempenho 0.11

Vegetação separada em regiões visíveis, plantas com malhas menores e canteiros atualizados por bloco. As geometrias fundidas preservam os índices dos vértices e dispensam cópias temporárias. Sombras PCF com área próxima ao jogador, atualização a até 30 Hz durante o movimento e custo reduzido nos pequenos detalhes. A lente usa menos amostras. O jogo suspende a renderização com menus abertos ou aba oculta, limita a resolução em telas de toque e ajusta-a automaticamente após lentidão sustentada.

Comparação local no Chrome, sem medição de celular físico: durante movimento, cerca de 3,93 milhões para 0,92–1,25 milhão de triângulos médios por quadro nas cenas medidas. Em lavoura com 144 cultivos, regar um canteiro caiu de 456,4 ms para 9,3 ms; buffers de geometria de 262,7 MB para 56,2 MB. São medidas do ambiente de teste, não garantia de FPS em todos os aparelhos.

Validação: 11 testes de regras, 19 verificações de movimento/interação, sete cultivos maduros e carregados, chuva e entardecer, ajuste de resolução, suspensão no menu e 24 reconstruções sem crescimento da contagem de geometrias da GPU.

## Jogar

[Jogue no GitHub Pages](https://tonbatista.github.io/harvestao-diorama/). O jogo usa WebGL e salva o progresso no armazenamento local do navegador. O salvamento pode ser exportado/importado pelo menu.

- WASD ou setas: mover; corrida já ativada.
- R: alternar corrida/caminhada; Shift: forçar corrida.
- Espaço: usar ferramenta; E: interagir; Q: trocar ferramenta.
- I: mochila; F: guardar colheita.
- No celular, use o direcional circular e os botões na tela.

## Rodar localmente

Sirva esta pasta por HTTP com um servidor estático de sua preferência. Não há dependências para instalar ou etapa de compilação. Abra index.html pelo servidor, não diretamente como arquivo.

Testes das regras: `node --test simulation.test.js`.

## Implementado

Corrida com aceleração/frenagem suaves, colisões, plantio, rega, crescimento, colheita, mochila, vendas, descanso e salvamento local. Sete cultivos com modelos próprios, materiais detalhados, folhagem e sombras de miniatura.

Esta é uma cena jogável em desenvolvimento. Vila, NPCs, relações, animais, interiores e eventos ainda não estão implementados. O desempenho em celular físico ainda não foi medido.

Os atlas de materiais e seus prompts estão documentados em [ART-DIRECTION-v07.md](ART-DIRECTION-v07.md). Three.js mantém sua licença em [THREE-LICENSE.txt](THREE-LICENSE.txt).
