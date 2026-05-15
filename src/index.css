@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

:root {
  /* Neutral foundation — warm off-white, not clinical white */
  --bg: linear-gradient(180deg, #f4f6fb 0%, #eef2f9 45%, #f8fafc 100%);
  --surface:   #FAFAF7;
  --surface2:  #F0F0EB;
  --surface3:  #E8E8E2;
  --border:    #E2E2DA;
  --border2:   #CECEC4;

  /* Text — warm near-black */
  --text:      #1A1A18;
  --text2:     #3A3A36;
  --muted:     #72726A;
  --muted2:    #A0A098;

  /* Accent — sophisticated forest green instead of blue */
  --blue:      #2D6A4F;
  --blue-bg:   #EAF2EE;
  --blue-dim:  #B7D5C5;
  --blue-dark: #1B4332;
  --blue-mid:  #40916C;

  /* Semantic */
  --green:     #2D6A4F;
  --green-bg:  #EAF2EE;
  --green-dim: #B7D5C5;
  --red:       #C1121F;
  --red-bg:    #FFF0F1;
  --red-dim:   #F4B8BC;
  --amber:     #B5830A;
  --amber-bg:  #FDF6E3;
  --amber-dim: #F0D08A;
  --purple:    #6B46C1;
  --purple-bg: #F3EFF9;
  --purple-dim:#C4B5FD;
  --teal:      #0F7173;
  --teal-bg:   #E8F5F5;

  /* Structure */
  --nav-w:    220px;
  --bot-h:    60px;

  /* Refined shadows */
  --shadow-xs: 0 1px 2px rgba(26,26,24,.04);
  --shadow:    0 1px 4px rgba(26,26,24,.06), 0 4px 12px rgba(26,26,24,.04);
  --shadow-md: 0 4px 20px rgba(26,26,24,.09), 0 1px 4px rgba(26,26,24,.05);
  --shadow-lg: 0 16px 48px rgba(26,26,24,.14), 0 4px 16px rgba(26,26,24,.06);

  /* Radius — more rectangular, editorial feel */
  --r:    12px;
  --r-sm: 8px;
  --r-xs: 6px;

  --ease: cubic-bezier(.16,1,.3,1);
}

body.dark {
  --bg:      #0D0D0B;
  --surface: #131310;
  --surface2:#1A1A16;
  --surface3:#222220;
  --border:  #2A2A26;
  --border2: #38382E;
  --text:    #F5F5F0;
  --text2:   #E0E0D8;
  --muted:   #8A8A80;
  --muted2:  #4A4A42;
  color-scheme: dark;
}

html, body { height: 100%; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; background: var(--bg); color: var(--text); font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; background-attachment: fixed; }
#root { height: 100%; }

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

/* ── BUTTONS ── */
.btn { padding: 8px 16px; border-radius: var(--r-xs); font-size: 12px; font-weight: 500; cursor: pointer; border: none; font-family: 'Inter', sans-serif; transition: all .15s var(--ease); letter-spacing: .01em; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.btn-blue  { background: var(--blue); color: #fff; letter-spacing: .01em; }
.btn-blue:hover  { background: var(--blue-dark); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(45,106,79,.25); }
.btn-outline { background: var(--surface); color: var(--text2); border: 1px solid var(--border); box-shadow: var(--shadow-xs); }
.btn-outline:hover { background: var(--surface2); border-color: var(--border2); }
.btn-ghost { background: transparent; color: var(--muted); border: none; }
.btn-ghost:hover { color: var(--text2); background: var(--surface2); }
.btn-red   { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-dim); }
.btn-sm  { padding: 5px 10px; font-size: 11px; }
.btn-icon { width: 30px; height: 30px; padding: 0; justify-content: center; border-radius: var(--r-xs); font-size: 14px; }

/* ── BADGES ── */
.badge { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: .03em; }
.badge-win   { background: var(--green-dim); color: var(--blue-dark); }
.badge-loss  { background: var(--red-dim);   color: #7F1D1D; }
.badge-be    { background: var(--amber-dim); color: #78350F; }
.badge-long  { background: var(--green-bg);  color: var(--blue-dark); }
.badge-short { background: var(--red-bg);    color: #7F1D1D; }
.badge-aplus { background: #E0F2FE; color: #0C4A6E; }
.badge-a     { background: var(--green-dim); color: var(--blue-dark); }
.badge-b     { background: var(--amber-dim); color: #78350F; }
.badge-c     { background: var(--red-dim);   color: #7F1D1D; }

/* ── MONO NUMBERS ── */
.num    { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text2); font-variant-numeric: tabular-nums; }
.num-up { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--green); font-weight: 600; }
.num-dn { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--red); font-weight: 600; }

/* ── TABLES ── */
.tbl-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; box-shadow: var(--shadow); }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
thead tr { background: var(--surface2); }
th { padding: 9px 14px; text-align: left; font-size: 10px; font-weight: 600; color: var(--muted); letter-spacing: .08em; text-transform: uppercase; border-bottom: 1px solid var(--border); white-space: nowrap; }
tbody tr { border-bottom: 1px solid var(--border); transition: background .1s; }
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--surface2); }
td { padding: 10px 14px; vertical-align: middle; white-space: nowrap; color: var(--text2); }

/* ── FORMS ── */
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 10px; font-weight: 600; color: var(--muted); letter-spacing: .07em; text-transform: uppercase; }
.form-input { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xs); padding: 9px 12px; font-size: 13px; color: var(--text); font-family: 'Inter', sans-serif; outline: none; transition: border-color .15s, box-shadow .15s; width: 100%; }
.form-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(45,106,79,.1); }
textarea.form-input { resize: vertical; min-height: 72px; line-height: 1.6; }
select.form-input { cursor: pointer; }

