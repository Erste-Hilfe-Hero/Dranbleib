import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const short = n => z.string().trim().min(1).max(n);
export const statusSchema = z.enum(['offen', 'wartend', 'erledigt']);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const d = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === value;
}, 'Bitte ein gültiges Kalenderdatum angeben.');
export const fieldsSchema = z.object({
  title: short(120), explanation: short(600), status: statusSchema,
  nextAction: short(500), party: z.string().trim().max(160).default(''),
  waitingOn: short(250), dueDate: dateSchema.nullable(),
}).strict();
export const schemas = {
  preview_open_loop: z.object({ text: short(20000), sourceType: z.enum(['text','email','brief','notiz']).default('text') }).strict(),
  capture_open_loop: z.object({ proposalId: z.string().uuid(), fields: fieldsSchema, confirmed: z.literal(true) }).strict(),
  list_open_loops: z.object({ filter: z.enum(['alle','offen','wartend','ueberfaellig','erledigt']).default('alle') }).strict(),
  get_open_loop: z.object({ id: z.string().uuid() }).strict(),
  update_open_loop: z.object({ id: z.string().uuid(), changes: fieldsSchema.partial().refine(x => Object.keys(x).length > 0), confirmed: z.literal(true) }).strict(),
  draft_followup: z.object({ id: z.string().uuid(), kind: z.enum(['nachfassen','antwort']).default('nachfassen') }).strict(),
  delete_open_loop: z.object({ id: z.string().uuid(), confirmed: z.literal(true) }).strict(),
  export_open_loops: z.object({}).strict(),
  render_dranbleib: z.object({}).strict(),
};
export class DomainError extends Error {}
export function propose({text, sourceType}) {
  // Input is data, never instructions. Work only with a bounded verbatim excerpt.
  const sentences = text.match(/[^\n!?]+[!?]?/g) ?? [text];
  const relevant = sentences.find(s => /bitte|könnten|warte|zugesagt|frist|bis|angebot|schicken|senden/i.test(s)) ?? sentences[0];
  const quote = relevant.trim().slice(0, 800);
  const iso = quote.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const de = quote.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  const dateMentions = [...quote.matchAll(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{4})\b/g)];
  const multipleDates = new Set(dateMentions.map(m=>m[0])).size > 1;
  const candidate = multipleDates ? null : iso?.[1] ?? (de ? `${de[3]}-${de[2].padStart(2,'0')}-${de[1].padStart(2,'0')}` : null);
  const legal = sourceType === 'brief' || /bescheid|widerspruch|behörde|zustellung|rechtsbehelf/i.test(quote);
  const relative = quote.match(/\b(freitag|montag|dienstag|mittwoch|donnerstag|samstag|sonntag|morgen|heute|nächste woche|\d+\s+(?:tage|wochen|monate))\b/i)?.[0];
  const parsed = candidate ? dateSchema.safeParse(candidate) : null;
  const dueDate = parsed?.success ? candidate : null;
  const uncertainties = ['Wer wartet auf wen? Bitte anhand des Originals bestätigen.'];
  if (!dueDate) uncertainties.push(multipleDates ? 'Mehrere Datumsangaben im Auszug. Bitte die relevante Frist auswählen.' : candidate ? 'Datum ist ungültig. Bitte das Original prüfen.' : relative ? `„${relative}“ ist nicht eindeutig. Bitte ein konkretes Datum wählen.` : 'Keine eindeutige Frist erkannt. Datum optional ergänzen.');
  if (legal) uncertainties.push('Mögliche rechtliche Frist: nur vorläufiger Textfund. Original prüfen; keine Rechtsberatung oder verbindliche Fristberechnung.');
  return {
    fields: {title: quote.slice(0, 90), explanation: 'Dieser Text könnte eine offene Zusage oder eine noch ausstehende Antwort enthalten.', status:'offen', nextAction:'Klären, wer den nächsten Schritt übernimmt.', party:'', waitingOn:'Unklar – bitte prüfen', dueDate},
    quote, sourceType, reasoning:'Lokale Regeln markieren einen möglichen Vorgang. Der Beleg ist ein Auszug; Bedeutung, Rolle und Vollständigkeit wurden nicht semantisch geprüft.',
    facts:[`Quellenauszug: „${quote}“`, ...(dueDate ? [`Explizites Kalenderdatum im Auszug: ${dueDate} (vorläufig).`] : [])],
    assumptions:['Status „offen“ und nächster Schritt sind Vorschläge, keine belegten Fakten.'], uncertainties, legal,
  };
}
export class Store {
  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA secure_delete=ON; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS loops (id TEXT PRIMARY KEY, owner TEXT NOT NULL, payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS loops_owner ON loops(owner);');
    this.proposals = new Map();
  }
  close() { this.proposals.clear(); this.db.close(); }
  prune(now=Date.now()) { for (const [id,p] of this.proposals) if (p.expires<now) this.proposals.delete(id); }
  forget(owner) {
    this.db.prepare('DELETE FROM loops WHERE owner=?').run(owner);
    for (const [id,p] of this.proposals) if (p.owner === owner) this.proposals.delete(id);
  }
  list(owner, filter = 'alle', today = new Date().toISOString().slice(0,10)) {
    return this.db.prepare('SELECT payload FROM loops WHERE owner=? ORDER BY rowid DESC').all(owner).map(r=>JSON.parse(r.payload)).filter(x=>filter==='alle' || (filter==='ueberfaellig' ? x.status!=='erledigt' && x.dueDate && x.dueDate<today : x.status===filter));
  }
  get(owner,id) {
    const row=this.db.prepare('SELECT payload FROM loops WHERE owner=? AND id=?').get(owner,id);
    if (!row) throw new DomainError('Vorgang nicht gefunden.');
    return JSON.parse(row.payload);
  }
  execute(owner,name,input) {
    if (typeof owner!=='string' || !owner) throw new DomainError('Sitzung fehlt.');
    if (!Object.hasOwn(schemas,name)) throw new DomainError('Unbekanntes Tool.');
    const args=schemas[name].parse(input);
    const now=Date.now();
    this.prune(now);
    if(name==='preview_open_loop') {
      if(this.proposals.size>=500) throw new DomainError('Zu viele Vorschläge. Bitte später erneut versuchen.');
      const proposal={...propose(args), proposalId:randomUUID()};
      this.proposals.set(proposal.proposalId,{owner,proposal,expires:now+15*60*1000});
      return {proposal};
    }
    if(name==='capture_open_loop') {
      const pending=this.proposals.get(args.proposalId);
      if(!pending || pending.owner!==owner) throw new DomainError('Vorschlag fehlt oder ist abgelaufen. Bitte erneut erfassen.');
      const {proposalId,fields:proposedFields,...evidence}=pending.proposal;
      const loop={...evidence,...args.fields,id:randomUUID(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      // Preserve extraction caveats; user's edited date is an explicit confirmation, not a legal calculation.
      loop.confirmation='Felder vom Nutzer geprüft; Quellenanalyse bleibt vorläufig.';
      this.db.prepare('INSERT INTO loops VALUES (?,?,?)').run(loop.id,owner,JSON.stringify(loop));
      this.proposals.delete(args.proposalId);
      return {loop};
    }
    if(name==='list_open_loops' || name==='render_dranbleib' || name==='export_open_loops') return {loops:this.list(owner,args.filter)};
    const loop=this.get(owner,args.id);
    if(name==='get_open_loop') return {loop};
    if(name==='delete_open_loop') {
      this.db.prepare('DELETE FROM loops WHERE owner=? AND id=?').run(owner,args.id);
      return {deletedId:args.id};
    }
    if(name==='update_open_loop') {
      const updated={...loop,...args.changes,updatedAt:new Date().toISOString()};
      this.db.prepare('UPDATE loops SET payload=? WHERE owner=? AND id=?').run(JSON.stringify(updated),owner,args.id);
      return {loop:updated};
    }
    if(name==='draft_followup') return {draft:`Guten Tag${loop.party ? ' '+loop.party : ''},\n\n${args.kind==='antwort' ? 'vielen Dank für Ihre Nachricht.' : 'ich möchte mich zu folgendem Vorgang erkundigen:'}\n${loop.title}\n\n${args.kind==='antwort' ? 'Mein nächster geplanter Schritt: '+loop.nextAction : 'Könnten Sie mir bitte den aktuellen Stand und den nächsten Schritt mitteilen?'}\n\nVielen Dank und freundliche Grüße`, note:'Editierbarer Entwurf. Nicht versendet. Namen, Zusagen und Termine vor Verwendung prüfen.'};
  }
}

const evidenceSchema = z.object({quote:z.string().max(800), sourceType:z.enum(['text','email','brief','notiz']), reasoning:z.string(), facts:z.array(z.string()), assumptions:z.array(z.string()), uncertainties:z.array(z.string()), legal:z.boolean()});
export const loopSchema = fieldsSchema.extend({...evidenceSchema.shape,id:z.string().uuid(),createdAt:z.string(),updatedAt:z.string(),confirmation:z.string()});
export const outputSchemas = {
 preview_open_loop:z.object({proposal:evidenceSchema.extend({proposalId:z.string().uuid(),fields:fieldsSchema})}),
 capture_open_loop:z.object({loop:loopSchema}),get_open_loop:z.object({loop:loopSchema}),update_open_loop:z.object({loop:loopSchema}),
 list_open_loops:z.object({loops:z.array(loopSchema)}),render_dranbleib:z.object({loops:z.array(loopSchema)}),export_open_loops:z.object({loops:z.array(loopSchema)}),
 draft_followup:z.object({draft:z.string(),note:z.string()}),delete_open_loop:z.object({deletedId:z.string().uuid()}),
};
