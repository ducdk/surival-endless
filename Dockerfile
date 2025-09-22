FROM node:16-alpine

WORKDIR /usr/src/app

# Install serve
RUN npm install -g serve

# Copy frontend files
COPY . .

EXPOSE 8080

CMD ["serve", ".", "-l", "8080"]
