// VNTECH Material Matching Engine V2.
const DIM=96;
export const MATERIAL_MATCH_THRESHOLDS=Object.freeze({exact:1,veryHigh:.95,high:.90,review:.80});
export const MATERIAL_MATCH_WEIGHTS=Object.freeze({history:.10,technical:.30,system:.10,uom:.15,fuzzy:.20,embedding:.15});
export function normalizeMaterialText(value){return String(value??'').replace(/²/g,'2').replace(/³/g,'3').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/ø/g,' d ').replace(/\bphi\s*(\d+(?:[.,]\d+)?)/g,' d$1 ').replace(/\bdn\s*(\d+(?:[.,]\d+)?)/g,' dn$1 ').replace(/\bmm\s*2\b/g,'mm2').replace(/\s+/g,' ').replace(/[^a-z0-9+./-]+/g,' ').replace(/\s+/g,' ').trim();}
function hashToken(token){let h=2166136261;for(let i=0;i<token.length;i++){h^=token.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
export function localFeatureEmbedding(value,dim=DIM){const text=normalizeMaterialText(value);const out=Array(dim).fill(0);const tokens=text.split(/\s+/).filter(Boolean);for(const token of tokens){const variants=[token,...(token.length>3?Array.from({length:token.length-2},(_,i)=>token.slice(i,i+3)):[])];for(const v of variants){const h=hashToken(v),idx=h%dim,sign=(h&1)?1:-1;out[idx]+=sign*(v===token?1.4:.35);}}const norm=Math.sqrt(out.reduce((s,x)=>s+x*x,0))||1;return out.map(x=>x/norm);}
export function cosineSimilarity(a,b){if(!Array.isArray(a)||!Array.isArray(b)||!a.length||a.length!==b.length)return 0;let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){const x=Number(a[i]||0),y=Number(b[i]||0);dot+=x*y;aa+=x*x;bb+=y*y;}return aa&&bb?Math.max(-1,Math.min(1,dot/(Math.sqrt(aa)*Math.sqrt(bb)))):0;}
export function tokenSimilarity(a,b){const A=new Set(normalizeMaterialText(a).split(/\s+/).filter(Boolean)),B=new Set(normalizeMaterialText(b).split(/\s+/).filter(Boolean));if(!A.size||!B.size)return 0;let hit=0;for(const x of A)if(B.has(x))hit++;return (2*hit)/(A.size+B.size);}
export function parseTechnical(value){const s=normalizeMaterialText(value);const pick=(re)=>{const m=s.match(re);return m?m[1].replace(',','.') : ''};const all=(re)=>[...s.matchAll(re)].map(m=>m[1].replace(',','.'));
  const dn=pick(/\bdn\s*(\d+(?:[.,]\d+)?)/);const diameter=dn||pick(/\bd\s*(\d+(?:[.,]\d+)?)/);
  const pn=pick(/\bpn\s*(\d+(?:[.,]\d+)?)/);const ka=pick(/\b(\d+(?:[.,]\d+)?)\s*ka\b/);const voltage=pick(/\b(\d+(?:[.,]\d+)?)\s*(?:v|kv)\b/);const current=pick(/\b(\d+(?:[.,]\d+)?)\s*a\b/);const sch=pick(/\bsch\s*(\d+(?:[.,]\d+)?)/);const thickness=pick(/\b(?:d(?:ay)?|thickness)\s*(\d+(?:[.,]\d+)?)\s*mm\b/);
  const sections=[...new Set(all(/\b(\d+(?:[.,]\d+)?\s*x\s*\d+(?:[.,]\d+)?(?:\s*\+\s*e?\s*\d+(?:[.,]\d+)?)?)\s*(?:mm2)?\b/g).map(v=>v.replace(/\s+/g,'')))];
  const areas=[...new Set(all(/\b(\d+(?:[.,]\d+)?)\s*mm2\b/g).map(v=>String(Number(v))))];
  const poles=pick(/\b([1-4])\s*p\b/);const material=['upvc','pvc','ppr','hdpe','gi','inox','steel','thep','cu','copper','xlpe'].find(x=>s.includes(x))||'';
  return {dn,diameter,pn,ka,voltage,current,sch,thickness,sections,areas,poles,material};}
const CRITICAL=['dn','diameter','pn','ka','voltage','current','sch','poles'];
export function technicalComparison(source,candidate){const a=parseTechnical(source),b=parseTechnical(candidate);const conflicts=[];let compared=0,matched=0;for(const k of CRITICAL){if(a[k]&&b[k]){compared++;if(String(a[k])===String(b[k]))matched++;else conflicts.push(`${k}:${a[k]}!=${b[k]}`);}}
  if(a.sections.length&&b.sections.length){compared++;const x=a.sections.join('|'),y=b.sections.join('|');if(x===y)matched++;else conflicts.push(`section:${x}!=${y}`);}if(a.areas.length&&b.areas.length){compared++;const x=a.areas.join('|'),y=b.areas.join('|');if(x===y)matched++;else conflicts.push(`area:${x}!=${y}`);}if(a.material&&b.material){compared++;if(a.material===b.material)matched++;}
  return {score:compared?matched/compared:.5,conflicts,hardConflict:conflicts.length>0,source:a,candidate:b};}

const CANDIDATE_STOPWORDS=new Set(['vat','tu','thiet','bi','phu','kien','loai','bo','cai','chiec','hang','hoa','theo','cho','va','voi','tai','trong','ngoai','he','thong','cong','trinh','ky','thuat','shopdrawing']);
const FAMILY_PATTERNS=Object.freeze({
  ppr:/\bppr\b/,upvc:/\bupvc\b/,pvc:/\bpvc\b/,hdpe:/\bhdpe\b/,
  cxv:/\bcxv(?:[-/]?dsta)?\b/,dsta:/\bdsta\b/,xlpe:/\bxlpe\b/,
  cat6:/\bcat\s*6\b|\bcat6\b/,rj45:/\brj\s*45\b|\brj45\b/,
  sprinkler:/\bsprinkler\b/,pccc:/\bpccc\b/,inox:/\binox\b/,
});
const OBJECT_TOKENS=new Set(['ong','cap','day','van','bom','quat','mang','thang','tu','hop','aptomat','mccb','mcb','rcbo','rcd','o','cam','co','te','bau','bich','dau','noi','loc','dong','ho','den','camera','loa','sprinkler','bang','thep','nhua','luoi','ruot']);
const OBJECT_CLASSES=Object.freeze({
  pipe:new Set(['ong']), cable:new Set(['cap','day']), valve:new Set(['van']), pump:new Set(['bom']), fan:new Set(['quat']), tray:new Set(['mang','thang']),
  cabinet:new Set(['tu']), box:new Set(['hop']), breaker:new Set(['aptomat','mccb','mcb','rcbo','rcd']), socket:new Set(['o','cam']), fitting:new Set(['co','te','bau','bich','dau','noi']),
  filter:new Set(['loc']), meter:new Set(['dong','ho']), light:new Set(['den']), camera:new Set(['camera']), speaker:new Set(['loa']), sprinkler:new Set(['sprinkler']), bar:new Set(['bang']), mesh:new Set(['luoi'])
});
function tokenSet(value){return new Set(normalizeMaterialText(value).split(/\s+/).filter(Boolean));}
function intersects(a,b){for(const item of a)if(b.has(item))return true;return false;}
function objectClassSet(value){const tokens=tokenSet(value),out=new Set();for(const [key,members] of Object.entries(OBJECT_CLASSES))if(intersects(tokens,members))out.add(key);return out;}
function canonicalSystem(value){const raw=normalizeMaterialText(value).replace(/[^a-z0-9]/g,'');if(['dien','electrical'].includes(raw))return'DIEN';if(['ctn','nuoc','capthoatnuoc','plumbing'].includes(raw))return'CTN';if(['hvac','dieuhoathonggio'].includes(raw))return'HVAC';if(['elv','dnhe','diennhe'].includes(raw))return'DNHE';if(['pccc','fire'].includes(raw))return'PCCC';if(['khac','other'].includes(raw))return'KHAC';return raw.toUpperCase();}
function familySet(value){const text=normalizeMaterialText(value);return new Set(Object.entries(FAMILY_PATTERNS).filter(([,re])=>re.test(text)).map(([key])=>key));}
function significantTokens(value){return new Set([...tokenSet(value)].filter((token)=>token.length>1&&!CANDIDATE_STOPWORDS.has(token)&&!/^[0-9.]+$/.test(token)));}
/**
 * Candidate gate: do not force an unrelated Material Master item into the review table.
 * The gate is intentionally conservative: exact names always pass; hard technical conflicts fail;
 * otherwise the pair needs a shared material family/object token, a compatible engineering
 * parameter (DN/diameter/section), or meaningful lexical similarity.
 */
export function materialCandidateGate(source,candidate,sourceText='',candidateText=''){
  const left=sourceText||[source?.contractMaterialName||source?.materialName,source?.description,source?.specification].filter(Boolean).join(' | ');
  const right=candidateText||[candidate?.name,candidate?.specification,candidate?.brand].filter(Boolean).join(' | ');
  const normalizedLeft=normalizeMaterialText(left),normalizedRight=normalizeMaterialText(right);
  if(!normalizedLeft||!normalizedRight)return {accepted:false,reason:'empty_text'};
  if(normalizedLeft===normalizedRight)return {accepted:true,reason:'exact'};
  const tech=technicalComparison(left,right);
  if(tech.hardConflict)return {accepted:false,reason:'hard_technical_conflict',technical:tech};
  const sourceSystem=canonicalSystem(source?.systemCode||source?.sourceSystemCode||''),candidateSystem=canonicalSystem(candidate?.system||candidate?.systemCode||'');
  if(sourceSystem&&candidateSystem&&sourceSystem!=='KHAC'&&candidateSystem!=='KHAC'&&sourceSystem!==candidateSystem)return {accepted:false,reason:'system_conflict',technical:tech};
  const sourceObjects=objectClassSet(left),candidateObjects=objectClassSet(right);
  if(sourceObjects.size&&candidateObjects.size&&!intersects(sourceObjects,candidateObjects))return {accepted:false,reason:'object_class_conflict',technical:tech};
  const lf=familySet(left),rf=familySet(right);
  if(lf.size&&rf.size&&!intersects(lf,rf))return {accepted:false,reason:'material_family_conflict',technical:tech};
  // If the BOQ explicitly names a strong family, candidates from another/unspecified family are noise
  // unless lexical similarity is already strong enough to prove they describe the same item.
  const fuzzy=tokenSimilarity(left,right);
  if(lf.has('dsta')&&!rf.has('dsta'))return {accepted:false,reason:'required_family_modifier_missing',technical:tech};
  if(lf.size&&!intersects(lf,rf))return {accepted:false,reason:'material_family_missing',technical:tech};
  const ls=significantTokens(left),rs=significantTokens(right);
  const shared=[...ls].filter((token)=>rs.has(token));
  const objectShared=shared.some((token)=>OBJECT_TOKENS.has(token));
  const a=tech.source,b=tech.candidate;
  const sameDn=Boolean((a.dn||a.diameter)&&(b.dn||b.diameter)&&String(a.dn||a.diameter)===String(b.dn||b.diameter));
  const sameSection=Boolean(a.sections.length&&b.sections.length&&a.sections.some((value)=>b.sections.includes(value)));
  const sameArea=Boolean(a.areas.length&&b.areas.length&&a.areas.some((value)=>b.areas.includes(value)));
  const familyShared=intersects(lf,rf);
  const meaningfulShared=shared.filter((token)=>token.length>=3&&!['dong','thep','nhua'].includes(token)).length;
  if(sourceObjects.size&&!candidateObjects.size&&!familyShared&&!sameDn&&!sameSection&&!sameArea)return {accepted:false,reason:'object_class_missing',technical:tech};
  if(familyShared&&(objectShared||sameDn||sameSection||sameArea||fuzzy>=0.24))return {accepted:true,reason:'family_match',technical:tech};
  if((sameDn||sameSection||sameArea)&&objectShared)return {accepted:true,reason:'technical_object_match',technical:tech};
  if(objectShared&&meaningfulShared>=1&&fuzzy>=0.30)return {accepted:true,reason:'object_name_match',technical:tech};
  if(meaningfulShared>=2&&fuzzy>=0.40)return {accepted:true,reason:'lexical_match',technical:tech};
  if(fuzzy>=0.62)return {accepted:true,reason:'strong_lexical_match',technical:tech};
  return {accepted:false,reason:'insufficient_similarity',technical:tech};
}

function clamp01(x){return Math.max(0,Math.min(1,Number(x)||0));}
export function finalMatchScore({history=0,technical=.5,system=.5,uom=.5,fuzzy=0,embedding=0,hardConflict=false,exact=false}){if(exact&&!hardConflict)return 1;const w=MATERIAL_MATCH_WEIGHTS;const score=w.history*clamp01(history)+w.technical*clamp01(technical)+w.system*clamp01(system)+w.uom*clamp01(uom)+w.fuzzy*clamp01(fuzzy)+w.embedding*clamp01(embedding);return hardConflict?Math.min(score,.74):score;}
export function matchStatus(score,hardConflict=false,alreadyMapped=false){if(alreadyMapped)return 'already_mapped';if(hardConflict)return 'conflict';const p=score*100;if(p>=99.999)return 'exact';if(p>=95)return 'very_high';if(p>=90)return 'high';if(p>=80)return 'review';return 'not_found';}
export async function embedText(text,opts={}){const provider=String(opts.provider||process.env.VNTECH_EMBEDDING_PROVIDER||'local_feature_v1').toLowerCase();if(provider==='ollama'){try{const endpoint=opts.endpoint||process.env.VNTECH_EMBEDDING_ENDPOINT||'http://127.0.0.1:11434/api/embeddings';const model=opts.model||process.env.VNTECH_EMBEDDING_MODEL||'nomic-embed-text';const res=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model,prompt:String(text??'')})});if(!res.ok)throw new Error(`HTTP ${res.status}`);const data=await res.json();const vector=data.embedding||data.embeddings?.[0];if(!Array.isArray(vector)||!vector.length)throw new Error('embedding rỗng');return {provider:'ollama',model,vector,fallback:false};}catch(error){return {provider:'local_feature_v1',model:'builtin-96',vector:localFeatureEmbedding(text),fallback:true,error:String(error?.message||error)};}}
  if(provider==='openai_compatible'){try{const endpoint=opts.endpoint||process.env.VNTECH_EMBEDDING_ENDPOINT;if(!endpoint)throw new Error('thiếu VNTECH_EMBEDDING_ENDPOINT');const model=opts.model||process.env.VNTECH_EMBEDDING_MODEL||'text-embedding-3-small';const headers={'content-type':'application/json'};const key=opts.apiKey||process.env.VNTECH_EMBEDDING_API_KEY;if(key)headers.authorization=`Bearer ${key}`;const res=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({model,input:String(text??'')})});if(!res.ok)throw new Error(`HTTP ${res.status}`);const data=await res.json();const vector=data.data?.[0]?.embedding||data.embedding;if(!Array.isArray(vector)||!vector.length)throw new Error('embedding rỗng');return {provider:'openai_compatible',model,vector,fallback:false};}catch(error){return {provider:'local_feature_v1',model:'builtin-96',vector:localFeatureEmbedding(text),fallback:true,error:String(error?.message||error)};}}
  return {provider:'local_feature_v1',model:'builtin-96',vector:localFeatureEmbedding(text),fallback:false};}
