FROM node:14.17.5-alpine AS base
WORKDIR /app
COPY . /app/
RUN npm install --only=prod
RUN npm run refresh-tmp
RUN npm install pm2 -g
ENV PM2_PUBLIC_KEY k022rk3wrkm78fd
ENV PM2_SECRET_KEY iu0pyq42agiphtu

EXPOSE 9999

ENTRYPOINT ["npm", "run"]
CMD [ "start-pm2" ]

# CMD [ "npm", "-n" "video-backend:docker-test-a", "--", "run", "start" ]
# CMD [ "npm", "--", "run", "start" ]