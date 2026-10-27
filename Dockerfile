FROM node:24-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY --chown=node:node . .
RUN mkdir -p /app/data /app/assets/coaches/uploads \
    && chown -R node:node /app/data /app/assets/coaches/uploads

USER node
EXPOSE 3000

CMD ["npm", "start"]
