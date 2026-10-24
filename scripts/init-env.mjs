import {readFile,writeFile} from 'node:fs/promises';import {randomBytes} from 'node:crypto';
// Tạo cả hai .env với chung service key, không ghi đè file hiện có.
const read=path=>readFile(new URL(path,import.meta.url),'utf8');
let main;try{main=await read('../.env');}catch{main=(await read('../.env.example')).replace('GENERATE_WITH_NODE_CRYPTO',randomBytes(48).toString('hex')).replace('GENERATE_WITH_NODE_CRYPTO',randomBytes(32).toString('hex'));await writeFile(new URL('../.env',import.meta.url),main,{flag:'wx',mode:0o600});}
const key=main.split('\n').find(s=>s.startsWith('INTERNAL_KEY=')).slice('INTERNAL_KEY='.length);
try{await writeFile(new URL('../services/notifications/.env',import.meta.url),(await read('../services/notifications/.env.example')).replace('SAME_VALUE_AS_HRM_INTERNAL_KEY',key),{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;}console.log('Environment ready; existing values preserved');
