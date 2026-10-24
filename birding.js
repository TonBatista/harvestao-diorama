// Stable catalog IDs also identify saved life-list entries. New species can be
// appended without migrating existing check marks or keeping animals in memory.
export const SPECIES = Object.freeze([
  Object.freeze({ id: 'urutau', name: 'Urutau', scientificName: 'Nyctibius griseus', kind: 'bird', icon: '🪶', habitat: 'Floresta da montanha', description: 'Uma ave de hábitos noturnos que descansa camuflada, ereta, parecendo parte de um galho quebrado. Seus grandes olhos amarelos ajudam a reconhecê-la.', sourceUrl: 'https://birdnet.cornell.edu/taxonomy/species/Nyctibius%20griseus' }),
  Object.freeze({ id: 'gull', name: 'Gaivota-prateada', scientificName: 'Larus argentatus', kind: 'bird', icon: '🪶', habitat: 'Praia das Conchas', description: 'Observe as aves marinhas que passam perto do cais. Neste vale, as gaivotas são representadas pela gaivota-prateada.' }),
  Object.freeze({id:'bemtevi',name:'Bem-te-vi',scientificName:'Pitangus sulphuratus',kind:'bird',icon:'🪶',habitat:'Fazenda, vila e bosque',description:'Procure a pequena ave de peito amarelo nos poleiros e nas bordas dos caminhos.'}),
  Object.freeze({id:'sabia',name:'Sabiá-laranjeira',scientificName:'Turdus rufiventris',kind:'bird',icon:'🪶',habitat:'Jardins, bosque e caminho da praia',description:'Sua barriga alaranjada ajuda a reconhecer esta ave nos jardins do vale.'}),
  Object.freeze({id:'snake',name:'Cobra',scientificName:'',kind:'animal',icon:'♧',habitat:'Bosque da montanha',description:'Identificação geral deste encontro. Observe à distância e use o zoom para fotografar.'}),
  Object.freeze({id:'spider',name:'Aranha',scientificName:'',kind:'animal',icon:'♧',habitat:'Chão do bosque',description:'Um pequeno encontro entre folhas e pedras. Identificação geral; outras espécies poderão ser catalogadas depois.'}),
  Object.freeze({ id: 'cow', name: 'Vaca', scientificName: '', kind: 'animal', icon: '🐄', habitat: 'Celeiro', description: 'As vacas da fazenda também podem entrar no seu álbum. Procure um bom ângulo e registre seus detalhes.' }),
  Object.freeze({ id: 'sheep', name: 'Ovelha', scientificName: '', kind: 'animal', icon: '🐑', habitat: 'Celeiro', description: 'A lã macia e o focinho curioso das ovelhas rendem boas fotografias na fazenda.' }),
  Object.freeze({ id: 'chicken', name: 'Galinha', scientificName: '', kind: 'animal', icon: '🐔', habitat: 'Celeiro', description: 'As galinhas e seus pintinhos circulam pelo celeiro. Fotografe sem precisar interromper seus passeios.' })
]);
const CATALOG = new Map(SPECIES.map(species => [species.id, species]));
export const MAX_STORED_PHOTOS = 20;
export const MAX_RECENT_SIGHTINGS = 40;
export const MAX_PHOTO_DATA_URL_LENGTH = 100000;
export const MAX_STORED_PHOTO_CHARS = 600000;
const normalized = new WeakSet();
const ID = /^[a-z][a-z0-9_-]{0,79}$/;
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const integer = (value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) ? Math.min(max, Math.max(min, value)) : fallback;
const text = (value, max = 100) => typeof value === 'string' ? value.slice(0, max) : '';
const scoreOf = value => Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 50;
function calendar(value = {}) {
  value = object(value) ? value : {};
  return { year: integer(value.year, 1, 1, 999999), season: integer(value.season, 0, 0, 3), day: integer(value.day, 1, 1, 30), minutes: integer(value.minutes, 360, 0, 1560) };
}
function photoOf(value) {
  return typeof value === 'string' && value.length <= MAX_PHOTO_DATA_URL_LENGTH &&
    /^data:image\/(?:jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) ? value : null;
}
const orderOf = value => integer(value, 0);
function capPhotos(records) {
  const photographed = Object.values(records).filter(record => record.bestPhoto);
  photographed.sort((a, b) => b.photoOrder - a.photoOrder || a.speciesId.localeCompare(b.speciesId));
  let kept = 0, chars = 0;
  for (const record of photographed) {
    if (kept < MAX_STORED_PHOTOS && chars + record.bestPhoto.length <= MAX_STORED_PHOTO_CHARS) {
      kept++; chars += record.bestPhoto.length; continue;
    }
    record.bestPhoto = null;
    record.bestPhotoScore = 0;
    record.photoOrder = 0;
  }
}
export function speciesById(id) { return CATALOG.get(id) || null; }

