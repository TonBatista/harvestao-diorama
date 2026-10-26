# Harvestão — a vida no campo

Versão 0.22. Fazenda em miniatura para navegador, com regiões conectadas.

[Jogar no navegador](https://tonbatista.github.io/harvestao-diorama/?v=0.22)

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

Código editado em `outputs/harvestao-v022`. Three.js: licença MIT em `THREE-LICENSE.txt`.
## Câmera, aves e encontros

Equipe a câmera (ferramenta 8) e enquadre uma ave ou animal. A/Espaço ou o obturador fotografa. P ou o botão do caderno abre o registro: cada espécie recebe um check, uma miniatura real do jogo, data, local e contagem. Os registros acompanham o save e podem ser exportados no menu.

Procure o Urutau no toco do bosque da Montanha da Lua. Bem-te-vis e sabiás aparecem em poleiros na fazenda, vila, montanha e caminho da praia; gaivotas passam pelo cais. Os animais do celeiro, a cobra e a aranha do bosque também podem ser fotografados. A coleção começa com 9 entradas, das quais 4 são aves. O catálogo utiliza IDs estáveis, busca e paginação para ampliar a lista depois; não contém milhares de modelos nesta versão.

Cantos naturais gravados são carregados sob demanda quando há uma ave próxima, após o primeiro toque/tecla. Quando o canto começa, um ! aparece por cerca de 1,5 segundo sobre o personagem. Cobra e aranha geram o aviso visual quando encontradas de perto; não têm ataques nesta versão. O botão ♫ permite desligar os cantos. Os áudios dependem de conexão com Wikimedia Commons: [autores, licenças e fontes](AUDIO-CREDITS.md).

Para manter o save leve, metadados de espécies são preservados, mas as miniaturas têm limite de quantidade e tamanho. Novas fotografias não geram cópias ilimitadas da mesma espécie.

## Sons do vale — versão 0.18

Dez temas originais acompanham as quatro estações, vila, interiores, bosque, praia, noite e chuva. Instrumentação suave de flauta, cordas dedilhadas, baixo e percussão leve, com variações entre ciclos e transições de volume ao mudar de lugar. As composições são próprias, com clima de jogos de fazenda clássicos.

Vento, água corrente, ondas, chuva e lareira são ambientes procedurais leves. Música e ambientes são sintetizados em tempo real por Web Audio, sem downloads de trilha. Os cantos naturais continuam usando os arquivos e créditos em AUDIO-CREDITS.md.

Clique ou toque para iniciar o som. Abra Menu → Som e música para ajustar volume geral, música e ambiente, silenciar tudo ou desligar os cantos. Preferências ficam salvas. Menus reduzem o volume, e a aba oculta suspende a síntese.

## Lago, terrenos e trator — versão 0.19
Abra o mapa para visitar o Lago dos Ipês, ligado à Montanha da Lua. Há três terrenos de 24 × 26: Recanto dos Salgueiros (300 G), Margem do Amanhecer (1.800 G) e Clareira dos Pinheiros (2.400 G). Aproxime-se da placa e use B/E para comprar. Cada propriedade tem seus próprios 144 canteiros persistentes. Limpe ervas com mãos/foice, galhos com machado e pedras com martelo. O lenhador Tomé tem uma oficina junto ao lago e pode ser chamado pela caixa de encomendas do terreno. Casa: 450 G + 12 madeiras; celeiro: 650 G + 18 madeiras. Limpe os quatro obstáculos do local antes de construir. A casa e o celeiro abrem interiores; poço e caixa de vendas funcionam na nova fazenda. Todas as plantações continuam crescendo ao dormir.

O trator verde já está estacionado no acesso leste da fazenda, perto do poço. B/E entra e sai; direcional/WASD dirigem; A/Espaço alterna a roçadeira. Ela corta apenas ervas e preserva culturas. O botão Trator e carreta permite acoplar a carretinha e transportar um animal por vez. Aproxime-se do portão do celeiro para embarcar; desembarque na fazenda ou em uma propriedade com celeiro construído. Animais transferidos ficam visíveis no pasto, mantêm fome/amizade e podem ser alimentados, acariciados e fotografados. Leve o trator aos terrenos pelo mapa. O progresso permanece no save, sem substituir a fazenda original. Veículos e pastos usam geometrias compartilhadas e só a região ativa é desenhada.
## Sininho e rebanho — versão 0.20
Clique na plaquinha pequena do celeiro, ou aproxime-se e use B/E, para abrir Celeiro e pasto. O sininho chama os animais para fora; toque novamente após a caminhada para recolher. Eles caminham pela porta e pelo acesso lateral até o pasto, com pernas animadas e saídas escalonadas. Animais na carretinha ou em outras propriedades não são chamados. A caminhada é salva e retoma ao recarregar. O som respeita os volumes e silenciar tudo.

Ao desembarcar da carretinha, escolha Levar para o celeiro ou Deixar no pasto. Cada terreno mantém seus próprios animais dentro ou fora. Os cuidados e a amizade permanecem. Placas dos imóveis ficaram menores: clique nelas para ler o texto; não há mais texto grande sobre os edifícios. As placas do celeiro também mostram o sininho.
## Agenda, paisagem e movimento — versão 0.21
Os atalhos superiores ficam pequenos e translúcidos após alguns segundos, sem perder o primeiro toque ou a área de clique. Hover, foco pelo teclado e toque revelam os botões. Direcional, A/B e ferramentas mantêm a visibilidade. Clique no relógio para abrir a Agenda do vale: 30 dias, navegação pelas quatro estações e anos, hoje, previsão de chuva, coleta diária às17h e últimos dias de plantio calculados pelo crescimento. Anote, edite e apague compromissos pessoais; a agenda acompanha o progresso. Os marcadores correspondem às regras atuais do jogo, sem anunciar festivais ainda não implementados.

Terrenos do lago usam o mesmo atlas e relevo de terra e relva da fazenda principal, cercados por vegetação, trilhas e margens mais densas. Entrar em uma propriedade ainda vazia mostra terra a limpar, mato, pedras e galhos. Casa e celeiro só aparecem quando construídos; poço e entregas são liberados com a casa. A visão do lago acompanha a limpeza e as construções de cada terreno. Relva instanciada, materiais compartilhados e menor densidade em telas de toque mantêm a paisagem leve.

A carreta tem eixo independente ligado ao engate por uma barra articulada de comprimento fixo; acompanha as curvas com atraso natural e mantém posição ao estacionar/desacoplar. Animais usam fila e distâncias conforme o tamanho do corpo, aguardam passagem livre e voltam aos oito lugares corretos do celeiro. Do lado de fora exploram os espaços livres da fazenda, evitando plantas, obstáculos, o personagem e os outros animais. Rotas e posições permanecem no save.
## As quatro estações — versão 0.22
Os cenários externos mudam automaticamente com a estação salva no calendário, inclusive fazenda, terrenos do lago, vila, montanha e praia. A primavera tem verdes claros e pétalas discretas; o verão ganha verdes mais intensos e pólen; o outono tem copas em laranja, dourado e vermelho, folhas caindo e tapetes de folhas perto das árvores; o inverno cobre chão, relva, copas, telhados e superfícies altas com neve, flocos brancos e luz mais fria. Pinheiros mantêm sua identidade e recebem neve no inverno. Água e interiores permanecem apropriados ao ambiente; o personagem e os animais preservam suas cores.

A mudança usa uniformes de materiais, com texturas originais preservadas e sem novo passe de pós-processamento. Folhas/flocos têm buffers fixos e contagens menores em dispositivos de toque; o tapete de folhas só se recompõe ao trocar de área. Os interiores suspendem os efeitos. Os materiais temporários são restaurados e descartados ao viajar. As malhas instanciadas das paisagens são preservadas pelo agrupamento da região. O símbolo do tempo e a agenda reconhecem neve no inverno; a trilha das estações continua funcionando.