export function validateDataset(d,{kinds=['bar','signed-bar','line'],allowMissing=true}={}){
  if(!d||!Array.isArray(d.rows)||!d.rows.length)throw Error('Dataset rows required');
  for(const key of ['title','unit','source','asOf'])if(typeof d[key]!=='string'||!d[key].trim())throw Error(`Dataset ${key} required`);
  if(typeof d.illustrative!=='boolean')throw Error('Declare illustrative true/false');
  const kind=d.kind??'bar';
  if(!kinds.includes(kind))throw Error(`Dataset kind ${kind} unsupported by this renderer`);
  if(!Array.isArray(d.domain)||d.domain.length!==2||!d.domain.every(Number.isFinite)||d.domain[1]<=d.domain[0])throw Error('Dataset domain must have two increasing finite endpoints');
  if(kind==='bar'&&(d.domain[0]!==0||d.domain[1]<=0))throw Error('Bar domain must start at zero and have positive maximum');
  if(kind==='signed-bar'&&(d.domain[0]>0||d.domain[1]<0))throw Error('Signed bar domain must include zero');
  if(d.missing!==undefined&&d.missing!=='gap')throw Error('Only explicit missing:gap is supported; never silently coerce missing values to zero');
  const labels=new Set();
  for(const r of d.rows){
    if(typeof r.label!=='string'||!r.label.trim()||labels.has(r.label))throw Error('Dataset labels must be unique');
    labels.add(r.label);
    if(r.value===null){
      if(!allowMissing||d.missing!=='gap'||typeof r.note!=='string'||!r.note.trim())throw Error('Missing value requires supported gap rendering and an explanatory note');
    }else if(!Number.isFinite(r.value)||r.value<d.domain[0]||r.value>d.domain[1])throw Error('Data value outside domain or nonnumeric');
  }
  return d;
}
export function linearScale(value,domain,range){
  if(!Number.isFinite(value)||!Array.isArray(domain)||!Array.isArray(range)||domain.length!==2||range.length!==2||![...domain,...range].every(Number.isFinite)||domain[0]>=domain[1])throw Error('Finite linear scale inputs required');
  return range[0]+(value-domain[0])/(domain[1]-domain[0])*(range[1]-range[0]);
}
export function validateGraph(g){
  if(!g||!Array.isArray(g.nodes)||!g.nodes.length||!Array.isArray(g.edges))throw Error('Graph nodes/edges required');
  const ids=new Set(),edges=new Set();
  for(const n of g.nodes){
    if(typeof n.id!=='string'||!n.id||ids.has(n.id)||typeof n.label!=='string'||!n.label.trim())throw Error('Graph needs unique IDs and labels');
    ids.add(n.id);
  }
  for(const e of g.edges){
    const key=`${e.from}->${e.to}`;
    if(!ids.has(e.from)||!ids.has(e.to))throw Error('Graph endpoint missing');
    if(edges.has(key))throw Error('Duplicate graph edge');edges.add(key);
  }
  return g;
}
export function validateInsets(v){
  if(!v)return;
  for(const k of ['top','right','bottom','left'])if(!Number.isFinite(v[k])||v[k]<0||v[k]>=.4)throw Error('safeInsets must be fractions in [0, .4)');
}
export function formatNumber(v,decimals=0){
  return v.toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
}