export function scoreMaterialCandidate({source,material,sourceText,candidateText,historyCount=0,sourceEmbedding,candidateEmbedding,provider,providerFallback=false}){
  const tech=technicalComparison(sourceText,candidateText),fuzzy=tokenSimilarity(sourceText,candidateText),embedding=Math.max(0,cosineSimilarity(sourceEmbedding,candidateEmbedding));
  const systemScore=source.systemCode&&material.system?Number(normalizeMaterialText(source.systemCode)===normalizeMaterialText(material.system)):.5;
  const rawUomScore=source.unit&&material.unit?Number(normalizeMaterialText(source.unit)===normalizeMaterialText(material.unit)):.5;
  const historyScore=historyCount?Math.min(1,.75+.05*historyCount):0;
  const exactName=Boolean(normalizeMaterialText(source.contractMaterialName||source.materialName||'')&&normalizeMaterialText(source.contractMaterialName||source.materialName||'')===normalizeMaterialText(material.name||''));
  const exactUom=!source.unit||!material.unit||normalizeMaterialText(source.unit)===normalizeMaterialText(material.unit);
  const exact=Boolean(exactName&&exactUom&&!tech.hardConflict);
  const technicalScore=exact?1:tech.score,uomScore=exactUom?1:rawUomScore,fuzzyScore=exactName?1:fuzzy,embeddingScore=exactName?1:embedding;
  const finalScore=finalMatchScore({history:historyScore,technical:technicalScore,system:systemScore,uom:uomScore,fuzzy:fuzzyScore,embedding:embeddingScore,hardConflict:tech.hardConflict,exact});
  return {materialId:material.id,materialCode:material.code,standardMaterialName:material.name,unit:material.unit,system:material.system,specification:material.specification||'',brand:material.brand||'',historyScore,technicalScore,systemScore,uomScore,fuzzyScore,embeddingScore,finalScore,exactMatch:exact,hardConflict:tech.hardConflict,conflictReason:tech.conflicts.join('; '),provider,providerFallback,status:matchStatus(finalScore,tech.hardConflict,false)};
}
export async function rankMaterialCandidates(source,materials,{aliases=[],history=[],topK=5,provider}={}){const sourceText=[source.contractMaterialName||source.materialName,source.description,source.specification].filter(Boolean).join(' | ');const srcEmbed=await embedText(sourceText,{provider});const aliasByMaterial=new Map();for(const a of aliases){const key=String(a.materialId);if(!aliasByMaterial.has(key))aliasByMaterial.set(key,[]);aliasByMaterial.get(key).push(a.aliasName);}const historyCount=new Map();for(const h of history){if(String(h.sourceNormalized||'')===normalizeMaterialText(sourceText))historyCount.set(String(h.materialId),Number(h.confirmCount||1));}
  const out=[];for(const material of materials){const aliasText=(aliasByMaterial.get(String(material.id))||[]).join(' | ');const candidateText=[material.name,material.specification,material.brand,aliasText].filter(Boolean).join(' | ');const gate=materialCandidateGate(source,material,sourceText,candidateText);if(!gate.accepted)continue;const candidateEmbed=await embedText(candidateText,{provider});out.push(scoreMaterialCandidate({source,material,sourceText,candidateText,historyCount:historyCount.get(String(material.id))||0,sourceEmbedding:srcEmbed.vector,candidateEmbedding:candidateEmbed.vector,provider:srcEmbed.provider,providerFallback:Boolean(srcEmbed.fallback||candidateEmbed.fallback)}));}return out.sort((a,b)=>b.finalScore-a.finalScore).slice(0,Math.max(1,Math.min(10,topK)));}
