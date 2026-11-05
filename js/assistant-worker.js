/* Downloaded only after the visitor explicitly enables AI. */
let engine;
self.onmessage = async ({data}) => {
  try {
    if(data.type==='load') {
      const {MLCEngine}=await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.87/+esm');
      const revision='d54cc9e4326482e89638e4f6445d04469c604b2b';
      const base=`https://huggingface.co/mehulg/mango-web-qwen3-1.7b/resolve/${revision}/`;
      engine=new MLCEngine({
        appConfig:{model_list:[{model:base,model_id:'Mango-Web-Qwen3-1.7B',model_lib:base+'model-lib.wasm',overrides:{context_window_size:4096}}],useIndexedDBCache:true},
        initProgressCallback:p=>self.postMessage({type:'progress',text:p.text,progress:p.progress}),
      });
      await engine.reload('Mango-Web-Qwen3-1.7B');
      self.postMessage({type:'ready'});
    } else if(data.type==='ask' && engine) {
      const chunks=await engine.chat.completions.create({messages:data.messages,max_tokens:80,temperature:0.25,stream:true,extra_body:{enable_thinking:false}});
      let text='',tokens=0;
      for await(const chunk of chunks) {
        text+=chunk.choices[0]?.delta?.content||'';
        if(++tokens%8===1) self.postMessage({type:'generating',id:data.id});
      }
      self.postMessage({type:'answer',id:data.id,text});
    }
  } catch(error) { self.postMessage({type:'error',id:data.id,message:String(error.message||error).slice(0,160)}); }
};