/* ── STAT CARDS ── */
.stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 10px; margin-bottom: 28px; }
.sc { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 18px 20px; box-shadow: var(--shadow); position: relative; overflow: hidden; transition: box-shadow .2s var(--ease), transform .2s var(--ease); cursor: default; }
.sc:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.sc::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
.sc.blue::before   { background: var(--blue); }
.sc.green::before  { background: var(--green); }
.sc.red::before    { background: var(--red); }
.sc.amber::before  { background: var(--amber); }
.sc.purple::before { background: var(--purple); }
.sc-icon { width: 32px; height: 32px; border-radius: var(--r-xs); display: flex; align-items: center; justify-content: center; font-size: 15px; margin-bottom: 12px; }
.sc.blue .sc-icon   { background: var(--blue-bg); }
.sc.green .sc-icon  { background: var(--green-bg); }
.sc.red .sc-icon    { background: var(--red-bg); }
.sc.amber .sc-icon  { background: var(--amber-bg); }
.sc.purple .sc-icon { background: var(--purple-bg); }
.sc-label { font-size: 10px; font-weight: 600; color: var(--muted); letter-spacing: .07em; text-transform: uppercase; margin-bottom: 6px; }
.sc-val { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 600; line-height: 1; color: var(--text); margin-bottom: 5px; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.sc-val.up   { color: var(--green); }
.sc-val.down { color: var(--red); }
.sc-val.blue { color: var(--blue); }
.sc-sub { font-size: 11px; color: var(--muted2); font-weight: 400; }

/* ── CHART GRID ── */
.cg { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; margin-bottom: 28px; }
.breakdown-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 12px; margin-bottom: 20px; }

/* ── PAGE ── */
.page { padding: 28px; animation: fadeUp .2s var(--ease); }

/* ── ANIMATIONS ── */
@keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
@keyframes spin    { to { transform: rotate(360deg); } }
.spin  { animation: spin 1s linear infinite; }

