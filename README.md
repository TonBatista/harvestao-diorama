# Harvestão — a vida no campo

Versão 0.16. Fazenda em miniatura para navegador, com regiões conectadas.

[Jogar no navegador](https://tonbatista.github.io/harvestao-diorama/?v=0.16)

## Cuidar dos animais

No celeiro, pegue uma porção no depósito de feno e leve ao cocho indicado de um animal. Cada um tem seu próprio lugar; as galinhas têm compartimentos separados no comedouro. A porção aparece nas mãos e é consumida ao alimentar. Devolva o feno ao depósito se quiser sair sem usá-lo.

Três vacas, duas ovelhas e três galinhas possuem nomes, fome e felicidade persistentes. Os marcadores sobre os animais mostram nome, alimentação e cinco corações; o botão de cuidados lista todos. Alimentar aumenta 8 pontos de felicidade; carinho aumenta 3, uma vez ao dia. Dormir sem alimentar reduz 10. Na manhã seguinte todos precisam de comida novamente. Os pintinhos são decorativos. Os ninhos permitem recolher ovos uma vez por dia.

## Mercado e quatro estações

Entre no mercado pela porta na Vila Mineral ou pelo mapa. Caminhe até uma das quatro prateleiras e use B/E para escolher e comprar sementes. O preço é descontado do dinheiro e o saco entra na mochila. Pode comprar antecipadamente para guardar; só pode plantar na estação correspondente.

- Primavera: nabo, batata, pepino e morango.
- Verão: tomate, milho, cebola, abóbora e abacaxi.
- Outono: batata-doce, cenoura, berinjela e espinafre.
- Inverno: rabanete de inverno, couve e alho-poró.

As espécies de inverno são uma adaptação deste jogo. Cada saco semeia até nove quadrados preparados. A mochila possui filtros por estação para equipar sementes disponíveis. Os canteiros são limpos na virada de estação.

## Explore o vale

Casa mobiliada com cozinha, lareira, cama, TV ilustrada, parquet e tapetes; celeiro; Vila Mineral com sete edifícios e moradores; mercado; montanha com bosque, cachoeira em dois níveis, mina e águas termais; praia com píer, barco de pesca, farol e conchas. Use as portas/placas ou o mapa. Somente a área visitada é desenhada.

O acabamento combina copas de folhas compartilhadas, relva instanciada, caminhos de pedra texturizados, fachadas de pedra e madeira, telhas com musgo, água turquesa e espuma. Detalhes estáticos são agrupados, materiais reutilizados e a resolução/sombras ajustadas para controlar o custo. Não há novos passes de pós-processamento.

## Controles

WASD/setas movem. R alterna corrida/caminhada; Shift corre. E/B interage. Espaço/A usa a ferramenta na fazenda e interage nos interiores. M abre mapa, I mochila, F guarda colheita, Q troca ferramenta. No celular, use o direcional e os botões na tela.

O zoom fica discreto à esquerda: apenas + e − claros quando inativo. Toque ou aproxime o ponteiro para revelar a barra; roda do mouse, pinça e teclas +/− também funcionam. 0 ou a porcentagem restauram 100%. Intervalo 70%–340%.

## Desenvolvimento

Sirva esta pasta por HTTP. Exige WebGL e não precisa instalar dependências para jogar. `npm test` executa regras de cultivo, estações e cuidados; `npm run check` verifica sintaxe. Saves da versão 2 continuam compatíveis. Os interiores pausam o relógio. Esta é uma implementação própria dos sistemas de cuidado e mercado: rotinas sociais completas, festivais e mineração profunda ainda não estão implementados.

Código editado em `outputs/harvestao-v016`. Three.js: licença MIT em `THREE-LICENSE.txt`.