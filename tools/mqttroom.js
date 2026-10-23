/* ---------- MQTT room (standalone build) ----------
   Same surface the game uses from the claude.ai room: join(name) -> {presence, onPeers, leave}.
   Every player publishes its presence to a public MQTT broker over secure WebSocket and listens to
   everyone else's, so no direct connection between players is needed. Earliest joiner sorts first
   and acts as host. */
const NetRoom=(function(){
  if(!window.mqtt)return null;
  const BROKERS=['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt'];
  const merge=(obj,patch)=>{const o=Object.assign({},obj);for(const k in patch){if(patch[k]===null)delete o[k];else o[k]=patch[k];}return o;};
  const tryBroker=(url,will)=>new Promise((resolve,reject)=>{
    const c=mqtt.connect(url,{clientId:'dk_'+Math.random().toString(36).slice(2,12),clean:true,connectTimeout:7000,reconnectPeriod:2000,keepalive:20,will});
    const t=setTimeout(()=>{try{c.end(true);}catch(e){}reject(new Error('timeout'));},8000);
    c.once('connect',()=>{clearTimeout(t);resolve(c);});
  });
  return {join(name){return new Promise(async(resolve,reject)=>{
    const base='driftkart/v1/'+String(name).replace(/[^a-z0-9-]/gi,'').toLowerCase();
    const label=Date.now().toString(36).padStart(9,'0')+'-'+Math.random().toString(36).slice(2,6);
    const myTopic=base+'/p/'+label;
    let client=null;
    for(const url of BROKERS){try{client=await tryBroker(url,{topic:myTopic,payload:'null',qos:0,retain:false});break;}catch(e){}}
    if(!client)return reject({code:'upstream_error',message:'broker unreachable'});
    const me={presence:{}},peers=new Map();
    let handler=null,errH=null,dirty=true,lastPub=0,emitQ=false,closed=false;
    const snapshot=()=>{
      const arr=[{peer:label,by:null,isMe:true,sameTab:true,kind:'viewer',guest:false,presence:me.presence,updatedAt:Date.now()}];
      for(const [l,v] of peers)arr.push({peer:l,by:null,isMe:false,sameTab:false,kind:'viewer',guest:false,presence:v.presence,updatedAt:v.updatedAt});
      return arr;
    };
    const emit=()=>{emitQ=false;if(handler)handler({peers:snapshot()});};
    const queueEmit=()=>{if(!emitQ){emitQ=true;setTimeout(emit,30);}};
    client.on('message',(topic,buf)=>{
      const l=topic.slice(topic.lastIndexOf('/')+1);if(l===label||buf.length>4096)return;
      const txt=buf.toString();
      if(txt==='null'){if(peers.delete(l))queueEmit();return;}
      let pr;try{pr=JSON.parse(txt);}catch(e){return;}
      if(!pr||typeof pr!=='object'||Array.isArray(pr))return;
      if(!peers.has(l)&&peers.size>=8)return;
      peers.set(l,{presence:pr,updatedAt:Date.now(),seen:Date.now()});queueEmit();
    });
    client.on('offline',()=>{if(!closed&&errH)errH({code:'upstream_error',message:'offline'});});
    client.subscribe(base+'/p/+',{qos:0});
    // publish on change (~15/s) plus a 1 s heartbeat so newcomers learn everyone; drop the silent
    const timer=setInterval(()=>{
      const now=Date.now();
      if(client.connected&&(dirty&&now-lastPub>66||now-lastPub>1000)){dirty=false;lastPub=now;client.publish(myTopic,JSON.stringify(me.presence),{qos:0});}
      let gone=false;for(const [l,v] of peers)if(now-v.seen>5000){peers.delete(l);gone=true;}
      if(gone)queueEmit();
    },33);
    resolve({
      name,
      presence(patch){me.presence=merge(me.presence,patch||{});dirty=true;queueEmit();return Promise.resolve();},
      onPeers(h,e){handler=h;errH=e;queueEmit();return()=>{handler=null;};},
      connected(){return client.connected;},
      leave(){closed=true;clearInterval(timer);try{client.publish(myTopic,'null',{qos:0});client.end();}catch(e){}return Promise.resolve();}
    });
  });}};
})();
