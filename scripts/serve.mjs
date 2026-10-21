import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../index.html',import.meta.url));
const port=Number(process.argv[2]||4177);
if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');
const server=createServer((request,response)=>{
 const path=new URL(request.url,'http://localhost').pathname;
 if(request.method!=='GET'&&request.method!=='HEAD'){response.writeHead(405);response.end();return;}
 if(path==='/favicon.ico'){response.writeHead(204);response.end();return;}
 if(!['/','/index.html'].includes(path)){response.writeHead(404);response.end();return;}
 response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
 response.end(request.method==='HEAD'?undefined:html);
});
server.listen(port,'127.0.0.1',()=>console.log('Static preview: http://127.0.0.1:'+server.address().port));
process.on('SIGINT',()=>server.close());process.on('SIGTERM',()=>server.close());
