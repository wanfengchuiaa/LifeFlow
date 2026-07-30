# LifeFlow

个人生活管理 PWA，包含健康、待办、财务、日程和运势模块。核心数据保存在浏览器 IndexedDB 中。

## 本地运行

```powershell
pnpm install
pnpm dev
```

## 运势接口

默认不访问网络，使用本地简化分析。需要在线数据时，在 `.env.local` 配置：

```env
VITE_FORTUNE_API_URL=/api/fortune
```

前端会以 `GET` 请求附带 `sign`、`birthDate`、`birthTime` 参数。代理可以返回以下任一 JSON 形状：

```json
{
  "summary": "...",
  "love": "...",
  "career": "...",
  "wealth": "...",
  "health": "..."
}
```

或将上述字段放在 `data` / `result` 对象下。不要把第三方 API 密钥写进 `VITE_*` 变量；生产环境应由服务器代理在线服务，浏览器只访问自己的代理地址。
