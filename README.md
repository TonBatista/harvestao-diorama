# Harvestão — Fazenda em miniatura

Jogo de fazenda 3D para navegador, com controles por toque e teclado. Versão 0.8.

O personagem usa boné e macacão verde musgo, camisa ocre, lenço roxo e uma mochilinha de lona laranja dessaturada, com desgaste, costuras e fivelas. O modelo preserva os pivôs da caminhada, corrida e ferramentas.

## Jogar

Abra o site publicado no GitHub Pages deste repositório. O jogo usa WebGL e salva o progresso no armazenamento local do navegador. O salvamento pode ser exportado/importado pelo menu.

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
