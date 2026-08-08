# syntax=docker/dockerfile:1

# Node 22 满足 engines (>=22.13.0)；基于 Debian，可用 apt 安装 Chromium 系统依赖。
FROM node:22-slim

ENV TZ=Asia/Shanghai \
    LANG=C.UTF-8 \
    DEBIAN_FRONTEND=noninteractive \
    # 固定浏览器安装路径，避免后续找不到。
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app

# 启用项目锁定的 pnpm（package.json 里 packageManager: pnpm@10.15.0）。
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

# 先拷依赖清单，命中 Docker 层缓存：只有 package.json/pnpm-lock.yaml 变了才重新装。
COPY cloudflare/chatgpt-screenshot/package.json cloudflare/chatgpt-screenshot/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 拷子项目源码并构建生产产物（dist/web 静态前端 + dist/server 服务端）。
COPY cloudflare/chatgpt-screenshot/ .
RUN pnpm build

# 安装 Chromium 及其全部系统依赖。
# --with-deps 会按当前 Debian 版本自动装齐所需的 apt 库，无需手写包名。
RUN pnpm exec playwright install --with-deps chromium

# 生产运行配置。Render 会注入 PORT；必须监听 0.0.0.0 才能被外部访问到。
ENV NODE_ENV=production \
    HOST=0.0.0.0

# express.static("dist/web") 相对工作目录解析，因此保持 WORKDIR=/app。
CMD ["node", "dist/server/index.js"]
