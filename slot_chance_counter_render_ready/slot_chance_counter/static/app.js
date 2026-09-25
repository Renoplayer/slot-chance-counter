const KEY="slotChanceCounterV1";

let data=JSON.parse(localStorage.getItem(KEY)||"null")||{
  chars:{
    munmyo:{points:0,events:[],cz:[]},
    ikoma:{points:0,events:[],cz:[]}
  },
  allstar:0,
  items:[],
  voices:{},
  characters:{},
  history:[]
};

// 旧データに規定ptが無くてもそのまま使えるようにする
data.history=(data.history||[]).map(x=>({
  ...x,
  points:x.points??"-"
}));

function save(){
  localStorage.setItem(KEY,JSON.stringify(data));
  render();
}

function addChance(who,pts,type){
  data.chars[who].points+=pts;
  data.chars[who].events.push({pts,type});
  save();
}

function addCZ(who){
  // CZを押した時点のポイントを自動取得
  const currentPoints=data.chars[who].points;

  data.chars[who].cz.push({
    success:null,
    points:currentPoints
  });

  // 履歴に規定ptを自動記録
  data.history.push({
    g:"-",
    trigger:who==="munmyo"?"無名":"生駒",
    type:"駿城",
    st:"-",
    points:currentPoints
  });

  // ポイントをリセット
  data.chars[who].points=0;

  save();
}

function addAllStar(){
  data.allstar++;

  data.history.push({
    g:"-",
    trigger:"オールスター",
    type:"駿城",
    st:"-",
    points:0
  });

  save();
}

function undo(who){
  let e=data.chars[who].events.pop();

  if(e){
    data.chars[who].points=
      Math.max(0,data.chars[who].points-e.pts);
  }

  save();
}

function clearCharacter(who){
  data.chars[who]={
    points:0,
    events:[],
    cz:[]
  };

  save();
}

function addItem(){
  let x=document.getElementById("item-name").value.trim();

  if(!x)return;

  data.items.push(x);

  document.getElementById("item-name").value="";

  save();
}

function removeItem(i){
  data.items.splice(i,1);
  save();
}

function addVoice(v){
  data.voices[v]=(data.voices[v]||0)+1;
  save();
}

function addCharacter(v){
  data.characters[v]=(data.characters[v]||0)+1;
  save();
}


// 規定ptの入力欄は作らない
// 履歴の「規定pt」列だけ表示する
function ensureHistoryPointUI(){

  const table=document.querySelector("#cz-table");

  const head=
    table?.closest("table")?.querySelector("thead tr");

  // 古い規定pt入力欄がHTMLに残っていた場合は削除
  const pointsInput=
    document.getElementById("points-input");

  if(pointsInput){
    pointsInput.remove();
  }

  // 規定ptの見出しを追加
  if(head && !head.querySelector(".points-head")){

    const th=document.createElement("th");

    th.className="points-head";
    th.textContent="規定pt";

    head.insertBefore(th,head.lastElementChild);
  }
}


// 手動で履歴を追加する場合
// 規定ptは自動入力されるCZ履歴以外では「-」
function addHistory(){

  const g=
    document.getElementById("g-input").value||"-";

  data.history.push({
    g,
    trigger:document.getElementById("trigger").value,
    type:document.getElementById("type").value,
    st:document.getElementById("st-input").value||"-",
    points:"-"
  });

  [
    "g-input",
    "st-input"
  ].forEach(id=>{
    const el=document.getElementById(id);

    if(el){
      el.value="";
    }
  });

  save();
}

function removeHistory(i){
  data.history.splice(i,1);
  save();
}

function resetAll(){

  if(confirm("すべての記録を削除しますか？")){

    localStorage.removeItem(KEY);

    location.reload();
  }
}

function pct(n,total){
  return total?
    ((n/total)*100).toFixed(1):
    "0.0";
}

function rate(events){

  let total=events.length;

  let hit=events.filter(
    x=>x.type==="normal_light"||x.type==="light"
  ).length;

  return total?
    Math.round(hit/total*100):
    0;
}

function singleLightStats(events){

  const single=events.filter(
    x=>
      x.type==="normal_none"||
      x.type==="normal_light"||
      x.type==="none"||
      x.type==="light"
  );

  const light=single.filter(
    x=>x.type==="normal_light"||x.type==="light"
  ).length;

  return {
    single,
    light,
    rate:single.length?
      ((light/single.length)*100).toFixed(1):
      "0.0"
  };
}

function avg15(events){

  let c=events.filter(
    x=>x.pts>=15
  ).length;

  return events.length?
    (c/events.length).toFixed(1):
    "0.0";
}

function oneCount(events){

  return events.filter(
    x=>x.pts===1
  ).length;
}


