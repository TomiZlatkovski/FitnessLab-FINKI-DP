FROM node:24-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY --chown=node:node . .
RUN mkdir -p /app/data /app/assets/coaches/uploads \
    && chown -R node:node /app/data /app/assets/coaches/uploads

COPY entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]

CMD ["npm", "start"]
