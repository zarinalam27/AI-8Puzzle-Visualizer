const $ = (id) => document.getElementById(id);

const defaultStart = [2,8,3,1,6,4,7,0,5];
const defaultGoal = [1,2,3,8,0,4,7,6,5];
let initialState = [...defaultStart];
let goalState = [...defaultGoal];
let solutionPath = [];
let searchResult = null;
let currentStep = 0;
let playTimer = null;

function keyOf(state) { return state.join(""); }
function sameState(a,b) { return keyOf(a) === keyOf(b); }
function parseRows(prefix) {
  const values = [];
  for (let i=0;i<3;i++) {
    const row = $(prefix+i).value.trim().split(/[\s,]+/).map(Number);
    if (row.length !== 3 || row.some(n => !Number.isInteger(n))) throw new Error(`${prefix === "start" ? "Initial" : "Goal"} row ${i+1} must contain exactly three numbers.`);
    values.push(...row);
  }
  const sorted = [...values].sort((a,b)=>a-b);
  if (sorted.join(",") !== "0,1,2,3,4,5,6,7,8") throw new Error(`${prefix === "start" ? "Initial" : "Goal"} state must contain every number from 0 to 8 exactly once. Use 0 for the blank.`);
  return values;
}
function readInputs() {
  const start = parseRows("start");
  const goal = parseRows("goal");
  if (!isSolvableRelative(start, goal)) throw new Error("This initial state cannot reach the selected goal state. Try a different puzzle.");
  return {start, goal};
}
function inversionCount(state) {
  const a = state.filter(n => n !== 0); let count = 0;
  for(let i=0;i<a.length;i++) for(let j=i+1;j<a.length;j++) if(a[i]>a[j]) count++;
  return count;
}
function isSolvableRelative(start, goal) {
  return inversionCount(start)%2 === inversionCount(goal)%2;
}
function renderBoard(container, state, goal=null) {
  container.innerHTML = "";
  state.forEach((n,i) => {
    const tile = document.createElement("div");
    tile.className = "tile" + (n===0 ? " blank" : "");
    if (goal && n!==0 && goal[i]===n) tile.classList.add("goal-match");
    tile.textContent = n===0 ? "" : n;
    tile.setAttribute("aria-label", n===0 ? "Blank tile" : `Tile ${n}`);
    container.appendChild(tile);
  });
}
function updatePreviews() {
  try {
    initialState = parseRows("start");
    goalState = parseRows("goal");
    renderBoard($("initialPreview"), initialState);
    renderBoard($("goalPreview"), goalState);
  } catch(e) {
    // Keep the last valid preview while the user is editing.
  }
}
function neighbors(state) {
  const zero = state.indexOf(0), r = Math.floor(zero/3), c = zero%3;
  const options = [];
  if(r>0) options.push({index:zero-3,move:"Up"});
  if(r<2) options.push({index:zero+3,move:"Down"});
  if(c>0) options.push({index:zero-1,move:"Left"});
  if(c<2) options.push({index:zero+1,move:"Right"});
  return options.map(o => {
    const next = [...state]; [next[zero],next[o.index]] = [next[o.index],next[zero]];
    return {state:next,move:o.move};
  });
}
// IDDLS implemented from scratch: repeat depth-limited DFS with limits 0, 1, 2, ...
function solveIDDLS(start, goal, maxLimit) {
  const startTime = performance.now();
  let totalGenerated = 1, totalExpanded = 0, maxDepthReached = 0;
  const iterations = [];
  let finalPath = null;
  for (let limit=0; limit<=maxLimit; limit++) {
    let iterationExpanded = 0, iterationGenerated = 0;
    const pathKeys = new Set([keyOf(start)]);
    const pathStates = [{state:[...start],depth:0,parent:null,move:"Start"}];
    const dfs = (state, depth) => {
      maxDepthReached = Math.max(maxDepthReached, depth);
      if (sameState(state,goal)) return pathStates.map(node => ({...node,state:[...node.state]}));
      if (depth >= limit) return null;
      iterationExpanded++; totalExpanded++;
      for (const child of neighbors(state)) {
        const key = keyOf(child.state);
        if (pathKeys.has(key)) continue;
        iterationGenerated++; totalGenerated++;
        pathKeys.add(key);
        pathStates.push({state:child.state,depth:depth+1,parent:keyOf(state),move:child.move});
        const found = dfs(child.state,depth+1);
        if(found) return found;
        pathStates.pop();
        pathKeys.delete(key);
      }
      return null;
    };
    const found = dfs(start,0);
    iterations.push({limit,expanded:iterationExpanded,generated:iterationGenerated,found:!!found});
    if(found) { finalPath=found; break; }
  }
  const endTime = performance.now();
  return {found:!!finalPath,path:finalPath||[],iterations,totalGenerated,totalExpanded,maxDepthReached,timeMs:endTime-startTime};
}
function showStatus(message, type="info") {
  const el=$("statusMessage"); el.className=`alert alert-${type} mt-3 mb-0 small`; el.textContent=message;
}
function renderIterations() {
  const list=$("iterationList"); list.innerHTML="";
  if(!searchResult || !searchResult.iterations.length) { list.innerHTML='<div class="empty-state">No iterations to display.</div>'; return; }
  searchResult.iterations.forEach(it => {
    const div=document.createElement("div"); div.className="iteration-item";
    div.innerHTML=`<strong>Depth limit ${it.limit}</strong><span class="tag">${it.expanded} expanded · ${it.generated} generated</span><span class="tag">${it.found?"Goal found":"Not found"}</span>`;
    list.appendChild(div);
  });
}
function renderPathList() {
  const list=$("pathList"); list.innerHTML="";
  $("pathCount").textContent=`${solutionPath.length} states`;
  if(!solutionPath.length) { list.innerHTML='<div class="empty-state">No solution path yet.</div>'; return; }
  solutionPath.forEach((node,index) => {
    const div=document.createElement("div"); div.className="path-item"+(index===currentStep?" active":"");
    const move=index===0?"Start":node.move;
    div.innerHTML=`<span><strong>Step ${index}</strong> <span class="text-secondary">· ${move}</span></span><span class="tag">Depth ${node.depth}</span>`;
    div.addEventListener("click",()=>{stopPlayback();currentStep=index;renderCurrentStep();});
    list.appendChild(div);
  });
}
function renderCurrentStep() {
  if(!solutionPath.length) {
    renderBoard($("currentBoard"),initialState,goalState);
    $("stepCounter").textContent="Step 0 / 0"; $("moveCaption").textContent="Run IDDLS to see the solution path.";
    $("previousBtn").disabled=true; $("nextBtn").disabled=true; $("playBtn").disabled=true; return;
  }
  const node=solutionPath[currentStep];
  renderBoard($("currentBoard"),node.state,goalState);
  $("stepCounter").textContent=`Step ${currentStep} / ${solutionPath.length-1}`;
  $("moveCaption").textContent=currentStep===0?"Initial state":`Move ${currentStep}: blank tile moved ${node.move.toLowerCase()}.`;
  $("previousBtn").disabled=currentStep===0;
  $("nextBtn").disabled=currentStep===solutionPath.length-1;
  $("playBtn").disabled=solutionPath.length<2;
  $("playBtn").textContent=playTimer?"Ⅱ Pause":(currentStep===solutionPath.length-1?"↻ Replay":"▶ Run");
  document.querySelectorAll(".path-item").forEach((el,i)=>el.classList.toggle("active",i===currentStep));
}
function updateSummary() {
  const r=searchResult;
  $("statDepth").textContent=r.found?r.iterations[r.iterations.length-1].limit:"—";
  $("statMoves").textContent=r.found?r.path.length-1:"—";
  $("statGenerated").textContent=r.totalGenerated;
  $("statExpanded").textContent=r.totalExpanded;
  $("sumStatus").textContent=r.found?"Found":"Not found";
  $("sumMoves").textContent=r.found?r.path.length-1:"—";
  $("sumGenerated").textContent=r.totalGenerated;
  $("sumExpanded").textContent=r.totalExpanded;
  $("sumDepth").textContent=r.maxDepthReached;
  $("sumTime").textContent=`${r.timeMs.toFixed(2)} ms`;
  $("sumCost").textContent=r.found?r.path.length-1:"—";
  $("sumMemory").textContent=`~${Math.round((r.totalGenerated*96)/1024)} KB`;
  $("resultTitle").textContent=r.found?"Solution found!":"No solution found within the selected limit";
  $("resultText").textContent=r.found?`IDDLS found a solution in ${r.path.length-1} moves after ${r.iterations.length} depth-limit iteration(s).`:"Increase the maximum depth limit or check the puzzle input.";
  $("resultBanner").style.borderColor=r.found?"#397a79":"#6a4b3a";
}
function stopPlayback() {
  if(playTimer) { clearInterval(playTimer); playTimer=null; }
  if(solutionPath.length) $("playBtn").textContent=currentStep===solutionPath.length-1?"↻ Replay":"▶ Run";
}

