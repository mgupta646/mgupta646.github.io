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
  function search(query, sections) {
    const terms=words(query);
    return sections.map(s=>({section:s,score:terms.reduce((score,w)=>score+(words(s.title+' '+s.id).includes(w)?8:0)+(words(s.subtitle+' '+s.blurb).includes(w)?2:0),0)})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(r=>r.section);
  }
  function fallback(query, sections) {
    if(/\b(hi|hello|hey)\b/i.test(query) && words(query).length<3) return {text:"Hi! I’m Mehul’s portfolio guide. Ask about Mango, AI research, analytics, aerospace or how to get in touch.",id:'home'};
    if(/\b(contact|email|hire|reach)\b/i.test(query)) return {text:'You can reach Mehul at mg8671@nyu.edu. Open the contact chapter for his professional links and availability.',id:'contact'};
    if(/\b(skills|stack|technologies)\b/i.test(query)) return {text:'Mehul works with Python, SQL and JavaScript across AI evaluation, APIs, data analytics and product delivery. Explore the Skill Library for details.',id:'library'};
    const matches=search(query,sections);
    if(matches.length) return {text:short(plain(matches[0].blurb)),id:matches[0].id};
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
    return sections.some(s=>terms.some(w=>words(s.id+' '+s.title).includes(w)));
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
    const normalized=query.toLowerCase().replace(/[^a-z0-9]/g,'');
    return sections.filter(s=>[s.id,s.title].some(name=>name.length>2 && normalized.includes(name.toLowerCase().replace(/[^a-z0-9]/g,''))));
  }
  function dateAnswer(query,sections,topicIds) {
    if(!/\b(when|what year|which year|what date|which date|timeline)\b/i.test(query)) return null;
    const chapters=sections.filter(s=>topicIds.includes(s.id));
    const dated=chapters.flatMap(s=>[s.blurb,...(s.blocks||[]).filter(b=>['p','facts','stats'].includes(b.type)).map(b=>b.text||JSON.stringify(b.items||[]))])
      .map(plain).flatMap(text=>text.split(/(?<=[.!?])\s+/)).filter(text=>/\b(?:19|20)\d{2}\b/.test(text));
    return dated.length?short('The published chapter lists: '+dated[0]):'That date isn’t listed in the published portfolio. I can explain the project’s approach and tools, but I won’t guess when it was built.';
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
