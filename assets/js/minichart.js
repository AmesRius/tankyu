/* ============================================================
   MiniChart — Chart.js不要のCanvas描画ライブラリ
   棒グラフ・折れ線・円・ドーナツに対応
============================================================ */
(function(global){
'use strict';

const FONT = '"Hiragino Kaku Gothic ProN","Hiragino Sans",Meiryo,sans-serif';

function px(canvas){ return window.devicePixelRatio||1; }

function setupCanvas(canvas){
  const dpr = window.devicePixelRatio||1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width||canvas.offsetWidth||600;
  const h = rect.height||canvas.offsetHeight||300;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w+'px';
  canvas.style.height = h+'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return {ctx, w, h};
}

function hexToRgba(hex, alpha){
  hex = hex.replace('#','');
  if(hex.length===3) hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// 折り返しテキスト描画
function fillTextEllipsis(ctx, text, x, y, maxW){
  if(ctx.measureText(text).width <= maxW){ ctx.fillText(text,x,y); return; }
  let t = text;
  while(t.length>2 && ctx.measureText(t+'…').width>maxW) t=t.slice(0,-1);
  ctx.fillText(t+'…',x,y);
}

// =========================================================
//  棒グラフ・折れ線グラフ共通
// =========================================================
function drawBarLine(canvas, data, opts){
  const {ctx,w,h} = setupCanvas(canvas);
  const type = opts.type||'bar'; // 'bar' | 'line'
  const isLine = type==='line';
  const isStacked = opts.stacked||false;
  const datasets = data.datasets||[];
  const labels   = data.labels||[];
  const colors   = opts.colors||['#5C85A4','#E8834A','#7B6EA8','#5DA06B','#D4A017','#4A9D9C','#C0575A'];
  const unit     = opts.unit||'';

  // マージン
  const ml=58, mr=20, mt=20, mb=opts.showLegend?90:50;
  const cw=w-ml-mr, ch=h-mt-mb;

  // 最大値計算
  let maxVal=0;
  labels.forEach((_,xi)=>{
    let sum=0;
    datasets.forEach(ds=>{ sum+=isStacked?(ds.data[xi]||0):0; maxVal=Math.max(maxVal,ds.data[xi]||0); });
    if(isStacked) maxVal=Math.max(maxVal,sum);
  });
  if(maxVal===0) maxVal=1;
  maxVal = Math.ceil(maxVal*1.15);

  // グリッド & Y軸
  const yTicks=5;
  ctx.font=`11px ${FONT}`; ctx.fillStyle='#90A4AE'; ctx.textAlign='right';
  for(let i=0;i<=yTicks;i++){
    const v=Math.round(maxVal/yTicks*i);
    const y=mt+ch-ch*(v/maxVal);
    ctx.fillText(v+unit, ml-6, y+4);
    ctx.strokeStyle='rgba(0,0,0,0.06)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(ml,y); ctx.lineTo(ml+cw,y); ctx.stroke();
  }

  // バー / 折れ線
  const groupW = cw/labels.length;
  const barW   = isLine?0:(groupW*0.65/Math.max(datasets.length,1));
  const barGap = isLine?0:(groupW*0.35/(Math.max(datasets.length,1)+1));

  // 折れ線用ポイント格納
  const linePoints = datasets.map(()=>[]);

  datasets.forEach((ds,di)=>{
    const color = colors[di%colors.length];
    ctx.fillStyle = isLine?'none':hexToRgba(color,0.78);
    ctx.strokeStyle = color;

    let stackBase = new Array(labels.length).fill(0);

    labels.forEach((lbl,xi)=>{
      const v = ds.data[xi]||0;
      const base = isStacked?(stackBase[xi]||0):0;
      const barH = ch*(v/maxVal);
      const baseH = ch*(base/maxVal);
      const x = ml + groupW*xi + (isStacked?groupW*0.1:(barGap*(di+1)+barW*di));
      const bw = isStacked?(groupW*0.8):barW;
      const y = mt+ch-barH-baseH;

      if(!isLine){
        ctx.beginPath();
        const r=Math.min(3,barH/2);
        ctx.roundRect?ctx.roundRect(x,y,bw,barH,r):ctx.rect(x,y,bw,barH);
        ctx.fill();
      }

      const cx2 = isLine?(ml+groupW*xi+groupW/2):(ml+groupW*xi+groupW/2);
      linePoints[di].push({x:cx2, y:mt+ch-ch*(v/maxVal)});

      if(isStacked) stackBase[xi]+=v;
    });

    // 折れ線
    if(isLine && linePoints[di].length>0){
      ctx.strokeStyle=color; ctx.lineWidth=2.5;
      ctx.beginPath();
      linePoints[di].forEach((p,i)=>{ i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y); });
      ctx.stroke();
      // 塗り
      ctx.fillStyle=hexToRgba(color,0.07);
      ctx.beginPath();
      ctx.moveTo(linePoints[di][0].x, mt+ch);
      linePoints[di].forEach(p=>ctx.lineTo(p.x,p.y));
      ctx.lineTo(linePoints[di][linePoints[di].length-1].x, mt+ch);
      ctx.closePath(); ctx.fill();
      // ポイント
      linePoints[di].forEach(p=>{
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(p.x,p.y,4.5,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p.x,p.y,4.5,0,Math.PI*2); ctx.stroke();
      });
    }
  });

  // X軸ラベル
  ctx.fillStyle='#78909C'; ctx.textAlign='center'; ctx.font=`11px ${FONT}`;
  labels.forEach((lbl,xi)=>{
    const x = ml+groupW*xi+groupW/2;
    fillTextEllipsis(ctx, String(lbl), x, mt+ch+16, groupW-4);
  });

  // 軸線
  ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(ml,mt); ctx.lineTo(ml,mt+ch); ctx.lineTo(ml+cw,mt+ch); ctx.stroke();

  // 凡例
  if(opts.showLegend && datasets.length>1){
    const ly = mt+ch+36;
    let lx = ml;
    ctx.font=`11px ${FONT}`; ctx.textAlign='left';
    datasets.forEach((ds,i)=>{
      const color=colors[i%colors.length];
      ctx.fillStyle=color;
      ctx.fillRect(lx,ly-9,12,12);
      ctx.fillStyle='#546E7A';
      ctx.fillText(ds.label||'', lx+16, ly+2);
      lx += ctx.measureText(ds.label||'').width+36;
      if(lx>w-mr){ lx=ml; }
    });
  }
}

// =========================================================
//  円・ドーナツ
// =========================================================
function drawPie(canvas, data, opts){
  const {ctx,w,h} = setupCanvas(canvas);
  const isDoughnut = opts.type==='doughnut';
  const colors = opts.colors||['#5C85A4','#E8834A','#7B6EA8','#5DA06B','#D4A017','#4A9D9C','#C0575A','#A07850'];
  const labels = data.labels||[];
  const values = (data.datasets&&data.datasets[0])?data.datasets[0].data:[];
  const total  = values.reduce((a,b)=>a+b,0)||1;

  const legendH = Math.ceil(labels.length/3)*22+16;
  const cx=w/2, cy=(h-legendH)/2+10, r=Math.min(cx-10,(h-legendH)/2-10);
  const innerR = isDoughnut?r*0.55:0;

  let angle=-Math.PI/2;
  values.forEach((v,i)=>{
    const sweep = (v/total)*Math.PI*2;
    const color = colors[i%colors.length];
    ctx.fillStyle=hexToRgba(color,0.88);
    ctx.strokeStyle='#fff'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,angle,angle+sweep);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // ラベル（大きいスライスのみ内側に）
    if(v/total>0.07){
      const mid=angle+sweep/2;
      const lx=cx+Math.cos(mid)*(isDoughnut?(r*0.72):(r*0.6));
      const ly=cy+Math.sin(mid)*(isDoughnut?(r*0.72):(r*0.6));
      ctx.fillStyle='#fff'; ctx.font=`bold 11px ${FONT}`; ctx.textAlign='center';
      ctx.fillText(Math.round(v/total*100)+'%', lx, ly+4);
    }
    angle+=sweep;
  });

  // ドーナツ中央くり抜き
  if(isDoughnut){
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(cx,cy,innerR,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#37474F'; ctx.font=`bold 14px ${FONT}`; ctx.textAlign='center';
    ctx.fillText(total.toLocaleString(), cx, cy+2);
    ctx.fillStyle='#90A4AE'; ctx.font=`10px ${FONT}`;
    ctx.fillText('合計', cx, cy+16);
  }

  // 凡例
  ctx.font=`11px ${FONT}`; ctx.textAlign='left';
  const colW=Math.floor(w/3);
  labels.forEach((lbl,i)=>{
    const col=i%3, row=Math.floor(i/3);
    const lx=col*colW+10, ly=h-legendH+row*22+14;
    ctx.fillStyle=colors[i%colors.length];
    ctx.fillRect(lx,ly-9,11,11);
    ctx.fillStyle='#546E7A';
    fillTextEllipsis(ctx, lbl, lx+15, ly+1, colW-20);
  });
}

// =========================================================
//  公開API: MiniChart
// =========================================================
function MiniChart(canvas, config){
  this.canvas   = canvas;
  this.config   = config;
  this._tooltip = null;
  this.render();
}
MiniChart.prototype.render = function(){
  const t = this.config.type;
  if(t==='bar'||t==='line'){
    drawBarLine(this.canvas, this.config.data, Object.assign({type:t},this.config.options||{}));
  } else if(t==='pie'||t==='doughnut'){
    drawPie(this.canvas, this.config.data, Object.assign({type:t},this.config.options||{}));
  }
};
MiniChart.prototype.destroy = function(){
  const {ctx,w,h} = setupCanvas(this.canvas);
  ctx.clearRect(0,0,w,h);
};
MiniChart.prototype.update = function(newConfig){
  if(newConfig) this.config = Object.assign(this.config, newConfig);
  this.destroy();
  this.render();
};

global.MiniChart = MiniChart;
})(window);
