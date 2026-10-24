import test from 'node:test';
import assert from 'node:assert/strict';
import { SPECIES, speciesById, migrateBirding, recordSighting, listRecords, getBirdingProgress, MAX_STORED_PHOTOS, MAX_RECENT_SIGHTINGS, MAX_PHOTO_DATA_URL_LENGTH, MAX_STORED_PHOTO_CHARS } from './birding.js?v=0.17';
const fresh = () => ({ year: 2, season: 1, day: 8, minutes: 570, region: 'mountain' });
const photo = 'data:image/jpeg;base64,/9j/AA==';
const subject = (speciesId = 'urutau', score = 70, id = 'forest-urutau') => ({ speciesId, score, id, area: 'mountain' });
test('older farming saves gain an empty notebook without losing farming fields', () => {
 const s = { ...fresh(), money: 765, plots: [{ crop: 'corn' }] };
 const b = migrateBirding(s);
 assert.equal(b.version, 1); assert.equal(Object.keys(b.records).length, 0);
 assert.equal(s.money, 765); assert.equal(s.plots[0].crop, 'corn');
 assert.equal(migrateBirding(s), b, 'normalized data is reused during HUD refreshes');
});
test('the catalog has stable IDs and separates birds from farm animals', () => {
 assert.deepEqual(new Set(SPECIES.map(x => x.id)), new Set(['urutau', 'cow', 'sheep', 'chicken', 'gull', 'bemtevi', 'sabia', 'snake', 'spider']));
 assert.equal(speciesById('urutau').scientificName, 'Nyctibius griseus');
 assert.equal(speciesById('urutau').kind, 'bird');
 assert.equal(speciesById('cow').kind, 'animal'); assert.equal(speciesById('__proto__'), null);
 assert.equal(speciesById('does-not-exist'), null);
});
test('the first photograph checks one species and records the in-game calendar', () => {
 const s = fresh(); const result = recordSighting(s, subject(), photo);
 assert.equal(result.changed, true); assert.equal(result.newSpecies, true);
 assert.equal(result.record.bestPhoto, photo);
 assert.deepEqual(result.record.firstSeen, { year: 2, season: 1, day: 8, minutes: 570 });
 assert.deepEqual(getBirdingProgress(s), { registered: 1, total: SPECIES.length, birdsRegistered: 1, birdsTotal: SPECIES.filter(a=>a.kind==='bird').length, photos: 1 });
});
test('repeated subjects share one life-list entry and preserve the first encounter', () => {
 const s = fresh(); recordSighting(s, subject(), photo); s.day = 9;
 const result = recordSighting(s, subject('urutau', 30, 'another-branch'), 'data:image/webp;base64,AAAA');
 assert.equal(result.newSpecies, false); assert.equal(result.record.count, 2);
 assert.equal(result.record.firstSeen.day, 8); assert.equal(result.record.lastSeen.day, 9);
 assert.equal(result.record.lastSubjectId, 'another-branch');
 assert.equal(result.record.bestPhoto, photo); assert.equal(result.record.bestScore, 70);
 assert.equal(listRecords(s).length, 1);
});
test('only a better photo replaces the saved thumbnail; a missing image does not erase it', () => {
 const s = fresh(); recordSighting(s, subject(), photo);
 const better = 'data:image/webp;base64,BBBB';
 recordSighting(s, subject('urutau', 90), better);
 recordSighting(s, subject('urutau', 100), null);
 const r = listRecords(s)[0];
 assert.equal(r.bestScore, 100); assert.equal(r.bestPhotoScore, 90); assert.equal(r.bestPhoto, better);
});
test('an observation without a thumbnail can receive its first thumbnail later', () => {
 const s = fresh(); recordSighting(s, subject('urutau', 100));
 recordSighting(s, subject('urutau', 20), photo);
 const r = listRecords(s)[0]; assert.equal(r.bestPhoto, photo); assert.equal(r.bestScore, 100); assert.equal(r.bestPhotoScore, 20);
});
test('unknown subjects cannot create check marks or arbitrary species', () => {
 const s = fresh();
 for (const value of [null, {}, subject('__proto__'), subject('constructor'), subject('invented')]) {
  assert.equal(recordSighting(s, value).changed, false);
 }
 assert.equal(s.birding, undefined);
});
test('oversized, non-image and non-thumbnail URLs cannot occupy notebook storage', () => {
 const bad = [
  'https://example.test/photo.jpg', 'data:image/svg+xml;base64,AAAA', 'data:text/html;base64,AAAA',
  'data:image/jpeg;base64,' + 'A'.repeat(MAX_PHOTO_DATA_URL_LENGTH), { value: photo }
 ];
 for (const candidate of bad) {
  const s = fresh(); const r = recordSighting(s, subject(), candidate).record;
  assert.equal(r.bestPhoto, null); assert.equal(r.count, 1);
 }
});
test('JSON round trips retain check marks, best images and observation order', () => {
 const s = fresh(); recordSighting(s, subject('cow'), photo); recordSighting(s, subject('urutau', 80), photo);
 const loaded = JSON.parse(JSON.stringify(s)); migrateBirding(loaded);
 assert.deepEqual(listRecords(loaded).map(r => r.speciesId), ['urutau', 'cow']);
 assert.equal(loaded.birding.records.urutau.bestPhoto, photo);
 assert.equal(loaded.birding.records.cow.count, 1);
 assert.equal(recordSighting(loaded, subject('urutau')).newSpecies, false);
});
test('corrupt optional fields are sanitized independently of valid observations', () => {
 const records = JSON.parse('{"__proto__":{"count":99},"urutau":{"count":-4,"firstSeen":null,"lastSeen":{"year":-20,"season":99,"day":100,"minutes":-1},"bestScore":999,"bestPhoto":"data:text/html;base64,AAAA"},"future_bird":{"count":3,"name":"Ave futura"}}');
 const s = { ...fresh(), birding: { records, recent: [{ speciesId: 'urutau', seen: null }, { speciesId: 'missing' }] } };
 migrateBirding(s); const r = s.birding.records.urutau;
 assert.equal(Object.hasOwn(s.birding.records, '__proto__'), false);
 assert.equal(r.count, 1); assert.equal(r.lastSeen.year, 1); assert.equal(r.lastSeen.season, 3); assert.equal(r.lastSeen.day, 30);
 assert.equal(r.bestScore, 100); assert.equal(r.bestPhoto, null);
 assert.equal(s.birding.records.future_bird.count, 3, 'future catalog data is retained');
 assert.equal(s.birding.recent.length, 1);
});
test('thousands of saved metadata records survive while thumbnails remain bounded', () => {
 const records = {};
 for (let i = 0; i < 4000; i++) records['future_' + i] = {
  count: 2, firstSeen: fresh(), lastSeen: fresh(), bestScore: 60, bestPhoto: i < 40 ? photo : null, order: i + 1, photoOrder: i + 1
 };
 const s = { ...fresh(), birding: { records } }; migrateBirding(s);
 assert.equal(listRecords(s).length, 4000);
 assert.equal(Object.values(s.birding.records).filter(r => r.bestPhoto).length, MAX_STORED_PHOTOS);
 assert.equal(s.birding.records.future_0.count, 2);
 assert.equal(s.birding.records.future_0.bestPhoto, null);
 assert.equal(s.birding.records.future_39.bestPhoto, photo);
});
test('the image budget also bounds total characters independently of the image count', () => {
 const records = {}; const large = 'data:image/jpeg;base64,' + 'A'.repeat(90000);
 for (let i = 0; i < 20; i++) records['future_' + i] = { bestPhoto: large, photoOrder: i + 1, order: i + 1 };
 const s = { ...fresh(), birding: { records } }; migrateBirding(s);
 const photos = Object.values(s.birding.records).filter(r => r.bestPhoto);
 assert.ok(photos.reduce((sum, r) => sum + r.bestPhoto.length, 0) <= MAX_STORED_PHOTO_CHARS);
 assert.equal(Object.keys(s.birding.records).length, 20); assert.ok(photos.length < MAX_STORED_PHOTOS);
 assert.equal(s.birding.records.future_19.bestPhoto, large);
});
test('a long photo session bounds recent history but keeps the checklist and total count', () => {
 const s = fresh();
 for (let i = 0; i < 70; i++) recordSighting(s, subject('urutau', 50, 'branch-' + i), photo);
 assert.equal(s.birding.recent.length, MAX_RECENT_SIGHTINGS);
 assert.equal(s.birding.recent[0].subjectId, 'branch-30');
 assert.equal(s.birding.records.urutau.count, 70);
 assert.equal(getBirdingProgress(s).registered, 1);
});
