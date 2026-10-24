# Laravel → Express

| Laravel | Express |
|---|---|
| Route::get | router.get |
| Controller method | controller export handler |
| Middleware handle | (req,res,next) |
| Request | req.params / req.query / req.body |
| response()->json | res.status(...).json(...) |
| FormRequest validation | service validation ném HttpError |
| .env/config | --env-file=.env / process.env |

Laravel tích hợp nhiều thành phần, Express nhỏ và phải chọn thư viện. HTTP method/status, REST, authorization không đổi. Express 5 chuyển reject của async handler vào error middleware.
