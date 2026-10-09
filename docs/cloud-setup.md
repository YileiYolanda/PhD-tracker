# 云端数据持久化配置

## 1. 创建 Supabase 项目

1. 打开 [Supabase 控制台](https://supabase.com/dashboard)，创建一个项目，选择适合使用地区的区域并保存数据库密码。
2. 在项目的 SQL Editor 中依次运行仓库的 `supabase/migrations/001_tracker.sql` 和 `supabase/migrations/002_trash.sql`（各运行一次）。它们创建数据库表、账号隔离权限、带版本检查的保存接口，以及防止旧客户端覆盖回收站的保护。已经运行过 001 的项目只运行 002。
3. 在项目 Connect 对话框或 Settings → API Keys 中复制项目 URL 和 publishable key（旧项目的 anon key 也可用）。
4. **不要把 secret key、service_role key 或数据库密码写入前端环境变量。** 前端公钥是公开的；数据隔离由数据库策略与保存函数中验证过的账号身份保证。

## 2. 配置应用

复制 `.env.example` 为项目根目录的 `.env.local`，填入：

```dotenv
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=你的publishable或anon公钥
```

运行 `npm install`、`npm run dev`。环境变量修改后需重启开发服务器。

发布时，在托管平台设置同名构建环境变量，再运行 `npm run build` 并发布 `dist`。Vite 会在构建时写入配置；仅修改已发布站点的运行环境不会生效。项目没有变更原有站点的部署配置，也不会自动更新旧在线链接。

## 3. 配置邮箱登录

在 Supabase Authentication 中启用 Email 登录，建议保留邮箱验证。URL Configuration 的 Site URL 填实际站点地址，Redirect URLs 添加实际站点和本地开发地址（例如 `http://localhost:5173`）。

在应用注册邮箱和密码，按邮件完成验证后登录。生产使用前按 Supabase 控制台要求配置邮件发送服务及限额。此版本支持注册、登录、自动续期和退出；自助找回密码暂未提供，可由项目管理员在 Supabase 中协助处理账号恢复。

参考：[React 登录接入](https://supabase.com/docs/guides/auth/quickstarts/react)、[数据库行级安全](https://supabase.com/docs/guides/database/postgres/row-level-security)。

## 4. 迁移现有数据

1. 在旧站点、旧浏览器先点击「导出备份」，保存 JSON 文件。
2. 新版本登录后，新账号默认从空数据开始，不自动上传示例数据。
3. 若是同一个站点来源和浏览器，顶部会检测到旧数据，可选择「导入旧数据」。原 `phd-tracker-storage` 保留不变。
4. 如果换了域名、端口或设备，通过侧栏「导入备份」选择 JSON 文件。
5. 导入和重置会替换当前账号的数据，影响其他设备。操作前可导出当前数据。
6. 等待显示「已与云端同步」，然后在另一台设备用同一账号登录验证。

## 同步与冲突规则

- 学校、材料、导师、文书、推荐人、面试一起存储为一个账号快照，避免跨模块只保存了一半。
- 编辑先写入按账号与浏览器标签页隔离的本机缓存，每 3 秒尝试上传和拉取；窗口重新获得焦点或网络恢复时立即尝试同步。后台标签页可能受浏览器计时器限制。
- 登录先拉取云端；首次使用且无法连接云端时不开放编辑。已经有缓存的标签页在网络故障时可继续编辑。
- 刷新同一个标签页可恢复待同步内容。关闭标签页后的未同步副本仍在本机保留，新标签页登录同一账号可下载恢复副本，再参考备份补回修改。清除浏览器数据会删除这些未上传副本。
- 两个设备基于同一个版本修改时，数据库只接受先提交的版本，另一个设备会显示冲突，不静默覆盖。当前版本采取整份快照冲突检测，即使改的是不同记录也需处理冲突。
- 冲突时点击「导出本机副本并载入云端」，确认下载文件后参考副本补回需要的修改。不会自动合并两份修改。完整导入本机备份会替换当前云端数据，请谨慎选择。
- 退出登录不删除该账号的待同步本机缓存。共用电脑请先确认同步成功，再清理站点数据。
- 未配置两项环境变量时保持本机模式，顶部明确提示，旧数据继续可用。

## 项目结构

```text
src/pages/                  九个业务页面
src/components/Layout.tsx   导航、导入导出和统计
src/components/CloudGate.tsx 登录、账号隔离、同步状态和数据迁移
src/stores/appStore.ts      现有业务操作和本机模式持久化
src/lib/supabase.ts         云客户端及环境配置
src/lib/syncEngine.ts       串行同步、缓存、版本冲突和失败恢复
src/lib/trackerData.ts      数据快照与导入校验
src/types/                 六类实体定义
src/data/seed.ts           本机模式示例数据
supabase/migrations/        数据库建表、权限和保存函数
tests/                     同步行为与数据库权限自动化测试
```

## 验证

本地运行 `npm test`、`npm run build`、`npm run lint`。

连接真实项目后再验收：

1. 账号 A 新增学校、文书及其他类型记录，等待同步成功；设备 B 登录 A，确认六类数据都能读取。
2. 在 B 修改或删除记录，A 保持页面打开，应在约 3 秒后看到更新。
3. A 断网编辑并刷新，确认缓存仍在；恢复网络后确认上传。如果 B 也修改，应提示冲突且保留两份数据。
4. 使用账号 B 登录，确认无法读取账号 A 的申请。也应直接调用数据库接口验证 B 查询 A 的 user_id 返回空；匿名读取或调用保存接口应失败。
5. 两设备同时保存同一版本，确认只一个请求成功，另一个返回空结果并显示冲突。

同步自动化测试使用模拟网络；数据库测试用 PGlite 内嵌 PostgreSQL 执行真实建库脚本，并模拟 Supabase 的账号身份来检查隔离权限和版本保护。这些不能替代真实 Supabase 的登录、权限、邮件与跨设备验收。主动提醒已加入，使用方式与运行限制见 README；提醒功能无需新增数据库表或再次运行建库 SQL。
