/* 실시간 설문 위젯: 화면 오른쪽 아래 고정 버튼 → 누르면 지금 진행 중인 설문.
   반 구분 없이 접속한 모두가 같은 질문을 보고, 응답 막대가 실시간으로 바뀜.
   <body data-poll-page> 이면 버튼 없이 설문 칸을 페이지에 바로 펼침(/poll). */
(function(){
  const API='https://scnbrusxjwhehpbjznye.supabase.co/rest/v1/rpc/';
  const APIKEY='sb_publishable_yPvmRWZqaGARrsrz2HL1Xw_JEzHDOcB';
  const KEY='force-poll-v1';
  if(new URLSearchParams(location.search).has('preview')) return;   // 교사용 미리 보기에서는 설문에 참여하지 않음
  const page=document.body.hasAttribute('data-poll-page');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let P={voter:'',mine:{}};
  try{ Object.assign(P,JSON.parse(localStorage.getItem(KEY)||'{}')); }catch(e){}
  if(!/^[A-Za-z0-9-]{16,64}$/.test(P.voter||'')) P.voter=crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  const store=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(P)); }catch(e){} };
  store();

  const css=`
.pv-btn{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:40;border:2px solid var(--ink);background:var(--card);color:var(--ink);
  border-radius:999px;padding:8px 16px;font:inherit;font-size:16px;cursor:pointer;box-shadow:3px 3px 0 var(--ink)}
.pv-btn.live{background:var(--ink);color:var(--paper)}
.pv-btn .dot{display:none;width:10px;height:10px;border-radius:50%;background:var(--e);margin-left:6px;vertical-align:middle;animation:pvblink 1.2s infinite}
.pv-btn.live .dot{display:inline-block}
@keyframes pvblink{50%{opacity:.2}}
@media (prefers-reduced-motion:reduce){.pv-btn .dot{animation:none}}
.pv-panel{position:fixed;right:16px;bottom:calc(70px + env(safe-area-inset-bottom,0px));z-index:41;width:min(380px,calc(100vw - 32px));max-height:calc(100vh - 120px);overflow:auto;
  background:var(--card);border:2px solid var(--ink);border-radius:16px;padding:16px;box-shadow:4px 4px 0 var(--ink)}
.pv-page{position:static;width:auto;max-height:none;box-shadow:none}
.pv-x{position:absolute;top:6px;right:8px;border:none;background:none;font-size:22px;cursor:pointer;color:var(--muted)}
.pv-tag{font-size:13px;color:var(--muted)}
.pv-q{font-family:var(--display);font-size:22px;line-height:1.35;margin:4px 28px 12px 0}
.pv-page .pv-q{font-size:clamp(24px,6vw,32px);margin-right:0}
.pv-opts{display:grid;gap:8px}
.pv-opt{position:relative;display:flex;gap:10px;align-items:center;width:100%;text-align:left;border:2px solid var(--line);background:var(--paper);color:var(--ink);
  border-radius:12px;padding:10px 12px;font:inherit;font-size:16px;cursor:pointer;overflow:hidden}
.pv-opt:disabled{cursor:default}
.pv-opt i{position:absolute;inset:0 auto 0 0;background:var(--soft);transition:width .4s}
.pv-opt span{position:relative}
.pv-opt b{position:relative;margin-left:auto;font-family:var(--display);font-weight:400;font-size:17px;white-space:nowrap}
.pv-opt[aria-pressed="true"]{border-color:var(--g);box-shadow:0 0 0 2px var(--g) inset}
.pv-opt.right{border-color:var(--b);box-shadow:0 0 0 2px var(--b) inset}
.pv-opt.right i{background:var(--b-bg)}
.pv-msg{margin:10px 0 0;font-size:15px;font-weight:700}
.pv-none{margin:0;color:var(--muted)}
.dw-btn{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:40;border:2px solid var(--ink);background:var(--card);color:var(--ink);
  border-radius:999px;padding:8px 16px;font:inherit;font-size:16px;cursor:pointer;box-shadow:3px 3px 0 var(--ink)}
.dw-card{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:45;width:min(420px,calc(100vw - 32px));text-align:center;
  background:var(--card);color:var(--ink);border:3px solid var(--ink);border-radius:22px;padding:22px 20px 20px;box-shadow:7px 7px 0 var(--accent,var(--g));max-height:calc(100vh - 40px);overflow:auto}
.dw-card .pv-x{top:8px;right:10px}
.dw-tag{font-size:15px;color:var(--muted)}
.dw-wheel .dwh{max-width:min(280px,46vh)}
.dw-res{font-family:var(--display);font-weight:800;font-size:clamp(32px,9vw,44px);line-height:1.15;margin:6px 0 2px}
.dw-wait{font-size:17px;font-weight:700;margin:8px 0 2px}
.dw-mine{display:inline-block;margin:2px 0 8px;font-weight:700;border:2px solid var(--ink);border-radius:999px;padding:2px 12px;background:var(--amber,#FFD05B);color:#252B3A}
.dw-order{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;font-size:14px;margin-top:6px}
.dw-order span{border:2px solid var(--line);border-radius:999px;padding:0 10px}
.dw-order span.now{border-color:var(--ink);font-weight:700}`;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  let btn=null;
  const panel=document.createElement('div');
  panel.className='pv-panel'+(page?' pv-page':''); panel.setAttribute('role','region'); panel.setAttribute('aria-label','실시간 설문');
  panel.innerHTML=(page?'':'<button class="pv-x" type="button" aria-label="설문 닫기">×</button>')+'<div class="pv-body" aria-live="polite"></div>';
  const body=panel.querySelector('.pv-body');
  if(page){ (document.getElementById('pollMount')||document.body).appendChild(panel); }
  else{
    btn=document.createElement('button'); btn.type='button'; btn.className='pv-btn'; btn.innerHTML='📊 설문<span class="dot" aria-hidden="true"></span>';
    btn.setAttribute('aria-expanded','false');
    panel.hidden=true; btn.hidden=true;   // 설문이 열려 있을 때만 보임
    document.body.appendChild(btn); document.body.appendChild(panel);
    btn.addEventListener('click',()=>{ panel.hidden=!panel.hidden; btn.setAttribute('aria-expanded',!panel.hidden); if(!panel.hidden) tick(); });
    panel.querySelector('.pv-x').addEventListener('click',()=>{ panel.hidden=true; btn.setAttribute('aria-expanded','false'); btn.focus(); });
  }

  async function rpc(name,b){
    const r=await fetch(API+name,{method:'POST',headers:{apikey:APIKEY,'Content-Type':'application/json'},body:JSON.stringify(b)});
    const j=await r.json().catch(()=>null);
    if(!r.ok) throw new Error((j&&j.message)||('HTTP '+r.status));
    if(j&&j.error){ const e=new Error(j.error); e.code=j.error; throw e; }
    return j;
  }

  let cur=null, timer=null, gen=0, sending=false, note='';
  function render(){
    if(btn) btn.classList.toggle('live',!!(cur&&cur.active&&cur.open));
    if(!cur||!cur.active){ body.innerHTML='<p class="pv-none">지금 진행 중인 설문이 없어요. 선생님이 설문을 시작하면 '+(page?'여기에 바로 질문이 나타나요.':'이 버튼에 빨간 점이 생겨요.')+'</p>'; return; }
    const mine=P.mine[cur.session], c=cur.counts||[], total=c.reduce((a,b)=>a+b,0), ox=cur.kind==='ox';
    const showAns=cur.revealed&&typeof cur.answer==='number';
    body.innerHTML=`<div class="pv-tag">${esc(cur.tag)} · 응답 ${total}명</div><div class="pv-q">${esc(cur.question)}</div><div class="pv-opts">`+
      (cur.options||[]).map((o,i)=>{ const n=c[i]||0, pct=total?Math.round(n/total*100):0, right=showAns&&i===cur.answer;
        return `<button type="button" class="pv-opt${right?' right':''}" data-i="${i}" aria-pressed="${mine===i}" ${cur.open?'':'disabled'}><i style="width:${pct}%"></i><span>${ox?'':(i+1)+'. '}${esc(o)}${right?' ✓':''}</span><b>${pct}% · ${n}명</b></button>`; }).join('')+
      '</div><p class="pv-msg">'+esc(note||(cur.open?(mine===undefined?'답을 눌러 주세요. 모두의 응답이 바로 보여요.':'제출했어요. 종료 전까지 바꿀 수 있어요.'):(showAns?(mine===undefined?'설문이 끝났어요.':mine===cur.answer?'정답이에요!':'설문이 끝났어요. ✓ 표시가 정답이에요.'):'설문이 끝났어요.')))+'</p>';
  }
  async function tick(){
    const my=++gen; clearTimeout(timer);
    try{
      const r=await rpc('poll_current',{}); if(my!==gen) return;
      if(!cur||r.session!==cur.session) note='';
      cur=r; drawUpdate(r.draw);
      // 새 설문이 시작되면 설문 창을 저절로 엶 (같은 설문은 한 번만)
      if(btn){
        btn.hidden=!cur.active;
        if(!cur.active){ panel.hidden=true; btn.setAttribute('aria-expanded','false'); }    // 교사가 '설문 내리기'를 누르면 사라짐
        else if(P.seen!==cur.session){ P.seen=cur.session; store(); panel.hidden=false; btn.setAttribute('aria-expanded','true'); }   // 시작하면 자동으로 열림 ('종료' 뒤에도 결과와 정답을 보여 줌)
      }
    }
    catch(e){ if(my!==gen) return; }
    render();
    const open=page||(btn&&!panel.hidden)||!!D;
    timer=setTimeout(tick, document.visibilityState!=='visible'?15000:open?2500:6000);
  }
  panel.addEventListener('click',async e=>{
    const b=e.target.closest('.pv-opt'); if(!b||!cur||!cur.open||sending) return;
    const i=+b.dataset.i, s=cur.session; sending=true; note='';
    try{ await rpc('poll_vote',{p_class:'all',p_session:s,p_voter:P.voter,p_choice:i}); P.mine={[s]:i}; store(); }
    catch(err){ note=err.code==='closed'?'설문이 끝났어요.':err.code==='changed'?'질문이 바뀌었어요.':'제출하지 못했어요. 다시 눌러 주세요.'; }
    finally{ sending=false; tick(); }
  });
  /* 모둠 뽑기: 교사가 '시작'하면 화면 가운데에 룰렛 카드가 뜨고, '뽑기'를 누르면 룰렛이 돌다가 한 모둠에서 멈춤 */
  const dBtn=document.createElement('button'); dBtn.type='button'; dBtn.className='dw-btn'; dBtn.textContent='🎲 모둠 뽑기'; dBtn.hidden=true;
  const dCard=document.createElement('div'); dCard.className='dw-card'; dCard.hidden=true;
  dCard.setAttribute('role','dialog'); dCard.setAttribute('aria-label','모둠 뽑기');
  dCard.innerHTML='<button class="pv-x" type="button" aria-label="닫기">×</button><div class="dw-tag">🎲 모둠 뽑기</div><div class="dw-wheel"></div><div class="dw-body" aria-live="polite"></div>';
  document.body.appendChild(dBtn); document.body.appendChild(dCard);
  const dBody=dCard.querySelector('.dw-body'), wheel=window.DrawWheel?DrawWheel(dCard.querySelector('.dw-wheel')):null;
  let D=null, spinning=false;
  const myGrp=()=>{ try{ const y=JSON.parse(localStorage.getItem('force-design-activity-v1-sync')||'{}'); return y.cls?+y.grp||0:0; }catch(e){ return 0; } };
  function drawText(){
    if(!D){ dBody.innerHTML=''; return; }
    if(spinning){ dBody.innerHTML='<div class="dw-wait">두구두구…</div>'; return; }
    if(!D.last){ dBody.innerHTML='<div class="dw-wait">선생님이 곧 룰렛을 돌려요!</div>'; return; }
    const mine=myGrp();
    dBody.innerHTML=`<div class="dw-res">${D.last}모둠!</div>${mine&&mine===D.last?'<div class="dw-mine">우리 모둠이에요!</div>':''}`+
      `<div class="dw-order">${D.drawn.map((g,i)=>`<span class="${i===D.drawn.length-1?'now':''}">${i+1}. ${g}모둠</span>`).join('')}</div>`;
  }
  function drawUpdate(d){
    D=d||null;
    dBtn.hidden=!D;
    if(!D){ dCard.hidden=true; spinning=false; if(wheel) wheel.set(null); return; }
    if(P.dseq!==D.seq){   // 시작·뽑기마다 한 번 저절로 뜸
      const spin=!!D.last&&D.age<20;
      P.dseq=D.seq; store(); dCard.hidden=false;
      if(wheel){ spinning=spin; wheel.set(D,{spin,done(){ spinning=false; drawText(); }}); }
    }
    drawText();
  }
  dBtn.addEventListener('click',()=>{ dCard.hidden=!dCard.hidden; });
  dCard.querySelector('.pv-x').addEventListener('click',()=>{ dCard.hidden=true; dBtn.focus(); });

  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') tick(); });
  tick();
})();
