# 迁移到 EdgeOne：GitHub 自动部署

项目继续使用现有 Supabase；不用迁移数据库、重新运行建库 SQL 或重新导入已同步的数据。当前项目已完成控制台连接；其他项目首次部署时仍需完成以下连接步骤，新增配置文件本身不会创建线上项目。

## 当前项目状态（2026-10-03）

- EdgeOne 项目：`phd-tracker`，项目 ID：`makers-pveg9b4p50mo`。
- GitHub `main` 已连接自动部署，提交 `41c7574` 的生产部署 `dprc32qiou1e` 已成功。
- 项目入口：<https://phd-tracker-hbssmizy.edgeone.dev/>，域名管理显示「已生效」，已验证登录页面加载。
- `https://phd-tracker-dprc32qiou1e.edgeone.dev/` 是对应单次部署的链接，日常访问和 Supabase 回跳配置使用上方项目入口。
- 使用者已确认数据验证成功，并完成 Supabase Site URL 与 Redirect URLs 配置。以下首次连接步骤供复现部署时参考。

## 首次连接

1. 将包含 `edgeone.json` 和 `scripts/check-cloud-env.mjs` 的最新代码提交并推送至 GitHub。
2. 登录 [EdgeOne Pages 控制台](https://console.cloud.tencent.com/edgeone/pages)，选择导入 Git 仓库。平台部分界面可能使用 Makers 名称。
3. 关联 GitHub，只授权所需的 `YileiYolanda/PhD-tracker` 仓库；选择生产分支 `main`。
4. 选择「全球可用区（不含中国大陆）」；如界面出现套餐或付费选项，先确认费用再开通。本指南不承诺平台免费额度或默认域名永久有效。
5. 使用下列构建配置。根目录为仓库根目录；`edgeone.json` 已声明安装命令、构建命令、输出目录及单页应用路由回退。

| 项目 | 设置 |
| --- | --- |
| 框架 | Vite（未识别时手动选择） |
| 根目录 | 仓库根目录，通常留空或填 `./` |
| 安装命令 | `npm ci` |
| 构建命令 | `npm run build:cloud` |
| 输出目录 | `dist` |
| Node.js | 22.18 或更高的 22.x，或 24.x |

平台文档中部分旧示例为 Node 22.11，低于本项目 Vite 的要求，不能直接照用。如果控制台只提供旧版本，请先解决构建环境版本再发布。

6. 在平台的生产构建环境变量中填写与本机 `.env.local` 相同的两项：

```dotenv
VITE_SUPABASE_URL=现有Supabase项目的HTTPS地址
VITE_SUPABASE_PUBLISHABLE_KEY=现有项目的publishable或anon公钥
```

`.env.local` 被 Git 忽略，不会通过 GitHub 自动传到平台。不要提交该文件，也不要在前端填入 secret/service_role 密钥。`build:cloud` 会在缺少配置、URL 无效或密钥类型不正确时中止构建，避免误发布为本机模式；它不验证网络连通性。

7. 创建部署，等待成功。记录平台实际提供的访问地址，并查看域名管理中是否需要绑定自己的域名、默认域名是否有时效或访问限制。

## Supabase 与上线验证

在 Supabase Authentication → URL Configuration 中，将 Site URL 设置为新站点的 HTTPS 地址，把新地址加入 Redirect URLs，并保留仍需使用的本地开发地址。

验证以下事项：

- 新网址显示登录界面，登录原账号后能读取已导入的申请数据。
- 「已与云端同步」正常显示；两台设备修改后能看到更新。
- 直接打开或刷新 `/materials`、`/outreach`、`/recommenders` 等子页面不会返回 404。
- 顶部提醒中心正常；新域名的浏览器通知权限需要重新允许。
- 分别在中国大陆和新加坡实际网络测试页面加载、登录和数据同步。前端托管速度不代表 Supabase 连接速度。

确认完成后再把 README 的在线链接换成新网址。旧网站不会因本次迁移自动删除。

## 后续更新

确认 EdgeOne 已开启 Git 推送触发部署后，提交并推送到关联的 `main` 分支即可触发平台构建与发布。部署失败时先查看平台构建日志。更改环境变量后需重新部署；本地刷新页面不会更新线上构建。

本仓库采用平台原生 Git 集成，不需要另建 GitHub Actions 部署流程，也不需要把 EdgeOne 管理令牌写入仓库。

参考：[配置文件及 SPA 路由](https://pages.edgeone.ai/document/edgeone-json)、[构建说明](https://pages.edgeone.ai/document/build-guide)、[区域和域名](https://pages.edgeone.ai/document/domain-overview)。
