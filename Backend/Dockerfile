FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./

RUN apt-get update \
    && apt-get install -y python3 python3-pip make g++ \
    && rm -rf /var/lib/apt/lists/*

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]