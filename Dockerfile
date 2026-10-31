FROM node:24-alpine

ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

COPY package.json server.js ./
COPY public ./public

USER node
EXPOSE 3000

CMD ["node", "server.js"]
