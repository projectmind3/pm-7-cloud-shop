const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname, 'public');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

const MAX_BODY = 1024 * 1024;
const MERCARI_TIMEOUT_MS = 15000;

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function validateListing(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return '请求体必须是 JSON 对象';
  const { name, description, price, imageUrls } = body;
  if (typeof name !== 'string' || !name.trim()) return '商品名（name）为必填项';
  if (name.length > 40) return '商品名（name）最长 40 个字符';
  if (typeof description !== 'string' || !description.trim()) return '商品说明（description）为必填项';
  if (description.length > 1000) return '商品说明（description）最长 1000 个字符';
  if (typeof price !== 'number' || !Number.isInteger(price)) return '价格（price）必须是整数（日元）';
  if (price < 300 || price > 9999999) return '价格（price）必须在 300~9999999 日元之间';
  if (imageUrls !== undefined) {
    if (!Array.isArray(imageUrls)) return '图片地址（imageUrls）必须是数组';
    if (imageUrls.length > 10) return '图片地址（imageUrls）最多 10 个';
    for (const u of imageUrls) {
      let parsed;
      try { parsed = typeof u === 'string' ? new URL(u) : null; } catch (e) { parsed = null; }
      if (!parsed || parsed.protocol !== 'https:') return '图片地址（imageUrls）只接受 https 地址';
    }
  }
  return null;
}

// Sends the "create product" GraphQL request to メルカリShops using node's https module.
// NOTE: the real メルカリShops schema could not be verified here. All field/operation names
// below are assumptions and are centralized in this function so they can be adjusted later.
// payload: { name, description, price, stock, imageUrls, categoryId, shippingId }
// Resolves with the new product id; rejects with an Error whose message is a short, safe reason.
function createMercariProduct(payload) {
  return new Promise((resolve, reject) => {
    const token = process.env.MERCARI_SHOPS_API_TOKEN;
    const apiUrl = process.env.MERCARI_SHOPS_API_URL || 'https://api.mercari-shops.com/v1/graphql';
    let target;
    try { target = new URL(apiUrl); } catch (e) { return reject(new Error('接口地址配置无效')); }
    if (target.protocol !== 'https:') return reject(new Error('接口地址必须是 https'));

    // --- field mapping (adjust here) ---
    const query = 'mutation CreateProduct($input: ProductCreateInput!) {' +
      ' productCreate(input: $input) { product { id } errors { message } } }';
    const input = {
      name: payload.name,
      description: payload.description,
      price: payload.price,
      stock: payload.stock,
      imageUrls: payload.imageUrls,
      categoryId: payload.categoryId,
      shippingMethodId: payload.shippingId,
    };
    const data = JSON.stringify({ query, variables: { input } });
    // --- end field mapping ---

    const req = https.request({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || 443,
      path: target.pathname + target.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        Authorization: 'Bearer ' + token,
      },
    }, (r) => {
      const chunks = [];
      let size = 0;
      r.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY) { req.destroy(new Error('响应过大')); return; }
        chunks.push(c);
      });
      r.on('end', () => {
        let json;
        try { json = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) { json = null; }
        if (r.statusCode < 200 || r.statusCode >= 300) {
          return reject(new Error('HTTP ' + r.statusCode));
        }
        if (!json) return reject(new Error('响应格式无法识别'));
        const result = json.data && json.data.productCreate;
        const id = result && result.product && result.product.id;
        if (id) return resolve(String(id));
        const first = (json.errors && json.errors[0]) || (result && result.errors && result.errors[0]);
        const msg = first && typeof first.message === 'string' ? first.message.slice(0, 100) : '未返回商品ID';
        reject(new Error(msg));
      });
    });
    req.setTimeout(MERCARI_TIMEOUT_MS, () => req.destroy(new Error('请求超时')));
    req.on('error', (e) => reject(new Error(e && e.message ? String(e.message).slice(0, 100) : '请求失败')));
    req.end(data);
  });
}

function handleMercariListing(req, res) {
  const chunks = [];
  let size = 0;
  let tooLarge = false;
  req.on('data', (c) => {
    if (tooLarge) return;
    size += c.length;
    if (size > MAX_BODY) {
      tooLarge = true;
      res.setHeader('Connection', 'close');
      sendJson(res, 413, { ok: false, error: '请求体过大（最大 1MB）' });
      return;
    }
    chunks.push(c);
  });
  req.on('error', () => {});
  req.on('end', () => {
    if (tooLarge) return;
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) {
      return sendJson(res, 400, { ok: false, error: '请求体不是合法的 JSON' });
    }
    const problem = validateListing(body);
    if (problem) return sendJson(res, 400, { ok: false, error: problem });
    if (!process.env.MERCARI_SHOPS_API_TOKEN) {
      return sendJson(res, 503, { ok: false, error: '尚未配置メルカリShops接口密钥' });
    }
    const stock = parseInt(process.env.MERCARI_SHOPS_DEFAULT_STOCK, 10);
    createMercariProduct({
      name: body.name.trim(),
      description: body.description.trim(),
      price: body.price,
      stock: stock >= 0 ? stock : 1,
      imageUrls: body.imageUrls || [],
      categoryId: process.env.MERCARI_SHOPS_CATEGORY_ID,
      shippingId: process.env.MERCARI_SHOPS_SHIPPING_ID,
    }).then(
      (productId) => sendJson(res, 200, { ok: true, productId }),
      (err) => sendJson(res, 502, { ok: false, error: 'メルカリShops返回错误：' + err.message })
    );
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.split('?')[0] === '/api/mercari/listing') {
    return handleMercariListing(req, res);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed');
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    return send(res, 400, 'Bad Request');
  }
  if (pathname.includes('\0')) return send(res, 400, 'Bad Request');
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.resolve(PUBLIC_DIR, '.' + pathname);
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    return send(res, 403, 'Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, 'Not Found');
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).on('error', () => res.destroy()).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('云上小店 running at http://localhost:' + PORT);
});
