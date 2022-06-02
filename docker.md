## Docker Commands
1. Build image
<br><code>
docker build --tag hardy-ta-backend .
</code>
2. Build container from image
<br><code>
docker run --name ta-backend -d hardy-ta-backend<br>
docker run -it --entrypoint /bin/bash --env-file .env ta-backend<br>
docker run --name ta-backend -d -p 9999:9999 --env-file .env ta-backend:latest
</code>
3. Get into bash docker
<br><code>
docker exec -it ta-backend bash
</code>

## PM2 package.json
  "start-pm2": "pm2 start npm -n NAME -- run start"