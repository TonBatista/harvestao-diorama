# Colisões e pulinhos — revisão v0.28

A revisão foi feita nos construtores dos cenários: fazenda, propriedades do lago, lago, vila, montanha, praia, mercado e os treze interiores. Foram corrigidas pegadas explícitas dos objetos; não foram criadas caixas automáticas para toda a malha de um cenário.

## Problemas encontrados

- Tocos decorativos do campo principal não tinham colisão. Agora têm altura e raio e acionam um salto curto automático.
- Cercas, bancos, varandas, postes, pilhas, vasos, mesas, barris e detalhes de oficinas tinham colisões ausentes ou imprecisas em vários cenários.
- Alguns móveis rodados conservavam um volume alinhado ao cenário. O teste de colisão agora respeita o ângulo real.
- O lago era protegido por círculos aproximados; o mar deixava uma faixa inteira aberta ao redor do píer. Agora as margens bloqueiam a água, conservando somente as passagens das pontes e do deque.
- Trator e carreta estacionados precisavam de volumes próprios para o jogador. O caminho do cachorro continua separado para permitir embarcar na carreta vazia.

## Como funciona

A pé, com as mãos livres, correr em direção a um toco baixo marcado inicia o pulinho, sem botão extra. O personagem eleva os pés, recolhe as pernas e aterrissa do outro lado. O caminho e o ponto de pouso são verificados antes de iniciar. Paredes, móveis, veículos, pedras e obstáculos que exigem limpeza continuam bloqueando. O trator não pula.

O salvamento guarda uma posição segura no chão, mesmo se o autosave acontecer durante o salto. A consulta de colisões usa volumes simples; os duplicados são compactados ao construir a região, sem percorrer todas as malhas a cada quadro.

## Detalhes e limites

- [Interiores](COLLISION-INDOORS.md)
- [Exteriores](COLLISION-OUTDOORS.md)

Gramado, tapetes, flores, folhas, miudezas do chão e utensílios suspensos continuam atravessáveis intencionalmente. A revisão de fontes e coordenadas cobre os cenários existentes; não significa que cada combinação possível de objetos, animações e trajetórias tenha sido exercitada. Não foi executada bateria ampla de testes, conforme a preferência de priorizar publicação.