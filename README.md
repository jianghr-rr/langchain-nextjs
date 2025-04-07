# Langchain Next.js Chat Component

这是一个基于 Next.js 的聊天组件，支持 Markdown 格式的消息渲染，并使用 Langchain、Pinecone 和 Redis 处理文档和聊天数据。

## 功能特性

- 支持 Markdown 格式的消息渲染
- 使用 Pinecone 存储向量数据
- 使用 Redis 存储聊天历史
- 每次上传时清空当前命名空间的数据

## 安装

```bash
git clone https://github.com/jianghr-rr/langchain-nextjs.git
cd langchain-nextjs
pnpm install
```

## 运行
```bash
npm run start-qs
```

## 配置
```
OPENAI_API_KEY=xxx
OPENAI_API_BASE_URL=xxx
OPENAI_API_BASE=xxx
OPENAI_MODEL_NAME=xxx

OPENAI_CHAT_API_KEY=xxx
OPENAI_CHAT_API_BASE_URL=xxx
OPENAI_CHAT_API_BASE=xxx
OPENAI_CHAT_MODEL_NAME=xxx

PINECONE_API_KEY=xxx
PINECONE_ENVIRONMENT=xxx
PINECONE_HOST=xxx
PINECONE_INDEX_NAME=xxx

UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx

# 随意写
SESSION_SECRET=xxx
PASSWORD_SALT=xxx
MYSQL_HOST=xxx
MYSQL_POST=xxx
MYSQL_USER=xxx
MYSQL_PASSWORD=xxx
MYSQL_DATABASE=xxx
```