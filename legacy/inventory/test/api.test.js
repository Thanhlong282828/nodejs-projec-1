import test from 'node:test';import assert from 'node:assert/strict';import {once} from 'node:events';
import {app} from '../src/app.js';import {db} from '../src/lib/db.js';
import {validate} from '../src/modules/products/service.js';
test('real MySQL API / authentication / authorization / validation',async()=>{
 const server=app.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
 const ids=[],suffix=`${Date.now()}-${Math.random()}`;let category;
 async function call(method,url,body,token){const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:r.status===204?null:await r.json()};}
 async function user(n){const email=`${n}-${suffix}@example.com`,password='StrongPass123!';const r=await call('POST','/api/register',{name:n,email,password,role:'admin'});assert.equal(r.status,201);assert.equal(r.body.data.role,'user');ids.push(r.body.data.id);const login=await call('POST','/api/login',{email,password});assert.equal(login.status,200);return {id:r.body.data.id,token:login.body.data.token,email};}
 try{
 assert.equal((await call('GET','/health')).status,200);
 assert.equal((await call('GET','/api/profile')).status,401);
 assert.equal((await call('GET','/api/profile',undefined,'invalid')).status,401);
 const a=await user('A'),b=await user('B');
 assert.equal((await call('GET','/api/profile',undefined,a.token)).body.data.id,a.id);
 assert.equal((await call('POST','/api/login',{email:a.email,password:'wrong'})).status,401);
 assert.equal((await call('POST','/api/register',{name:'A',email:a.email,password:'StrongPass123!'})).status,409);
assert.equal((await call('POST','/api/products',{},a.token)).status,403);
 await db.execute("UPDATE users SET role='admin' WHERE id=?",[a.id]);
 let r=await call('POST','/api/categories',{name:`Test-${suffix}`},a.token);assert.equal(r.status,201);category=r.body.data.id;
 assert.equal((await call('POST','/api/categories',{name:`Test-${suffix}`},a.token)).status,409);
 const body={name:`Book-${suffix}`,price:12.5,stock:3,category_id:category};
 assert.equal((await call('POST','/api/products',{...body,price:0},a.token)).status,422);
 assert.equal((await call('POST','/api/products',{...body,category_id:4294967295},a.token)).status,422);
 r=await call('POST','/api/products',body,a.token);assert.equal(r.status,201);const id=r.body.data.id;
 assert.equal((await call('GET',`/api/products/${id}`)).body.data.name,body.name);
 r=await call('GET',`/api/products?search=${encodeURIComponent(suffix)}&category_id=${category}&page=1`);assert.equal(r.body.data.pagination.total,1);
 assert.equal((await call('GET','/api/products?page=zero')).status,422);
 assert.equal((await call('PUT',`/api/products/${id}`,{...body,stock:8},a.token)).body.data.stock,8);
 for(let i=0;i<11;i++)await call('POST','/api/products',{...body,name:`Page-${suffix}-${i}`},a.token);
 const paged=await call('GET',`/api/products?category_id=${category}&page=2`);assert.equal(paged.body.data.items.length,2);assert.equal(paged.body.data.pagination.total,12);
 assert.equal((await call('DELETE',`/api/products/${id}`,undefined,a.token)).status,204);
 assert.equal((await call('GET',`/api/products/${id}`)).status,404);
 assert.throws(()=>validate({...body,stock:-1}));
 assert.equal((await call('GET','/api/no-route')).status,404);
 }finally{
if(category){await db.execute('DELETE FROM products WHERE category_id=?',[category]);await db.execute('DELETE FROM categories WHERE id=?',[category]);}
 if(ids.length)await db.execute(`DELETE FROM users WHERE id IN (${ids.map(()=>'?').join(',')})`,ids);
 await new Promise(resolve=>server.close(resolve));await db.end();
 }
});