function drawCanvasChart() {
  const canvas = $("iterationCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0c1526"; ctx.fillRect(0, 0, w, h);
  if (!searchResult || !searchResult.iterations.length) {
    ctx.fillStyle = "#9aabc5"; ctx.font = "16px system-ui"; ctx.textAlign = "center";
    ctx.fillText("Run IDDLS to display iteration data", w/2, h/2);
    $("canvasNote").textContent = "Run IDDLS to draw the iteration chart."; return;
  }
  const data = searchResult.iterations, max = Math.max(1, ...data.map(d => d.expanded));
  const left = 42, right = 14, top = 20, bottom = 42;
  const chartW = w-left-right, chartH = h-top-bottom;
  ctx.strokeStyle = "#293750"; ctx.fillStyle = "#9aabc5"; ctx.font = "12px system-ui"; ctx.textAlign = "right";
  for (let i=0;i<=4;i++) { const y=top+chartH*i/4; ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(w-right,y);ctx.stroke();ctx.fillText(String(Math.round(max*(4-i)/4)),left-8,y+4); }
  const slot=chartW/data.length, barW=Math.min(34,slot*.55);
  data.forEach((d,i)=>{const bh=d.expanded/max*chartH;const x=left+i*slot+(slot-barW)/2;ctx.fillStyle="#6c8cff";ctx.fillRect(x,top+chartH-bh,barW,bh);ctx.fillStyle="#c6d2e6";ctx.textAlign="center";ctx.fillText(String(d.limit),x+barW/2,h-19);});
  ctx.save();ctx.translate(13,h/2);ctx.rotate(-Math.PI/2);ctx.textAlign="center";ctx.fillStyle="#9aabc5";ctx.fillText("Nodes expanded",0,0);ctx.restore();
  ctx.textAlign="center";ctx.fillStyle="#9aabc5";ctx.fillText("Depth limit",w/2,h-3);
  $("canvasNote").textContent = `Canvas API: ${data.length} depth-limit iterations visualized.`;
}
function drawD3Chart() {
  const host = $("d3Chart"); if (!host) return;
  if (!searchResult || !searchResult.iterations.length || typeof d3 === "undefined") {
    host.innerHTML = '<div class="empty-state">D3.js chart will appear after a successful search.</div>'; return;
  }
  const data = searchResult.iterations.map(d => ({limit:d.limit, expanded:d.expanded, generated:d.generated}));
  host.innerHTML = "";
  const width = 560, height = 280, margin = {top:18,right:15,bottom:42,left:48};
  const svg = d3.select(host).append("svg").attr("viewBox",`0 0 ${width} ${height}`).attr("role","img").attr("aria-label","Generated and expanded nodes by depth limit");
  const x = d3.scaleBand().domain(data.map(d=>String(d.limit))).range([margin.left,width-margin.right]).padding(.22);
  const y = d3.scaleLinear().domain([0,Math.max(1,d3.max(data,d=>Math.max(d.expanded,d.generated)))]).nice().range([height-margin.bottom,margin.top]);
  svg.append("g").attr("transform",`translate(0,${height-margin.bottom})`).call(d3.axisBottom(x));
  svg.append("g").attr("transform",`translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5));
  const sub = d3.scaleBand().domain(["expanded","generated"]).range([0,x.bandwidth()]).padding(.12);
  data.forEach(d=>["expanded","generated"].forEach(k=>svg.append("rect").attr("x",x(String(d.limit))+sub(k)).attr("y",y(d[k])).attr("width",sub.bandwidth()).attr("height",Math.max(0,y(0)-y(d[k]))).attr("fill",k==="expanded"?"#6c8cff":"#5de0d1").append("title").text(`Depth ${d.limit}: ${d[k]} ${k}`)));
  svg.append("text").attr("x",margin.left).attr("y",12).attr("fill","#9aabc5").attr("font-size",11).text("Nodes");
  const legend=svg.append("g").attr("transform",`translate(${width-180},10)`);
  [["expanded","#6c8cff"],["generated","#5de0d1"]].forEach((item,i)=>{legend.append("rect").attr("x",i*88).attr("y",0).attr("width",10).attr("height",10).attr("fill",item[1]);legend.append("text").attr("x",i*88+14).attr("y",9).attr("fill","#c6d2e6").attr("font-size",11).text(item[0]);});
}
function drawSolutionSvg() {
  const svg = document.getElementById("solutionSvg"); if (!svg) return;
  while(svg.firstChild) svg.removeChild(svg.firstChild);
  if (!solutionPath.length) { const t=document.createElementNS("http://www.w3.org/2000/svg","text");t.setAttribute("x","450");t.setAttribute("y","85");t.setAttribute("text-anchor","middle");t.setAttribute("fill","#9aabc5");t.textContent="Run IDDLS to display the solution path.";svg.appendChild(t);return; }
  const ns="http://www.w3.org/2000/svg", count=solutionPath.length, cell=22, gap=4, boardW=3*cell+2*gap, boardH=boardW, margin=20, groupW=Math.max(112,boardW+26), totalW=count*groupW+30;
  svg.setAttribute("viewBox",`0 0 ${Math.max(900,totalW)} 170`);
  function add(tag,attrs,parent=svg,textContent=null){const el=document.createElementNS(ns,tag);Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,v));if(textContent!==null)el.textContent=textContent;parent.appendChild(el);return el;}
  solutionPath.forEach((node,i)=>{
    const x=margin+i*groupW;
    if(i<count-1){const y=70;add("path",{d:`M ${x+boardW+6} ${y} l 15 0 m -5 -5 l 5 5 l -5 5`,class:"svg-arrow"});}
    add("text",{x:x+boardW/2,y:18,"text-anchor":"middle",class:"svg-step-label"},svg,`Step ${i}`);
    node.state.forEach((n,j)=>{const cx=x+(j%3)*(cell+gap),cy=28+Math.floor(j/3)*(cell+gap);let cls="svg-tile";if(n===0)cls+=" svg-tile-blank";else if(goalState[j]===n)cls+=" svg-tile-match";add("rect",{x:cx,y:cy,width:cell,height:cell,rx:4,class:cls});if(n!==0)add("text",{x:cx+cell/2,y:cy+cell/2+4,"text-anchor":"middle",class:"svg-number"},svg,String(n));});
    add("text",{x:x+boardW/2,y:125,"text-anchor":"middle",class:"svg-step-label"},svg,i===0?"Start":node.move);
  });
}
function renderOptionalVisuals() { drawCanvasChart(); drawD3Chart(); drawSolutionSvg(); }

function runSearch() {
  stopPlayback();
  try {
    const parsed=readInputs();
    initialState=parsed.start; goalState=parsed.goal;
    renderBoard($("initialPreview"),initialState); renderBoard($("goalPreview"),goalState);
    const limit=Number($("depthLimit").value);
    showStatus("Searching... IDDLS is increasing its depth limit one level at a time.","info");
    searchResult=solveIDDLS(initialState,goalState,limit);
    solutionPath=searchResult.path; currentStep=0;
    renderIterations(); renderPathList(); renderCurrentStep(); updateSummary(); renderOptionalVisuals();
    if(searchResult.found) showStatus(`Solution found in ${solutionPath.length-1} moves. Review the path using Next Step or Run.`,"success");
    else showStatus(`No solution found up to depth ${limit}. Try a higher maximum depth.`,"warning");
  } catch(e) { showStatus(e.message,"danger"); }
}
function setExample() {
  const starts=["2 8 3","1 6 4","7 0 5"], goals=["1 2 3","8 0 4","7 6 5"];
  starts.forEach((v,i)=>$("start"+i).value=v); goals.forEach((v,i)=>$("goal"+i).value=v);
  resetDisplay(); updatePreviews(); showStatus("Example puzzle loaded. Press Run IDDLS to solve it.","info");
}
function randomPuzzle() {
  let state=[...goalState];
  const steps=18+Math.floor(Math.random()*13);
  let previousKey="";
  for(let i=0;i<steps;i++) {
    let choices=neighbors(state).filter(n=>keyOf(n.state)!==previousKey);
    const chosen=choices[Math.floor(Math.random()*choices.length)];
    previousKey=keyOf(state); state=chosen.state;
  }
  state.forEach((n,i)=>$("start"+Math.floor(i/3)).value=""); // Clear rows before reconstructing.
  for(let r=0;r<3;r++) $("start"+r).value=state.slice(r*3,r*3+3).join(" ");
  updatePreviews(); resetDisplay(); showStatus("Random solvable puzzle generated by making legal moves from the goal state.","info");
}
function resetDisplay() {
  stopPlayback(); solutionPath=[]; searchResult=null; currentStep=0;
  renderBoard($("currentBoard"),initialState,goalState);
  $("iterationList").innerHTML='<div class="empty-state">Your depth-limit iterations will appear here after you run the solver.</div>';
  $("pathList").innerHTML='<div class="empty-state">No solution path yet.</div>'; $("pathCount").textContent="0 states";
  ["statDepth","statMoves","sumMoves","sumGenerated","sumExpanded","sumDepth","sumTime","sumCost","sumMemory"].forEach(id=>$(id).textContent="—");
  $("statGenerated").textContent="0"; $("statExpanded").textContent="0"; $("sumStatus").textContent="Not run";
  $("resultTitle").textContent="Waiting for a search"; $("resultText").textContent="Run IDDLS to calculate the solution statistics.";
  $("resultBanner").style.borderColor="var(--line)"; renderCurrentStep(); renderOptionalVisuals();
}
function stepNext() { if(currentStep<solutionPath.length-1){currentStep++;renderCurrentStep();renderPathList();} else stopPlayback(); }
function stepPrevious() { if(currentStep>0){currentStep--;renderCurrentStep();renderPathList();} }
function togglePlayback() {
  if(playTimer) { stopPlayback(); renderCurrentStep(); return; }
  if(!solutionPath.length) return;
  if(currentStep>=solutionPath.length-1) currentStep=0;
  renderCurrentStep();
  playTimer=setInterval(()=>{
    if(currentStep>=solutionPath.length-1){stopPlayback();renderCurrentStep();return;}
    currentStep++;renderCurrentStep();renderPathList();
  },Number($("speedSelect").value));
}
["start0","start1","start2","goal0","goal1","goal2"].forEach(id=>$(id).addEventListener("input",updatePreviews));
$("depthLimit").addEventListener("input",()=> $("depthValue").textContent=$("depthLimit").value);
$("solveBtn").addEventListener("click",runSearch);
$("randomBtn").addEventListener("click",randomPuzzle);
$("exampleBtn").addEventListener("click",setExample);
$("previousBtn").addEventListener("click",stepPrevious);
$("nextBtn").addEventListener("click",stepNext);
$("playBtn").addEventListener("click",togglePlayback);
$("resetBtn").addEventListener("click",()=>{resetDisplay();showStatus("Visualization reset. You can run the search again.","info");});
$("speedSelect").addEventListener("change",()=>{if(playTimer){stopPlayback();togglePlayback();}});
renderBoard($("initialPreview"),defaultStart); renderBoard($("goalPreview"),defaultGoal); renderBoard($("currentBoard"),defaultStart,defaultGoal);
renderOptionalVisuals();
