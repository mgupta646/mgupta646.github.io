/* Pure functions shared by the guide and its regression checks. */
(() => {
  const plain = value => String(value || '').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|quot);/g,' ').replace(/\s+/g,' ').trim();
  const short = value => {
    let text = String(value || '').replace(/<think>[\s\S]*?<\/think>/gi,'').replace(/<think>[\s\S]*$/gi,'').trim();
    const words = text.split(/\s+/).filter(Boolean);
    text = words.slice(0,45).join(' ');
    if (text.length > 280) text = text.slice(0,277).replace(/\s+\S*$/,'') + '…';
    else if(words.length>45) text+='…';
    return text;
  };
  const stop = new Set('what which who how why does about tell me your you the a an is are do can portfolio project projects work to for with and of in on at from it its his her this that'.split(' '));
  const words = q => (q.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>w.length>1&&!stop.has(w));
  const aliases={
    trophy:'award awards achievement achievements accomplishments accomplishment accolades trophy trophies honor honors honour honours medal medals recognition recognitions credential credentials certification certifications certs certificate certificates badge badges claude claude101 anthropic leadership openai licenses licence',
    home:'background biography bio story hometown interests about experience experiences career journey employment',vlab:'vlab v lab risk volatility research evaluation rubric',rosi:'rosi sustainability sustainable tariffs energy fellowship',magic:'magic filter tableau extension filtering',
    aviation:'aviation airline airlines flights d3',citibike:'citibike citi bike bikes trips mobility',bi:'dashboards dashboard powerbi hospitality revenue attrition',apps:'browser browsers qr chrome software extension extensions',dev:'automation scripts scripting programming',
    flowmind:'flowmind ferrocampus rail railway train trains congestion',library:'skill skills stack toolkit technology technologies python sql javascript tools',
    nyu:'nyu tandon masters master ms graduate postgraduate scholarship education studies studying qualification qualifications',cu:'chandigarh bachelor bachelors undergraduate aerospace degree be',
    retail:'retail macy macys operations process',teaching:'teaching teacher ta tutor futures options derivatives fellow',conference:'conference conferences sofie events event coordination',
    rocket:'rocket rockets rocketry hydro fabrication guinness record',windtunnel:'windtunnel wind tunnel paper publication publications published ijert',astro:'astronomy telescope space club council',
    gym:'gym fitness hobbies workout workouts exercise health skating',contact:'contact email reach hire hiring availability relocation linkedin resume cv opt',mango:'mango whisper ollama companion voice desktop robot',
  };
  const subjectWords=s=>words(s.id+' '+s.title+' '+(aliases[s.id]||''));
  function factLines(s) {
    return (s.blocks||[]).flatMap(b=>{
      if(['img','gallery','code','links','h'].includes(b.type))return [];
      if(b.text)return [plain((b.title?b.title+': ':'')+b.text)];
      if(b.type==='flow')return (b.steps||[]).map(v=>plain(v.t+': '+v.d));
      return (b.items||[]).map(v=>plain(typeof v==='string'?v:Array.isArray(v)?v.join(': '):[v.t||v.title||v.v,v.d||v.sub||v.l,v.text].filter(Boolean).join(' · ')));
    }).filter(Boolean);
  }
  function detailText(s) {return factLines(s).join(' ');}
  function excerpt(query,lines) {
    const terms=words(query);
    return lines.map((text,i)=>({text,i,score:terms.reduce((n,w)=>n+(words(text).includes(w)?1:0),0)})).sort((a,b)=>b.score-a.score||a.i-b.i)[0];
  }
  function search(query, sections) {
    const terms=words(query);
    return sections.map(s=>({section:s,score:terms.reduce((score,w)=>score+(words(aliases[s.id]||'').includes(w)?12:0)+(words(s.title+' '+s.id).includes(w)?8:0)+(words(s.subtitle+' '+s.blurb).includes(w)?2:0)+(words(detailText(s)).includes(w)?0.5:0),0)})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(r=>r.section);
  }
  function fallback(query, sections) {
    if(restricted(query))return {text:refusal,id:null};
    if(/\b(salary|birthday|birthdate|passport|ssn|married|girlfriend|boyfriend|phone number|home address)\b/i.test(query))return {text:'That personal detail is not published in this portfolio. I can help with Mehul’s public work, education, achievements and professional contact links.',id:null,direct:true};
    if(/\b(hi|hello|hey)\b/i.test(query) && words(query).length<3) return {text:"Hi! I’m Mehul’s portfolio guide. Ask about Mango, AI research, analytics, aerospace or how to get in touch.",id:'home'};
    if(/\b(contact|email|hire|reach)\b/i.test(query)) return {text:'You can reach Mehul at mg8671@nyu.edu. Open the contact chapter for his professional links and availability.',id:'contact'};
    if(/\b(skills|stack|technologies)\b/i.test(query)) return {text:'Mehul works with Python, SQL and JavaScript across AI evaluation, APIs, data analytics and product delivery. Explore the Skill Library for details.',id:'library'};
    if(/\b(education|qualifications)\b/i.test(query) && !/\b(bachelor|masters|nyu|chandigarh)\b/i.test(query))return {text:'Mehul earned a BE in Aerospace Engineering at Chandigarh University in May 2024 and is completing an MS in Management of Technology at NYU Tandon, expected December 2026.',id:'nyu'};
    if(/\b(experience|career|employment)\b/i.test(query) && !/\b(vlab|rosi|teaching|aerospace)\b/i.test(query))return {text:'Mehul’s experience includes AI research at NYU Stern’s Volatility and Risk Institute, AI product work on ROSI, and teaching Futures and Options. His portfolio also covers analytics, software builds and aerospace projects.',id:'home'};
    const matches=search(query,sections);
    if(matches.length) {
      const s=matches[0],lines=factLines(s);
      if(s.id==='trophy' && !/\b(claude|openai|leadership|nasa|guinness|ferrocampus)\b/i.test(query)) {
        const year=query.match(/\b(?:19|20)\d{2}\b/)?.[0] || (/\bthis year\b/i.test(query)?String(new Date().getFullYear()):null);
        if(year){const dated=lines.filter(line=>new RegExp('\\b'+year+'\\b').test(line));return {text:dated.length?short('Published entries dated '+year+': '+dated.slice(0,2).join(' ')):'No entries dated '+year+' are listed in this portfolio. That does not establish whether Mehul earned anything else that year.',id:s.id,direct:true};}
      }
      if(s.id==='trophy' && /\b(certification|certifications|credential|credentials|badge|badges|certificate|certificates)\b/i.test(query) && !/\b(claude|leadership|openai|google|nyu)\b/i.test(query)) {
        return {text:'Mehul completed Anthropic’s Claude 101 in November 2026 and OpenAI Academy’s AI Leadership badge in October 2026. His Trophy Case also lists NYU, Google and Autodesk credentials, with verification links.',id:s.id,direct:true};
      }
      const detail=excerpt(query,lines);
      if(detail?.score && /\b(how|why|role|responsibilities|tools|built|build|use|used|method|claude|openai|leadership|nasa|guinness|medal|skating|scholarship|credential|credentials|badge|badges|certificate|certificates)\b/i.test(query))return {text:short(detail.text),id:s.id,direct:s.id==='trophy'};
      return {text:short(plain(s.blurb)),id:s.id,direct:s.id==='trophy'};
    }
    return {text:'I can help with Mehul’s published projects and background. Try “Mango”, “V-Lab”, “Citi Bike” or “skills”, or enable browser AI for more flexible questions.',id:null};
  }
  function context(query,sections,topicIds=[]) {
    const matches=search(query,sections);
    const direct=sections.find(s=>s.id===fallback(query,sections).id);
    const chosen=[...new Set((topicIds.length?topicIds.map(id=>sections.find(s=>s.id===id)):[direct,...matches]).filter(Boolean))].slice(0,3);
    if(!chosen.length) chosen.push(...sections.filter(s=>['home','vlab','mango'].includes(s.id)));
    return chosen.map(s=>{
      const details=(s.blocks||[]).filter(b=>!['img','gallery','code'].includes(b.type)).map(b=>plain(b.text||JSON.stringify(b))).join(' ');
      return `${s.title}: ${plain(s.blurb)} ${details.slice(0,2200)}`;
    }).join('\n');
  }
  const refusal="I only answer questions about Mehul’s published work and background. Ask about a project, his skills or experience, or say “guide me to Mango”.";
  function restricted(query) {
    return /\b(ignore|override|disregard|forget)\b.{0,45}\b(instructions|rules|prompt|previous)\b|\b(system prompt|jailbreak|pretend you|act as)\b/i.test(query)
      || /^(please\s+)?(write|generate|create|compose|solve|calculate|translate)\b|\b(can|could|would|will) you (write|generate|create|compose|solve|calculate|translate)\b/i.test(query)
      || /\b(recipe|lottery|stock price|capital of|president|sports score)\b/i.test(query)
      || (/\bweather\b/i.test(query) && !/\bmango\b/i.test(query));
  }
  function inScope(query,sections) {
    // A local gate runs before any model call, including when conversation history exists.
    if(restricted(query)) return false;
    if(/\b(hi|hello|hey|mehul|your|you|his|he|skills|background|experience|education|contact|email|hire|availability|resume|career|achievements)\b/i.test(query)) return true;
    const generic=new Set('ai data software studio research assistant voice agent project projects local platform library the'.split(' '));
    const terms=words(query).filter(w=>!generic.has(w));
    return sections.some(s=>terms.some(w=>subjectWords(s).includes(w)));
  }
  function navigation(query,sections) {
    const explicit=/\b(take me|guide me|walk me|bring me|go to|visit|show me|start.{0,12}tour)\b/i.test(query);
    const specific=references(query,sections).filter(s=>!['home','library','contact'].includes(s.id));
    const overview=!specific.length && /\b(ai|artificial intelligence|analytics|data|aerospace)\b/i.test(query) && /\b(work|projects|portfolio)\b/i.test(query);
    if(!explicit && !overview) return null;
    if(/\b(don't|do not|not|never)\b/i.test(query)) return null;
    let ids=[];
    const group=/\b(ai|artificial intelligence)\b/i.test(query)?['ai','mango']:/\b(data|analytics)\b/i.test(query)?['data']:/\b(aerospace|aviation)\b/i.test(query)?['aero']:/\b(education|teaching)\b/i.test(query)?['edu']:null;
    if(specific.length) ids=[specific[0].id];
    else if(group) ids=sections.filter(s=>group.includes(s.cat)||group.includes(s.id)).map(s=>s.id);
    else if(/\b(skills|technologies|stack)\b/i.test(query)) ids=['library'];
    else if(/\b(contact|mailbox)\b/i.test(query)) ids=['contact'];
    else if(/\b(around|tour|highlights)\b/i.test(query)||/^guide me[.!?]*$/i.test(query.trim())) ids=['home','vlab','mango','contact'];
    else ids=search(query.replace(/take me|guide me|walk me|bring me|go to|visit|show me/gi,''),sections).slice(0,1).map(s=>s.id);
    return [...new Set(ids)].filter(id=>sections.some(s=>s.id===id));
  }
  function routeSummary(query,ids,sections) {
    if(/\b(ai|artificial intelligence)\b/i.test(query) && ids.length>1) return 'Mehul’s AI work spans V-Lab research, the ROSI platform, MaGic Filter and Mango’s local voice interface. Let’s explore the projects—use NEXT STOP to continue, or move to pause.';
    if(ids.length===1) return short(plain(sections.find(s=>s.id===ids[0]).blurb)+' Let’s explore this project.');
    return 'Mehul’s work connects AI products, data analytics and aerospace. I’ll guide you through the selected projects. Use NEXT STOP to continue, or move to pause and explore freely.';
  }
  function references(query,sections) {
    const broad=new Set('ai data analytics aerospace education research project projects portfolio work assistant platform software local voice agent mehul'.split(' '));
    const terms=words(query).filter(w=>!broad.has(w));
    return search(query,sections).filter(s=>terms.some(w=>subjectWords(s).includes(w)));
  }
  function dateAnswer(query,sections,topicIds) {
    if(!/\b(when|what year|which year|what date|which date|timeline)\b/i.test(query)) return null;
    const chapters=sections.filter(s=>topicIds.includes(s.id));
    const dated=chapters.flatMap(s=>[s.subtitle,s.blurb,...factLines(s)])
      .map(plain).flatMap(text=>text.split(/(?<=[.!?])\s+/)).filter(text=>/\b(?:19|20)\d{2}\b/.test(text));
    return dated.length?short('The published chapter lists: '+excerpt(query,dated).text):'That date isn’t listed in the published portfolio. I can explain the project’s approach and tools, but I won’t guess when it was built.';
  }
  function groundedAnswer(answer,facts) {
    const numbers=String(answer).match(/\b\d+(?:[.,]\d+)*%?/g)||[];
    const known=new Set(String(facts).match(/\b\d+(?:[.,]\d+)*%?/g)||[]);
    return numbers.some(n=>!known.has(n))?'I couldn’t verify that detail in the published project notes. Please check the linked chapter; I won’t guess missing dates or figures.':short(answer);
  }
  const api={plain,short,search,fallback,context,inScope,navigation,restricted,refusal,routeSummary,references,dateAnswer,groundedAnswer};
  if(typeof module!=='undefined') module.exports=api;
  else window.PortfolioGuide=api;
})();
