FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY assets ./assets
COPY brand ./brand
COPY .env.production ./.env.production
COPY index.html ./index.html
COPY robots.txt ./robots.txt
COPY script.js ./script.js
COPY server.js ./server.js
COPY site.webmanifest ./site.webmanifest
COPY sitemap.xml ./sitemap.xml
COPY styles.css ./styles.css

EXPOSE 3000

CMD ["node", "server.js"]
