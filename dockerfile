FROM node:14.17.5 AS base
WORKDIR /app
COPY . /app/
RUN npm install
RUN npm run refresh-tmp
EXPOSE 7000 9999

ENTRYPOINT ["npm", "run"]
CMD [ "start" ]