// Validate optional data separately from the farming save: older saves keep
// working, and a damaged or oversized image cannot erase the life list.
export function migrateBirding(state) {
  const source = object(state.birding) ? state.birding : {};
  if (normalized.has(source)) return source;
  const records = Object.create(null);
  let sequence = orderOf(source.sequence);
  if (object(source.records)) for (const [id, entry] of Object.entries(source.records)) {
    if (!ID.test(id) || !object(entry)) continue;
    const bestPhoto = photoOf(entry.bestPhoto);
    const order = orderOf(entry.order);
    const photoOrder = bestPhoto ? orderOf(entry.photoOrder) : 0;
    sequence = Math.max(sequence, order, photoOrder);
    records[id] = {
      speciesId: id,
      name: text(entry.name) || speciesById(id)?.name || id,
      count: integer(entry.count, 1, 1, 1000000000),
      firstSeen: calendar(object(entry.firstSeen) ? entry.firstSeen : state),
      lastSeen: calendar(object(entry.lastSeen) ? entry.lastSeen : object(entry.firstSeen) ? entry.firstSeen : state),
      area: text(entry.area, 60),
      lastSubjectId: text(entry.lastSubjectId, 100),
      bestScore: scoreOf(entry.bestScore),
      bestPhoto,
      bestPhotoScore: bestPhoto ? scoreOf(entry.bestPhotoScore ?? entry.bestScore) : 0,
      photoOrder,
      order
    };
  }
  capPhotos(records);
  const recent = Array.isArray(source.recent) ? source.recent.slice(-MAX_RECENT_SIGHTINGS).flatMap(entry => {
    if (!object(entry) || !ID.test(entry.speciesId || '') || !Object.hasOwn(records, entry.speciesId)) return [];
    const order = orderOf(entry.order);
    sequence = Math.max(sequence, order);
    return [{ speciesId: entry.speciesId, subjectId: text(entry.subjectId, 100), area: text(entry.area, 60), seen: calendar(entry.seen), score: scoreOf(entry.score), order }];
  }) : [];
  const birding = { version: 1, records, recent, sequence };
  state.birding = birding;
  normalized.add(birding);
  return birding;
}
export function getBirdingProgress(state) {
  const birding = migrateBirding(state);
  const known = SPECIES.filter(species => Object.hasOwn(birding.records, species.id));
  return {
    registered: known.length,
    total: SPECIES.length,
    birdsRegistered: known.filter(species => species.kind === 'bird').length,
    birdsTotal: SPECIES.filter(species => species.kind === 'bird').length,
    photos: Object.values(birding.records).filter(record => record.bestPhoto).length
  };
}
export function listRecords(state) {
  return Object.values(migrateBirding(state).records).sort((a, b) => b.order - a.order || a.speciesId.localeCompare(b.speciesId));
}
export function recordSighting(state, subject, photoDataURL = null) {
  const species = speciesById(subject?.speciesId);
  if (!species) return { changed: false, message: 'Enquadre uma ave ou um animal para fotografar.', newSpecies: false, record: null };
  const birding = migrateBirding(state);
  const previous = birding.records[species.id];
  const newSpecies = !previous;
  const seen = calendar(state);
  const score = scoreOf(subject.score);
  const photo = photoOf(photoDataURL);
  const order = Math.min(Number.MAX_SAFE_INTEGER, birding.sequence + 1);
  const record = previous || {
    speciesId: species.id, name: species.name, count: 0, firstSeen: seen,
    bestScore: 0, bestPhoto: null, bestPhotoScore: 0, photoOrder: 0
  };
  record.count = Math.min(1000000000, record.count + 1);
  record.lastSeen = seen;
  record.name = species.name;
  record.area = text(subject.area, 60) || text(state.region, 60) || 'farm';
  record.lastSubjectId = text(subject.id, 100);
  record.bestScore = Math.max(record.bestScore, score);
  record.order = order;
  if (photo && (!record.bestPhoto || score > record.bestPhotoScore)) {
    record.bestPhoto = photo;
    record.bestPhotoScore = score;
    record.photoOrder = order;
  }
  birding.records[species.id] = record;
  birding.sequence = order;
  birding.recent.push({ speciesId: species.id, subjectId: record.lastSubjectId, area: record.area, seen, score, order });
  if (birding.recent.length > MAX_RECENT_SIGHTINGS) birding.recent.splice(0, birding.recent.length - MAX_RECENT_SIGHTINGS);
  capPhotos(birding.records);
  return {
    changed: true,
    newSpecies,
    record,
    message: newSpecies ? species.name + ': nova espécie registrada no caderno!' : species.name + ': fotografia registrada (' + record.count + ' observações).'
  };
}
