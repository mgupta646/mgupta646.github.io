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
  const stop = new Set('what which who how why does about tell me your you the a an is are do can portfolio project projects work'.split(' '));
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
  function context(query,sections) {
    const matches=search(query,sections);
    const chosen=matches.length?matches:sections.filter(s=>['home','vlab','mango'].includes(s.id));
    return chosen.map(s=>{
      const details=(s.blocks||[]).filter(b=>['p','facts','stats'].includes(b.type)).map(b=>plain(b.text||JSON.stringify(b.items||[]))).join(' ');
      return `${s.title}: ${plain(s.blurb)} ${details.slice(0,750)}`;
    }).join('\n');
  }
  const api={plain,short,search,fallback,context};
  if(typeof module!=='undefined') module.exports=api;
  else window.PortfolioGuide=api;
})();
