// Pure deterministic demonstration engine. All durations are simulated seconds.
export class SolarEngine {
 constructor(){this.reset()}
 reset(c={}){this.s={time:0,mode:'AUTO',state:'BOOT',phase:'',progress:0,pump:false,motor:false,paused:false,stopped:false,fault:'',sun:85,amb:34,rain:false,tank:80,capacity:3,flow:2,spd:30,soc:70,Ta:42,Tb:42,siA:.922,siB:.922,eA:0,eB:0,eC:0,water:0,qual:0,lock:0,tracking:false,azimuth:15,elevation:60,sunAzimuth:0,sunElevation:65,trackingEnergy:0,diagnosis:'clean',...c};this.elapsed=0;this.sample=0;this.hot=0;this.nextMeasure=1800;this.history=[];this.events=[];this.alert('Simulation reset. No measured data.');this.updatePower()}
 alert(msg){this.events.push({time:this.s.time,msg});if(this.events.length>100)this.events.shift()}
 blocked(){const s=this.s;return s.stopped?'Stop is latched':s.fault?'Fault: '+s.fault:s.diagnosis==='crack'||s.diagnosis==='hotspot'?'Illustrative visual fault requires inspection':s.rain?'Rain inhibits water operations':s.tank<10?'Tank below 10%':s.state!=='IDLE'?'Controller busy: '+s.state:''}
 command(cmd){let s=this.s;if(cmd==='stop'){s.stopped=true;s.state='STOPPED';s.pump=s.motor=false;s.qual=0;this.alert('STOP latched. Simulated outputs off.');return}
 if(cmd==='recover'){s.fault='';s.stopped=false;s.diagnosis='clean';s.state='HOMING';s.pump=s.motor=false;this.elapsed=0;this.alert('Explicit recovery: homing.');return}
 if(cmd==='pause'){s.paused=!s.paused;return}if(cmd==='refill'){s.tank=100;this.alert('Tank refilled.');return}
 if(cmd==='heat'){s.Ta+=10;s.Tb+=10;this.clearTrend();return}if(cmd==='dust'){s.siA=Math.max(.35,s.siA-.1);s.siB=Math.max(.35,s.siB-.1);this.clearTrend();return}
 if(cmd==='sensor'||cmd==='jam'){this.fail(cmd==='sensor'?'SENSOR':'JAM');return}
 const why=this.blocked();if(why){this.alert('Command blocked: '+why);return}
 if(cmd==='clean'){s.state='CLEANING';s.phase='PRE_SPRAY';s.pump=true;s.motor=false;this.elapsed=0;this.clearTrend();this.alert('Cleaning: pre-spray, wipe down, return.');}
 if(cmd==='cool'){s.state='COOLING';s.pump=true;this.elapsed=0;this.clearTrend();this.alert('Cooling active. Target below 38°C.');}
 if(cmd==='reposition'){if(!s.tracking){this.alert('Enable conceptual tracking first.');return}s.azimuth=s.sunAzimuth;s.elevation=s.sunElevation;s.eC+=2*5/3600;s.trackingEnergy+=2*5/3600;this.alert('Conceptual reposition: assumed 2 W for 5 seconds.');this.clearTrend()}
 }
 clearTrend(){this.history=[];this.hot=0}
 fail(code){this.s.fault=code;this.s.state='FAULT';this.s.phase='';this.s.pump=this.s.motor=false;this.s.qual=0;this.alert('FAULT '+code+': all outputs off.')}
 updatePower(){const s=this.s,rad=Math.PI/180;let incidence=Math.sin(s.elevation*rad)*Math.sin(s.sunElevation*rad)+Math.cos(s.elevation*rad)*Math.cos(s.sunElevation*rad)*Math.cos((s.azimuth-s.sunAzimuth)*rad);const fixed=.93;s.G=s.sun*10*(s.rain?.3:1);s.Ga=s.G*(s.tracking?Math.max(0,incidence):fixed);s.Gb=s.G*fixed;s.Pa=20*s.Ga/1000*s.siA*Math.max(0,1-.004*(s.Ta-25));s.Pb=20*s.Gb/1000*s.siB*Math.max(0,1-.004*(s.Tb-25));s.Va=s.Ga>20?Math.max(0,17.5*(1-.0035*(s.Ta-25))):0;s.Ia=s.Va?s.Pa/s.Va:0;s.net=s.eA-s.eB-s.eC;s.expected=20*s.Ga/1000*Math.max(0,1-.004*(s.Ta-25));s.siValid=s.G>300}
 tick(dt){const s=this.s;if(s.paused)return;const n=Math.ceil(dt/.25);for(let i=0;i<n;i++)this.advance(dt/n)}
 advance(h){const s=this.s;s.time+=h;this.elapsed+=h;this.sample+=h;s.lock=Math.max(0,s.lock-h);
 if(s.state==='BOOT'&&this.elapsed>=1){s.state='HOMING';this.elapsed=0;this.alert('Self-test complete. Homing.');}
 if(s.state==='HOMING'){s.motor=true;s.progress=Math.max(0,s.progress-h/8);if(s.progress===0&&this.elapsed>1){s.state='IDLE';s.motor=false;this.elapsed=0;this.alert('Top end-stop reached. IDLE.')}else if(this.elapsed>=30)this.fail('HOME')}
 if((s.rain||s.tank<10)&&s.pump){s.pump=s.motor=false;s.state='IDLE';s.phase='';s.qual=0;s.lock=120;this.alert('Water interlock: operation aborted.');}
 if(s.state==='COOLING'&&(s.Ta<38||this.elapsed>=60)){s.state='IDLE';s.pump=false;s.lock=120;this.alert('Cooling complete. 120 s lockout.');this.clearTrend()}
 if(s.state==='CLEANING'){
  if(s.phase==='PRE_SPRAY'&&this.elapsed>=2){s.phase='WIPE_DOWN';s.motor=true;this.elapsed=0}
  else if(s.phase==='WIPE_DOWN'){s.progress=Math.min(1,s.progress+h/12);s.siA=Math.min(1,s.siA+h*.012);if(s.progress>=1){s.phase='WIPE_UP';this.elapsed=0}else if(this.elapsed>25)this.fail('JAM')}
  else if(s.phase==='WIPE_UP'){s.progress=Math.max(0,s.progress-h/12);if(s.progress<=0){s.state='IDLE';s.phase='PARK';s.motor=s.pump=false;s.siA=.995;s.qual=0;this.alert('Cleaning complete. New simulated clean baseline.');this.clearTrend()}else if(this.elapsed>25)this.fail('JAM')}
 }
 if(s.state==='MEASURE_MODE'&&this.elapsed>=60){s.state='IDLE';this.alert('Matched-load measurement interval complete.')}
 if(s.state==='IDLE'&&!s.stopped&&!s.fault){if(s.mode==='AUTO'&&['clean','dust'].includes(s.diagnosis)){
 const eligible=s.siA<.9&&s.G>300&&!s.rain&&s.tank>=10;s.qual=eligible?s.qual+h:0;
 if(this.sample>=5){this.sample%=5;this.hot=s.Ta>45?this.hot+1:0;if(this.hot>=3&&s.lock===0)this.command('cool')}
 if(s.state==='IDLE'&&s.qual>=600)this.command('clean');
 if(s.state==='IDLE'&&s.tracking&&Math.abs(s.azimuth-s.sunAzimuth)>3)this.command('reposition');
 }else s.qual=0;
 if(s.state==='IDLE'&&s.time>=this.nextMeasure){s.state='MEASURE_MODE';this.elapsed=0;this.nextMeasure=s.time+1800;this.alert('K2: matched-load measurement, 60 s.');}}
 this.updatePower();const U=s.rain?34.5:23;s.Ta+=(s.Ga*.765-U*(s.Ta-s.amb))/10000*h-(s.pump?260*(s.Ta-(s.amb-4))/10000*h:0);s.Tb+=(s.Gb*.765-U*(s.Tb-s.amb))/10000*h;s.Ta=Math.min(100,Math.max(-10,s.Ta));s.Tb=Math.min(100,Math.max(-10,s.Tb));
 const dust=(s.rain?-.00015:.000025)*h;s.siA=Math.max(.35,Math.min(1,s.siA-dust));s.siB=Math.max(.35,Math.min(1,s.siB-dust));let load=.6+(s.pump?6.5:0)+(s.motor?7:0);s.eA+=s.Pa*h/3600;s.eB+=s.Pb*h/3600;s.eC+=load*h/3600;s.soc=Math.max(0,Math.min(100,s.soc+(s.Pa*.9-load)*h/3600/28.9*100));if(s.pump){let litres=Math.min(s.capacity*s.tank/100,s.flow*h/60);s.water+=litres;s.tank=Math.max(0,s.tank-litres/s.capacity*100)}
 this.updatePower();if(!this.history.length||s.time-this.history.at(-1).time>=2){this.history.push({...s,source:'demo'});if(this.history.length>600)this.history.shift()}
 }
 forecast(){const h=this.history,s=this.s;if(h.length<10||h.at(-1).time-h[0].time<20)return null;const recent=h.filter(x=>x.time>s.time-90),first=recent[0],last=recent.at(-1),slope=(last.Ta-first.Ta)/(last.time-first.time||1),eq=s.amb+s.Ga*.765/23;return Math.max(Math.min(s.Ta,eq),Math.min(Math.max(s.Ta,eq),s.Ta+slope*(10000/23)*(1-Math.exp(-600/(10000/23)))))}
}
