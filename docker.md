## Docker Commands
1. Build image
<br><code>
docker build --tag hardy-ta-backend .
</code>
2. Build container from image
<br><code>
docker run --name ta-backend -d hardy-ta-backend
</code>
3. Get into bash docker
<br><code>
docker exec -it ta-backend bash
</code>