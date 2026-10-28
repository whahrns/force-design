/* 모둠 뽑기 룰렛: 교사 화면과 학생 화면이 함께 씀.
   const w = DrawWheel(상자);  w.set(D, {spin:true, done(){...}})
   D = {groups, drawn:[...], last}. spin이면 몇 바퀴 돈 뒤 last 칸이 위쪽 화살표에 멈춤. */
(function(){
  const FILL=['#C9B8FF','#FFB3DE','#FFE08F','#B8F5DA'];   // 보라·분홍·노랑·민트 (글자는 진한 색)
  const css=`
.dwh{display:block;width:100%;max-width:340px;margin:0 auto;overflow:visible}
.dwh .rot{transform-origin:150px 170px;transform-box:view-box}
.dwh path{stroke:#252B3A;stroke-width:3}
.dwh text{font-family:"Host Grotesk","Do Hyeon",sans-serif;font-weight:800;fill:#252B3A;text-anchor:middle;dominant-baseline:central}
.dwh .done path{fill:#E4E2EC}
.dwh .done text{fill:#9A97A8}
.dwh .win path{stroke-width:6}`;
  let styled=false;
  const rad=d=>d*Math.PI/180, P=(r,a)=>[150+r*Math.sin(rad(a)), 170-r*Math.cos(rad(a))];

  window.DrawWheel=function(box){
    if(!styled){ const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st); styled=true; }
    let n=0, rot=0, g=null, timer=null;
    function build(groups){
      n=groups; const R=140, s=360/n;
      let h='<svg class="dwh" viewBox="0 0 300 330" role="img" aria-label="모둠 룰렛"><g class="rot">';
      for(let i=0;i<n;i++){
        const [x0,y0]=P(R,i*s), [x1,y1]=P(R,(i+1)*s), [tx,ty]=P(R*0.66,(i+.5)*s);
        h+=`<g data-g="${i+1}"><path d="M150 170 L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${FILL[i%4]}"/>`+
           `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="${n>6?30:36}">${i+1}</text></g>`;
      }
      h+='</g><circle cx="150" cy="170" r="18" fill="#FFFFFF" stroke="#252B3A" stroke-width="3"/>'+
         '<polygon points="150,44 134,8 166,8" fill="#6434DF" stroke="#252B3A" stroke-width="3" stroke-linejoin="round"/></svg>';
      box.innerHTML=h; g=box.querySelector('.rot'); rot=0;
    }
    const goal=k=>{ const c=(k-.5)*360/n, d=(((-c-rot)%360)+360)%360; return rot+d; };   // k번 칸 가운데가 위로 오는 각도
    function marks(D,showWin){
      box.querySelectorAll('[data-g]').forEach(el=>{ const k=+el.dataset.g;
        el.classList.toggle('done', D.drawn.includes(k)&&!(k===D.last&&showWin!==undefined));
        el.classList.toggle('win', !!showWin&&k===D.last); });
    }
    return {
      set(D,o){
        o=o||{}; clearTimeout(timer);
        if(!D) { box.innerHTML=''; n=0; return; }
        if(D.groups!==n) build(D.groups);
        if(!D.last){ marks(D); g.style.transition='none'; return; }
        const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(o.spin&&!reduce){
          marks(D,false);
          rot=goal(D.last)+360*5;
          g.style.transition='transform 4.2s cubic-bezier(.15,.7,.12,1)';
          g.getBoundingClientRect();   // 바로 앞 상태에서 돌기 시작하도록
          g.style.transform=`rotate(${rot}deg)`;
          timer=setTimeout(()=>{ marks(D,true); o.done&&o.done(); },4300);
        }else{
          rot=goal(D.last); g.style.transition='none'; g.style.transform=`rotate(${rot}deg)`;
          marks(D,true); o.done&&o.done();
        }
      }
    };
  };
})();
