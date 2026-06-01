import { useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SCORE_CONFIG = {
  GREEN:  { color: "#22c55e", dimColor: "#16a34a33", borderColor: "#22c55e55", label: "Passes" },
  YELLOW: { color: "#eab308", dimColor: "#ca930433", borderColor: "#eab30855", label: "Minor Issue" },
  ORANGE: { color: "#f97316", dimColor: "#ea580c33", borderColor: "#f9731655", label: "Needs Revision" },
  RED:    { color: "#ef4444", dimColor: "#dc262633", borderColor: "#ef444455", label: "Unsatisfactory" },
};

const FAULT_LABELS = {
  F1:"Overly Broad / Likely a Duty", F2:"Overly Specific / Likely a Step",
  F3:"Likely a Skill, Not a Task",   F4:"Not Observable",
  F5:"Not Measurable",               F6:"Not Outcome-Based",
  F7:"Ambiguous / Unclear Scope",    F8:"Style / Consistency",
  F9:"Compound Statement",           F10:"Insufficient Precision",
};

const SCORE_ORDER = ["GREEN","YELLOW","ORANGE","RED"];

export default function Home() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setInput(ev.target.result);
    r.readAsText(f); e.target.value = "";
  };

  const evaluate = async () => {
    const lines = input.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) { setError("Enter at least one task statement."); return; }
    if (lines.length > 50) { setError("Please submit 50 or fewer tasks at a time."); return; }
    setError(""); setLoading(true); setResults([]); setExpanded(null); setFilter("ALL");
    try {
      const numbered = lines.map((l,i) => (i+1)+". "+l).join("\n");
      const res = await fetch("/api/evaluate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: numbered }),
      });
      const data = await res.json();
      const text = (data.content||[]).map(b=>b.text||"").join("");
      const clean = text.replace(/```json|```/g,"").trim();
      setResults(JSON.parse(clean));
    } catch { setError("Evaluation failed. Please try again."); }
    setLoading(false);
  };

  const counts = SCORE_ORDER.reduce((a,s)=>({...a,[s]:results.filter(r=>r.score===s).length}),{});
  const chartData = SCORE_ORDER.filter(s=>counts[s]>0).map(s=>({name:s,count:counts[s],color:SCORE_CONFIG[s].color}));
  const filtered = filter==="ALL" ? results : results.filter(r=>r.score===filter);

  return (
    <div style={{minHeight:"100vh",background:"#09090b",color:"#f4f4f5",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:"#111113",borderBottom:"1px solid #1f1f23",padding:"28px 36px 22px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:6}}>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {["#22c55e","#eab308","#f97316","#ef4444"].map(c=>(
                <div key={c} style={{width:28,height:5,background:c,borderRadius:3}}/>
              ))}
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.18em",color:"#52525b",textTransform:"uppercase"}}>FOCUS Learning</div>
              <h1 style={{margin:0,fontSize:24,fontWeight:800,color:"#fafafa",letterSpacing:"-0.02em",lineHeight:1.2}}>Task Statement Evaluator</h1>
            </div>
          </div>
          <p style={{margin:"10px 0 0 42px",color:"#71717a",fontSize:13,lineHeight:1.5}}>
            Evaluate task statements against the FOCUS Learning quality standard.
          </p>
        </div>
      </div>

      <div style={{maxWidth:860,margin:"0 auto",padding:"28px 36px"}}>
        <div style={{background:"#111113",border:"1px solid #27272a",borderRadius:12,padding:22,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"#71717a",textTransform:"uppercase"}}>Task Statements — one per line</span>
            <button onClick={()=>fileRef.current.click()} style={{fontSize:12,color:"#a1a1aa",background:"#1f1f23",border:"1px solid #3f3f46",borderRadius:6,padding:"5px 12px",cursor:"pointer"}}>
              Upload .txt / .csv
            </button>
            <input ref={fileRef} type="file" accept=".txt,.csv" style={{display:"none"}} onChange={handleFile}/>
          </div>
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter one task statement per line..."
            style={{width:"100%",minHeight:150,background:"#09090b",border:"1px solid #3f3f46",borderRadius:8,color:"#e4e4e7",fontSize:13.5,padding:"12px 14px",resize:"vertical",outline:"none",fontFamily:"inherit",lineHeight:1.65,boxSizing:"border-box"}}/>
          {error && <div style={{color:"#ef4444",fontSize:12.5,marginTop:8}}>{error}</div>}
          <div style={{display:"flex",gap:10,alignItems:"center",marginTop:14}}>
            <button onClick={evaluate} disabled={loading}
              style={{background:loading?"#1f1f23":"linear-gradient(135deg,#16a34a,#15803d)",color:loading?"#52525b":"#fff",border:"none",borderRadius:8,padding:"10px 26px",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer"}}>
              {loading ? "Evaluating..." : "Evaluate Tasks →"}
            </button>
            {(input||results.length>0) && (
              <button onClick={()=>{setInput("");setResults([]);setError("");setExpanded(null);setFilter("ALL");}}
                style={{fontSize:12.5,color:"#52525b",background:"none",border:"none",cursor:"pointer"}}>Clear all</button>
            )}
          </div>
        </div>

        {loading && <div style={{textAlign:"center",padding:"52px 0",color:"#52525b",fontSize:13}}>Analyzing task statements...</div>}

        {results.length>0 && !loading && (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:10,marginBottom:20}}>
              <div style={{background:"#111113",border:"1px solid #27272a",borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:26,fontWeight:800,color:"#fafafa"}}>{results.length}</div>
                <div style={{fontSize:10,color:"#52525b",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:3}}>Total</div>
              </div>
              {SCORE_ORDER.map(s=>{
                const cfg=SCORE_CONFIG[s];
                return (
                  <button key={s} onClick={()=>setFilter(filter===s?"ALL":s)}
                    style={{background:filter===s?cfg.dimColor:"#111113",border:"1px solid "+(filter===s?cfg.color:cfg.borderColor),borderRadius:10,padding:"14px 16px",cursor:"pointer",textAlign:"left"}}>
                    <div style={{fontSize:26,fontWeight:800,color:cfg.color}}>{counts[s]}</div>
                    <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:3}}>{cfg.label}</div>
                  </button>
                );
              })}
            </div>

            {chartData.length>1 && (
              <div style={{background:"#111113",border:"1px solid #27272a",borderRadius:12,padding:"18px 22px",marginBottom:20}}>
                <div style={{fontSize:10,fontWeight:700,color:"#52525b",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:14}}>Score Distribution</div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={chartData} barCategoryGap="45%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false}/>
                    <XAxis dataKey="name" tick={{fill:"#71717a",fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#71717a",fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false} width={24}/>
                    <Tooltip contentStyle={{background:"#18181b",border:"1px solid #3f3f46",borderRadius:8,color:"#fafafa",fontSize:12}} cursor={{fill:"#1f1f23"}}/>
                    <Bar dataKey="count" radius={[4,4,0,0]}>
                      {chartData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {filter!=="ALL" && (
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:12,color:"#71717a"}}>Showing:</span>
                <span style={{fontSize:12,fontWeight:700,color:SCORE_CONFIG[filter].color,background:SCORE_CONFIG[filter].dimColor,border:"1px solid "+SCORE_CONFIG[filter].borderColor,borderRadius:6,padding:"2px 10px"}}>{filter}</span>
                <button onClick={()=>setFilter("ALL")} style={{fontSize:11,color:"#52525b",background:"none",border:"none",cursor:"pointer"}}>× Show all</button>
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filtered.map((r,i)=>{
                const cfg=SCORE_CONFIG[r.score]||SCORE_CONFIG.RED;
                const isOpen=expanded===r.id+i;
                return (
                  <div key={i} style={{background:"#111113",border:"1px solid "+(isOpen?cfg.color+"88":cfg.borderColor),borderRadius:10,overflow:"hidden"}}>
                    <div onClick={()=>setExpanded(isOpen?null:r.id+i)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,minWidth:100}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:cfg.color,flexShrink:0}}/>
                        <span style={{fontSize:11,fontWeight:800,color:cfg.color}}>{r.score}</span>
                      </div>
                      <span style={{fontSize:11,color:"#3f3f46",fontWeight:600,minWidth:30}}>#{r.id}</span>
                      <span style={{flex:1,fontSize:13.5,color:"#d4d4d8",fontWeight:500}}>{r.task}</span>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end",maxWidth:180}}>
                        {(r.faults||[]).map(f=>(
                          <span key={f} style={{fontSize:10,fontWeight:700,background:cfg.dimColor,color:cfg.color,border:"1px solid "+cfg.borderColor,borderRadius:4,padding:"2px 6px"}}>{f}</span>
                        ))}
                      </div>
                      <span style={{color:"#3f3f46",fontSize:12}}>{isOpen?"▲":"▼"}</span>
                    </div>
                    {isOpen && (
                      <div style={{borderTop:"1px solid "+cfg.color+"22",padding:"14px 16px",background:cfg.dimColor+"66"}}>
                        {(r.faults||[]).length>0 && (
                          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                            {r.faults.map(f=>(
                              <span key={f} style={{fontSize:11.5,background:"#18181b",color:cfg.color,border:"1px solid "+cfg.borderColor,borderRadius:6,padding:"3px 10px",fontWeight:600}}>
                                {f} — {FAULT_LABELS[f]}
                              </span>
                            ))}
                          </div>
                        )}
                        <p style={{margin:0,fontSize:13.5,color:"#a1a1aa",lineHeight:1.65}}>{r.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{marginTop:20,padding:"14px 18px",background:"#111113",border:"1px solid #1f1f23",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"#52525b"}}>Pass rate (Green)</span>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:140,height:6,background:"#27272a",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:Math.round((counts.GREEN/results.length)*100)+"%",height:"100%",background:"#22c55e",borderRadius:3}}/>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:"#22c55e"}}>{Math.round((counts.GREEN/results.length)*100)}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}