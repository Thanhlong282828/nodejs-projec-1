import {spawnSync} from 'node:child_process';import {readFileSync} from 'node:fs';
// Cấp riêng hai DB/users trên MySQL Docker của project; không sửa MySQL Herd hoặc project khác.
const r=spawnSync('docker',['compose','exec','-T','mysql','mysql','-uroot','-plocal-root-week7-only'],{input:readFileSync(new URL('../database/hrm-init.sql',import.meta.url)),encoding:'utf8'});if(r.status!==0){console.error(r.stderr);process.exit(1);}console.log('HRM databases/users ready');
