const { app, BrowserWindow, Tray, Menu, clipboard, dialog, nativeImage } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8765;
const HOST = '127.0.0.1';

const PANEL_URL = `http://${HOST}:${PORT}/panel.html`;
const OVERLAY_URL = `http://${HOST}:${PORT}/overlay.html`;

const root = path.join(__dirname, 'app');

const clients = new Set();

let win, tray, server;


/* =========================================================
   FONTES DISPONÍVEIS - V1.1.0
   ========================================================= */

const allowedFonts = [
 'Arial',
 'Arial Black',
 'Verdana',
 'Tahoma',
 'Trebuchet MS',
 'Georgia',
 'Times New Roman',
 'Courier New',
 'Impact',
 'Segoe UI',
 'Calibri',
 'Cambria',
 'Consolas',
 'Franklin Gothic Medium',
 'Lucida Sans Unicode',
 'Palatino Linotype',
 'Century Gothic',
 'Gill Sans',
 'Rockwell',
 'Bahnschrift'
];


/* =========================================================
   ESTADO PADRÃO
   ========================================================= */

let state = {

 overlayStyle: 1,

 accentColor: '#ffffff',
 nameColor: '#ffffff',
 numberColor: '#ffffff',

 /* Fontes v1.1.0 */
 textFont: 'Arial',
 numberFont: 'Arial',

 bgOpacity: 88,

 showBorder: true,
 textOutline: true,

 showRoles: true,
 showRoleLabels: true,

 killerSide: 'A',

 showSet: true,

 championship: 'DBD CHAMPIONSHIP',

 /* Novos nomes padrão */
 teamA: 'TIME A',
 teamB: 'TIME B',

 scoreA: 0,
 scoreB: 0,

 currentSet: 1,

 a: {
  gen: 0,
  hook: 0,
  first: 0
 },

 b: {
  gen: 0,
  hook: 0,
  first: 0
 }

};


/* =========================================================
   TIPOS DE ARQUIVO
   ========================================================= */

const mime = {

 '.html': 'text/html; charset=utf-8',

 '.js': 'text/javascript; charset=utf-8',

 '.css': 'text/css; charset=utf-8',

 '.png': 'image/png',

 '.json': 'application/json'

};


/* =========================================================
   NORMALIZAÇÃO DO ESTADO
   ========================================================= */

function normalize(){

 state.championship =
 state.championship || 'DBD CHAMPIONSHIP';


 state.overlayStyle =
 Math.max(
  1,
  Math.min(
   24,
   +state.overlayStyle || 1
  )
 );


 /* CORES */

 for(const k of [
  'accentColor',
  'nameColor',
  'numberColor'
 ]){

  state[k] =
  /^#[0-9a-f]{6}$/i.test(state[k] || '')
  ? state[k]
  : '#ffffff';

 }


 /* FONTES - V1.1.0 */

 if(!allowedFonts.includes(state.textFont)){
  state.textFont = 'Arial';
 }

 if(!allowedFonts.includes(state.numberFont)){
  state.numberFont = 'Arial';
 }


 /* OPÇÕES */

 state.textOutline =
 state.textOutline !== false;

 state.showRoles =
 state.showRoles !== false;

 state.showRoleLabels =
 state.showRoleLabels !== false;

 state.showSet =
 state.showSet !== false;


 state.currentSet =
 Math.max(
  1,
  Math.min(
   9,
   +state.currentSet || 1
  )
 );


 state.killerSide =
 state.killerSide === 'B'
 ? 'B'
 : 'A';


 state.bgOpacity =
 Math.max(
  0,
  Math.min(
   100,
   +state.bgOpacity || 0
  )
 );


 state.showBorder =
 state.showBorder !== false;


 /* TAMANHO DA HUD */

 state.hudScale =
 Math.max(
  70,
  Math.min(
   140,
   +state.hudScale || 100
  )
 );


 /* POSIÇÃO VERTICAL */

 state.hudY =
 Math.max(
  20,
  Math.min(
   260,
   +state.hudY || 78
  )
 );


 /* CONTORNO */

 state.outlineSize =
 Math.max(
  0,
  Math.min(
   5,
   +state.outlineSize || 0
  )
 );


 /* SOMBRA */

 state.shadowSize =
 Math.max(
  0,
  Math.min(
   12,
   +state.shadowSize || 0
  )
 );


 /* POSIÇÕES DOS ELEMENTOS */

 for(const k of [

  'nameAX',
  'nameAY',

  'nameBX',
  'nameBY',

  'roleAX',
  'roleAY',

  'roleBX',
  'roleBY',

  'statsAX',
  'statsAY',

  'statsBX',
  'statsBY'

 ]){

  state[k] =
  Math.max(
   -220,
   Math.min(
    220,
    +state[k] || 0
   )
  );

 }


 /* CONTADORES */

 for(const side of ['a','b']){

  state[side] ||= {
   gen:0,
   hook:0,
   first:0
  };


  state[side].gen =
  Math.max(
   0,
   Math.min(
    5,
    +state[side].gen || 0
   )
  );


  state[side].hook =
  Math.max(
   0,
   Math.min(
    12,
    +state[side].hook || 0
   )
  );


  state[side].first =
  Math.max(
   0,
   Math.min(
    4,
    +state[side].first || 0
   )
  );

 }

}


