FROM node:20-bookworm-slim

WORKDIR /workspace/mikunav

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 4173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4173"]
