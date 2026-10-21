# Harvestão — Fazenda em miniatura

Jogo de fazenda 3D para navegador, com controles por toque e teclado. Versão 0.9. O personagem tem boné arredondado para trás, duas mechas grandes, olhos verticais, mangas curtas e luvas claras. Boné e macacão verde sálvia, lenço roxo e mochila laranja gasta, todos em tons desbotados. Caminhada, corrida e ferramentas mantêm os mesmos pivôs e código de animação.

A vegetação foi remodelada com folhas curvas espessas e nervuradas, cachos de morango, nabos parcialmente expostos, árvores ramificadas com folhas individuais e grama mais densa. O terreno tem relevo sutil e os tocos têm casca e anéis irregulares de crescimento.

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