/* =========================================================
   SERVIDOR LOCAL
   ========================================================= */

function startServer(){

 server = http.createServer((req,res)=>{


  /* EVENTOS EM TEMPO REAL */

  if(req.url === '/events'){

   res.writeHead(
    200,
    {
     'Content-Type':'text/event-stream',
     'Cache-Control':'no-cache',
     'Connection':'keep-alive'
    }
   );

   res.write(
    `data: ${JSON.stringify(state)}\n\n`
   );

   clients.add(res);

   req.on(
    'close',
    ()=>clients.delete(res)
   );

   return;

  }


  /* LER ESTADO */

  if(
   req.url === '/state' &&
   req.method === 'GET'
  ){

   res.writeHead(
    200,
    {
     'Content-Type':'application/json'
    }
   );

   return res.end(
    JSON.stringify(state)
   );

  }


  /* SALVAR ESTADO */

  if(
   req.url === '/state' &&
   req.method === 'POST'
  ){

   let body = '';


   req.on(
    'data',
    d => body += d
   );


   req.on(
    'end',
    ()=>{

     try{

      state = JSON.parse(body);

      normalize();


      /* ATUALIZA OVERLAY */

      for(const c of clients){

       c.write(
        `data: ${JSON.stringify(state)}\n\n`
       );

      }


      res.writeHead(204);

      res.end();

     }

     catch(e){

      res.writeHead(400);

      res.end('bad json');

     }

    }
   );

   return;

  }


  /* ARQUIVOS DO APP */

  let rel =
  req.url === '/'
  ? '/panel.html'
  : decodeURIComponent(
     req.url.split('?')[0]
    );


  let p =
  path.resolve(
   root,
   '.' + rel
  );


  if(
   !p.startsWith(
    path.resolve(root)
   )
  ){

   res.writeHead(403);

   return res.end();

  }


  fs.readFile(
   p,
   (e,d)=>{

    if(e){

     res.writeHead(404);

     res.end('Not found');

    }

    else{

     res.writeHead(
      200,
      {
       'Content-Type':
       mime[path.extname(p)] ||
       'application/octet-stream'
      }
     );

     res.end(d);

    }

   }
  );

 });


 return new Promise(
  (resolve,reject)=>{

   server.once(
    'error',
    reject
   );

   server.listen(
    PORT,
    HOST,
    resolve
   );

  }
 );

}


/* =========================================================
   JANELA DO PAINEL
   ========================================================= */

function createWindow(){

 win =
 new BrowserWindow({

  width:470,

  height:900,

  minWidth:410,

  minHeight:650,

  title:'DBD Tournament Overlay',

  autoHideMenuBar:true,

  webPreferences:{
   contextIsolation:true
  }

 });


 win.loadURL(
  PANEL_URL
 );


 win.on(
  'close',
  e=>{

   if(!app.isQuitting){

    e.preventDefault();

    win.hide();

   }

  }
 );

}


/* =========================================================
   ÍCONE DA BANDEJA
   ========================================================= */

function createTray(){

 const icon =
 nativeImage.createFromPath(
  path.join(
   __dirname,
   'icon.ico'
  )
 );


 tray =
 new Tray(icon);


 tray.setToolTip(
  'DBD Tournament Overlay'
 );


 tray.setContextMenu(

  Menu.buildFromTemplate([

   {
    label:'Abrir painel',

    click:()=>{
     win.show();
     win.focus();
    }
   },


   {
    label:'Copiar URL da Overlay',

    click:()=>{
     clipboard.writeText(
      OVERLAY_URL
     );
    }
   },


   {
    type:'separator'
   },


   {
    label:'Sair',

    click:()=>{

     app.isQuitting = true;

     app.quit();

    }
   }

  ])

 );


 tray.on(
  'double-click',
  ()=>{

   win.show();

   win.focus();

  }
 );

}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

const gotLock =
app.requestSingleInstanceLock();


if(!gotLock){

 app.quit();

}

else{


 app.on(
  'second-instance',
  ()=>{

   if(win){

    win.show();

    win.focus();

   }

  }
 );


 app.whenReady().then(

  async()=>{

   try{

    await startServer();

    createWindow();

    createTray();

   }

   catch(e){

    dialog.showErrorBox(

     'DBD Tournament Overlay',

     `Não foi possível iniciar em ${PANEL_URL}.\n\n${e.message}`

    );

    app.quit();

   }

  }

 );


 app.on(
  'window-all-closed',
  ()=>{}
 );


 app.on(
  'before-quit',
  ()=>{

   app.isQuitting = true;

   if(server){

    server.close();

   }

  }
 );

}
