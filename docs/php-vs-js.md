# PHP → JS mapping

| Concept | PHP | JavaScript |
|---|---|---|
| Variable | `$x = 1;` | `let x = 1; const y = 2;` |
| Array | `$a = [1,2];` | `const a = [1,2];` |
| Associative data | `['name'=>'An']` | `({name:'An'})` |
| Function | `function sum($a,$b){return $a+$b;}` | `const sum=(a,b)=>a+b;` |
| Loop | `foreach($a as $v){echo $v;}` | `for(const v of a){console.log(v);}` |
| Condition | `if($x === 1){}` | `if(x === 1){}` |
| Class | `class User {public function hi(){return 'hi';}}` | `class User {hi(){return 'hi';}}` |
| Exception | `try {} catch(Throwable $e){}` | `try {} catch(e){}` |
| Module/import | `require 'a.php';` / Composer autoload | `export` / `import {x} from './a.js'` |
| Null handling | `$a['x'] ?? 'default'` | `a?.x ?? 'default'` |

`const` cấm gán lại binding, vẫn sửa property object. JS array khác object; tránh dùng `==` vì coercion. Arrow function bắt lexical `this`, PHP closure capture có `use`. JavaScript là ngôn ngữ, Node là runtime ngoài browser có filesystem/process; không có DOM mặc định.