/* ── TOAST ── */
.toast { position: fixed; bottom: calc(var(--bot-h) + 16px); left: 50%; transform: translateX(-50%) translateY(10px); background: var(--text); color: var(--bg); padding: 9px 18px; border-radius: 8px; font-size: 12px; font-weight: 500; z-index: 9999; opacity: 0; transition: all .2s var(--ease); pointer-events: none; white-space: nowrap; letter-spacing: .01em; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ── MODAL ── */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(6px); z-index: 200; display: flex; align-items: flex-end; justify-content: center; animation: fadeIn .15s ease; }
@media(min-width:600px) { .modal-backdrop { align-items: center; } }
.modal { background: var(--surface); border-radius: var(--r) var(--r) 0 0; padding: 24px; width: 100%; max-height: 92vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
@media(min-width:600px) { .modal { border-radius: var(--r); max-width: 600px; border: 1px solid var(--border); } }
.modal-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }

/* ── MOBILE ── */
@media(max-width:768px) {
  .sidebar { display: none !important; }
  .main { margin-left: 0 !important; padding-bottom: calc(var(--bot-h) + 12px); }
  .bot-nav { display: flex !important; }
  .page { padding: 14px; }
  .stat-grid { grid-template-columns: repeat(2,1fr); gap: 8px; }
  .sc-val { font-size: 18px; }
  .sc { padding: 13px 14px; }
  .cg { grid-template-columns: 1fr; }
  .breakdown-grid { grid-template-columns: 1fr; }
}
@media(max-width:400px) {
  .page { padding: 10px; }
  .sc-val { font-size: 16px; }
}


.sidebar,.tbl-card,.sc,.modal,.form-input,.btn-outline{backdrop-filter: blur(18px);}
.sc,.tbl-card,.modal{background: rgba(255,255,255,0.72)!important;border:1px solid rgba(255,255,255,0.8)!important;box-shadow:0 10px 30px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.85)!important;}
.sc::after,.tbl-card::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.02));pointer-events:none;}
.sc{border-radius:20px!important;overflow:hidden;}
.tbl-card{border-radius:22px!important;position:relative;}
.btn-blue{background:linear-gradient(135deg,#111827,#374151)!important;box-shadow:0 8px 20px rgba(17,24,39,0.18);}
.btn-blue:hover{transform:translateY(-2px) scale(1.01);}
.sc-val{font-size:24px;font-weight:700;letter-spacing:-0.04em;}
.sc-label,th{letter-spacing:.12em;}
.page::before{content:"";position:fixed;inset:-20%;background:radial-gradient(circle at top left,rgba(255,255,255,.9),transparent 35%),radial-gradient(circle at bottom right,rgba(226,232,240,.8),transparent 30%);pointer-events:none;z-index:-1;}
.recharts-cartesian-grid line{stroke:rgba(148,163,184,.15)!important;}
.recharts-line-curve{filter:drop-shadow(0 4px 10px rgba(59,130,246,.25));}
.recharts-tooltip-wrapper{border-radius:16px;overflow:hidden;}

canvas{background:linear-gradient(180deg,#ffffff,#f8fafc);border-radius:18px;padding:10px;}
.sc-icon{background:rgba(255,255,255,.9)!important;border:1px solid rgba(226,232,240,.9);font-size:11px;font-weight:800;letter-spacing:.08em;color:#334155;box-shadow:0 6px 18px rgba(15,23,42,.08);}
.cg > div{position:relative;overflow:hidden;}
.cg > div::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at top right,rgba(59,130,246,.08),transparent 35%);pointer-events:none;}

canvas{background:linear-gradient(180deg,#fff,#f8fafc);border-radius:18px;padding:10px;}
.sc-icon{background:rgba(255,255,255,.9)!important;border:1px solid rgba(226,232,240,.9);font-size:11px;font-weight:800;letter-spacing:.08em;color:#334155;box-shadow:0 6px 18px rgba(15,23,42,.08);}

/* ── MOBILE DASHBOARD ZOOM FIX ── */
@media(max-width:768px) {
  .dashboard-page {
    zoom: 0.9;
    -webkit-text-size-adjust: 100%;
  }
}
