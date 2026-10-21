# Revisão visual 0.7

O cenário jogável passou a usar materiais fotográficos, folhagem modelada por espécie, copa com folíolos individuais, relva mais densa, sombras de contato e uma lente com desfoque suave fora da faixa de interação. As referências guiam a escala, os materiais e a iluminação. A revisão não substitui a fazenda salva.

## Materiais gerados

Modo: ferramenta integrada **imagegen**. Os atlas foram copiados para esta pasta e são carregados por `miniature-materials.js`; nenhum recurso depende da pasta temporária ou da pasta pessoal do gerador.

- `material-atlas-v07.png`: terra, casca, musgo e superfície de folha.
- `cottage-atlas-v07.png`: pedra, madeira, argila e tecido.

O código extrai os quadrantes, ajusta a escala e o contraste e usa os mapas de cor também para relevo sutil. A textura da folha não é aplicada às massas das copas: estas usam musgo em escala menor e folíolos na superfície. A textura de sementes dos morangos é produzida por código para acompanhar a geometria dos frutos.

## Prompt do primeiro atlas

Use case: photorealistic-natural. Asset type: production material atlas for a real-time miniature farming diorama. Create ONE square 2048x2048 texture atlas, divided into exactly four equal square quadrants with no gaps, no borders, no labels. Each quadrant is a full-bleed flat overhead orthographic material scan with uniformly diffuse lighting, no directional cast shadows and no perspective.

TOP LEFT: rich natural dark umber garden earth, fine irregular crumbly soil clumps and pores, subtle small roots, realistic fine microrelief, earthy brown not orange or gravel. Soil photographed as 1 square metre.

TOP RIGHT: aged oak bark with long vertical ridges, fine cracks, realistic muted warm grey-brown bark; no tree silhouette, just bark surface.

BOTTOM LEFT: very dense tiny living meadow moss, olive and fresh forest green microleaves, natural uneven organic texture, photographed close overhead; no large leaves or objects.

BOTTOM RIGHT: one enlarged flat green turnip leaf surface filling the ENTIRE square, its pale central vein exactly down the middle from bottom centre to top centre and fine secondary veins branching diagonally, subtle matte waxy surface and fine tiny ripples, mid olive green. No outline or background: the whole square is leaf tissue, used inside a leaf-shaped 3D mesh.

Style: extremely tactile high-end miniature photography, detailed but natural low contrast albedo, consistent realistic material scales. Avoid cartoon, toy plastic, painted illustration, baked glossy highlights, oversized rocks, props, text and watermarks. This is only a texture atlas; do not make a scene or include any UI.

## Prompt do segundo atlas

Use case: photorealistic-natural. Production albedo texture atlas for a handcrafted miniature cottage. ONE square 2048x2048 image, exactly four equal square quadrants with no borders, text or labels. Flat overhead orthographic material scans under even diffuse light, no cast shadows, no perspective.

Top left: weathered old warm grey limestone surface, fine granular mottling with very subtle soft olive lichen patches, no large joints, no outline.

Top right: natural aged pale oak wood surface with long vertical grain, faint cracks and knots, one continuous flat surface, grey-beige muted color, no plank seams.

Bottom left: one continuous weathered terracotta clay surface in muted taupe-grey and dusty earth red variation, pores and tiny worn pits, no tile grid, no tiles or object outlines, no dramatic cracks.

Bottom right: fine neutral off-white woven canvas cotton fabric, tiny thread weave with realistic tactile microdetail, evenly flat, no folds.

High-end realistic macro photography, natural matte surfaces, soft albedo, no cartoon or stylized noise. Each whole quadrant is only the requested material filling it edge to edge.

## Validação

As capturas de `miniatura-v07-*` vêm do jogo em execução. O cenário foi conferido em retrato, paisagem e desktop. Todos os sete cultivos foram renderizados maduros e carregados, além das condições de chuva e fim de tarde, sem erros JavaScript ou de compilação dos shaders. Os testes de regras e de integração continuam separados em `validation.json` e `art-validation-v07.json`.

O desempenho em um celular físico continua sem medição. O efeito de lente acrescenta um passe de tela, mantendo os controles HTML nítidos.
