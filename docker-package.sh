docker build -t ghcr.io/ftomassetti/model-repository:latest docker/model-repository
docker build -t ghcr.io/ftomassetti/adminui:latest -f docker/adminui/Dockerfile .
echo $GHCR_TOKEN | docker login ghcr.io -u ftomassetti --password-stdin
docker push ghcr.io/ftomassetti/model-repository:latest
docker push ghcr.io/ftomassetti/adminui:latest