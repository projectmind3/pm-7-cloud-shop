# pm-7-cloud-shop
ProjectMind: 云上小店

## メルカリShops上架

`POST /api/mercari/listing` 把商品信息创建到メルカリShops（仅限同源使用，不开放跨域）。

环境变量（只从环境变量读取，请勿写入代码或提交到仓库）：

- `MERCARI_SHOPS_API_TOKEN`：接口授权密钥（必填，未设置时接口返回 503）
- `MERCARI_SHOPS_API_URL`：接口地址，默认 `https://api.mercari-shops.com/v1/graphql`
- `MERCARI_SHOPS_CATEGORY_ID`：商品分类 ID
- `MERCARI_SHOPS_SHIPPING_ID`：配送方式 ID
- `MERCARI_SHOPS_DEFAULT_STOCK`：默认库存，默认 `1`

请求体（JSON，最大 1MB）：

- `name`：日语商品名，必填，最长 40 字符
- `description`：日语商品说明，必填，最长 1000 字符
- `price`：日元整数，必填，300~9999999
- `imageUrls`：可选，字符串数组，最多 10 个，仅接受 https 地址

示例：

```
curl -X POST http://localhost:3000/api/mercari/listing \
  -H "Content-Type: application/json" \
  -d '{"name":"サンプル商品","description":"商品の説明","price":1500}'
```

响应：成功 `200 {"ok":true,"productId":"..."}`；校验失败 `400`；体积超限 `413`；未配置密钥 `503`；メルカリ返回错误或超时 `502`，格式均为 `{"ok":false,"error":"..."}`。

注意：GraphQL 字段映射集中在 `server.js` 的 `createMercariProduct` 中，尚未对照真实接口验证，需要时请在该函数内调整。
