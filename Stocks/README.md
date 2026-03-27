# 📈 股票价格监控面板

实时查看港股、A 股和场内 ETF 的当前价格、涨跌幅，以及入场 / 出场价是否已命中。

**数据源**：腾讯行情接口（`qt.gtimg.cn`），无需申请 API Key。

---

## 🌐 在线使用（推荐）

部署到 GitHub Pages 后，直接在浏览器打开即可使用，无需安装任何软件。

👉 **[在线地址](https://<your-username>.github.io/<repo-name>/)**（部署后替换为你的实际地址）

### 功能
- ✅ 实时价格、涨跌幅监控（每 15 秒自动刷新）
- ✅ 入场价 / 出场价阈值提醒（命中行高亮）
- ✅ 在页面上直接添加 / 删除标的
- ✅ 名称留空时自动获取股票中文名
- ✅ 导入 / 导出监控列表（JSON 格式，方便多设备同步）
- ✅ 纯前端运行，数据存储在浏览器 localStorage

### 如何部署到 GitHub Pages

1. Fork 或克隆本仓库
2. 进入仓库的 **Settings → Pages**
3. Source 选择 **Deploy from a branch**，分支选 `main`，目录选 `/ (root)`
4. 保存后等待几分钟，页面地址会显示在 Pages 设置页

---

## 💻 本地使用

如果你需要终端提醒和 macOS 系统通知功能，可以在本地运行完整版。

### 环境要求

- Python 3.8+
- macOS / Linux

### 1. 克隆并配置

```bash
git clone <your-repo-url>
cd <repo-name>
cp watchlist.example.json watchlist.json
```

### 2. 编辑 watchlist.json

```json
{
  "symbol": "00700",
  "market": "HK",
  "name": "",
  "entry_price": 500,
  "exit_price": 540,
  "enabled": true
}
```

- **symbol**：证券代码
- **market**：`HK`（港股）或 `SH` / `SZ`（A 股）
- **name**：留空会自动获取中文名
- **entry_price**：入场价（跌到此值触发提醒）
- **exit_price**：出场价（涨到此值触发提醒）

### 3. 启动终端监控

```bash
bash start_monitor.sh
```

### 4. 启动网页面板（本地版）

```bash
bash start_dashboard.sh
```

浏览器打开 http://127.0.0.1:8765

---

## 📱 在线版 vs 本地版对比

| 功能 | 在线版 (index.html) | 本地版 (dashboard.html) |
|------|:---:|:---:|
| 实时价格监控 | ✅ | ✅ |
| 页面增删标的 | ✅ | ✅ |
| 导入/导出列表 | ✅ | ❌ |
| 终端提醒+响铃 | ❌ | ✅ |
| macOS 系统通知 | ❌ | ✅ |
| 提醒日志 | ❌ | ✅ |
| 需要 Python | ❌ | ✅ |
| 数据存储 | 浏览器 localStorage | watchlist.json 文件 |

---

## 项目结构

```
├── index.html            # 在线版面板（纯前端，可部署 GitHub Pages）
├── price_monitor.py      # 核心：行情抓取、阈值比较、提醒逻辑
├── dashboard_server.py   # 本地版面板后端
├── dashboard.html        # 本地版面板前端
├── start_monitor.sh      # 终端监控启动脚本
├── start_dashboard.sh    # 本地版面板启动脚本
├── watchlist.json        # 你的监控配置（不上传 Git）
├── watchlist.example.json# 示例配置
├── requirements.txt      # Python 依赖
└── .gitignore
```

---

## 适用场景

- ✅ 个人盯盘提醒
- ✅ 入场 / 止盈 / 止损价监控
- ✅ 港股 + A 股 + 场内 ETF 混合监控
- ❌ 不适合高频交易或自动下单