function render(){

  // 規定pt入力欄を削除
  ensureHistoryPointUI();


  const m=data.chars.munmyo;
  const i=data.chars.ikoma;


  document.getElementById("munmyo-points").textContent=
    m.points+" pt";

  document.getElementById("ikoma-points").textContent=
    i.points+" pt";


  document.getElementById("munmyo-rate").textContent=
    rate(m.events)+"%";

  document.getElementById("ikoma-rate").textContent=
    rate(i.events)+"%";


  document.getElementById("munmyo-count").textContent=
    `${m.events.filter(
      x=>x.type==="normal_light"||x.type==="light"
    ).length} / ${m.events.length}`;


  document.getElementById("ikoma-count").textContent=
    `${i.events.filter(
      x=>x.type==="normal_light"||x.type==="light"
    ).length} / ${i.events.length}`;


  document.getElementById("munmyo-avg15").textContent=
    avg15(m.events)+"回";

  document.getElementById("ikoma-avg15").textContent=
    avg15(i.events)+"回";


  document.getElementById("munmyo-one").textContent=
    oneCount(m.events)+"回";

  document.getElementById("ikoma-one").textContent=
    oneCount(i.events)+"回";


  const ms=singleLightStats(m.events);
  const is=singleLightStats(i.events);


  document.getElementById("munmyo-single-rate").textContent=
    ms.rate+"%";

  document.getElementById("munmyo-single-count").textContent=
    `発光あり ${ms.light} / 単独 ${ms.single}`;


  document.getElementById("ikoma-single-rate").textContent=
    is.rate+"%";

  document.getElementById("ikoma-single-count").textContent=
    `発光あり ${is.light} / 単独 ${is.single}`;


  let total=
    m.events.length+i.events.length;


  let flashes=
    m.events.filter(
      x=>x.type==="normal_light"||x.type==="light"
    ).length+
    i.events.filter(
      x=>x.type==="normal_light"||x.type==="light"
    ).length;


  document.getElementById("overall-rate").textContent=
    total?
      `1 / ${Math.round(
        total/Math.max(1,flashes)
      )}`:
      "1 / 0";


  document.getElementById("allstar-count").textContent=
    data.allstar;


  document.getElementById("items").innerHTML=
    data.items.map((x,n)=>
      `<div class="item">
        ${esc(x)}
        <button onclick="removeItem(${n})">×</button>
      </div>`
    ).join("");


  const vc=data.voices;

  const mt=vc["男性"]||0;
  const ft=vc["女性"]||0;
  const kw=vc["景之弱"]||0;
  const km=vc["景之中"]||0;
  const ks=vc["景之強"]||0;
  const kOld=vc["景之"]||0;

  const kt=kw+km+ks+kOld;
  const vt=mt+ft+kt;


  document.getElementById("male-count").textContent=
    `${mt} (${pct(mt,vt)}%)`;

  document.getElementById("female-count").textContent=
    `${ft} (${pct(ft,vt)}%)`;

  document.getElementById("kage-count").textContent=
    `${kt} (${pct(kt,vt)}%)`;


  document.getElementById("male-bar").style.width=
    (vt?mt/vt*100:0)+"%";

  document.getElementById("female-bar").style.width=
    (vt?ft/vt*100:0)+"%";

  document.getElementById("kage-bar").style.width=
    (vt?kt/vt*100:0)+"%";


  const cc=data.characters;

  const cm=cc["男性"]||0;
  const cf=cc["女性"]||0;
  const cmi=cc["美馬"]||0;
  const ct=cm+cf+cmi;


  document.getElementById("cmale-count").textContent=
    `${cm} (${pct(cm,ct)}%)`;

  document.getElementById("cfemale-count").textContent=
    `${cf} (${pct(cf,ct)}%)`;

  document.getElementById("cmima-count").textContent=
    `${cmi} (${pct(cmi,ct)}%)`;


  document.getElementById("cmale-bar").style.width=
    (ct?cm/ct*100:0)+"%";

  document.getElementById("cfemale-bar").style.width=
    (ct?cf/ct*100:0)+"%";

  document.getElementById("cmima-bar").style.width=
    (ct?cmi/ct*100:0)+"%";


  // 履歴
  document.getElementById("cz-table").innerHTML=
    data.history.map((x,n)=>`
      <tr>
        <td>${n+1}</td>
        <td>${esc(x.g)}</td>
        <td>①</td>
        <td>${esc(x.trigger)}</td>
        <td>${esc(x.type)}</td>
        <td>${esc(x.st)}</td>
        <td>${
          x.points===undefined||
          x.points===""||
          x.points==="-"?
            "-":
            esc(x.points)+" pt"
        }</td>
        <td>
          <button onclick="removeHistory(${n})">
            削除
          </button>
        </td>
      </tr>
    `).join("");


  // 規定ptの見出し
  const mh=
    document.querySelector("#cz-table")
    ?.closest("table")
    ?.querySelector("thead tr");


  if(mh && !mh.querySelector(".points-head")){

    const th=document.createElement("th");

    th.className="points-head";
    th.textContent="規定pt";

    mh.insertBefore(
      th,
      mh.lastElementChild
    );
  }
}


// 「CZ詳細」セクションを画面から削除
function removeCZDetail(){

  document.querySelectorAll(".card").forEach(card=>{

    const title=
      card.querySelector(".section-title");

    if(
      title &&
      title.textContent.trim()==="CZ詳細"
    ){
      card.remove();
    }

  });
}


function esc(x){

  return String(x).replace(
    /[&<>"']/g,
    c=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[c])
  );
}


// 初期表示
removeCZDetail();
render();
