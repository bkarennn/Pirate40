// Idempotent migration: keep replies, read state, typing deadlines and event progress.
function renameCharacterText(value) {
 return value.replace(/\b(maya|ravi)\b/gi, name => {
   const updated=name.toLowerCase()==='maya'?'Esther':'Kevin';
   return name===name.toUpperCase()?updated.toUpperCase():name===name.toLowerCase()?updated.toLowerCase():updated;
 });
}
function migrateCharacterData(value) {
 if(typeof value==='string')return renameCharacterText(value);
 if(Array.isArray(value))return value.map(migrateCharacterData);
 if(value && typeof value==='object') {
   // Current identifiers take precedence if a partially migrated save contains both.
   const entries=Object.entries(value).sort(([a],[b])=>Number(!/^(maya|ravi)$/i.test(a))-Number(!/^(maya|ravi)$/i.test(b)));
   return Object.fromEntries(entries.map(([key,item])=>[/^(maya|ravi)$/i.test(key)?renameCharacterText(key):key,migrateCharacterData(item)]));
 }
 return value;
}
