# Student Management

A small student directory with a browser interface and a JSON API. It uses only Node.js built-ins, so local development and tests do not require downloading npm packages. Student records are kept in memory and reset when the server restarts.

## Run and test in VS Code

1. Open this folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Run:

   ```sh
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000).
5. In another terminal, run `npm test` to execute the automated tests.

The app supports listing, adding, and removing students. Its API is `GET /api/students`, `POST /api/students`, and `DELETE /api/students/:id`; `GET /health` is used by deployment health checks.

## Git and GitHub

Run these commands in the VS Code terminal to make a local Git repository and record the source:

```sh
git init
git add .
git status
git commit -m "Build student management application"
```

Create an empty repository on GitHub (do not add a README or license there), then connect and upload it. Replace the URL with the HTTPS URL shown by GitHub:

```sh
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/student-management.git
git push -u origin main
```

GitHub authentication is handled by Git Credential Manager or the browser sign-in flow; never put a password or token in the remote URL.

## Docker

With Docker Desktop running:

```sh
docker build -t student-management:latest .
docker run --rm -p 3000:3000 student-management:latest
```

Open [http://localhost:3000](http://localhost:3000). The image uses the official Node.js Alpine base image, so Docker needs network access the first time it pulls that base image.

## Jenkins

Create a Jenkins Pipeline job pointing at the GitHub repository and select **Pipeline script from SCM → Git**. Set the script path to `Jenkinsfile`. The Jenkins agent must have Node.js 24 and Docker installed and the Jenkins user must be allowed to run Docker. Each run executes `npm test` before building the image `student-management:latest`.

## Kubernetes

The manifests use a `NodePort` service on port `30080`. For a local Minikube cluster, first make the image available in Minikube's image store, then deploy:

```sh
docker build -t student-management:latest .
minikube image load student-management:latest
kubectl apply -f k8s/
kubectl rollout status deployment/student-management
minikube service student-management --url
```

Open the URL printed by the last command. For another Kubernetes cluster, push the image to a registry available to that cluster and update `image` in `k8s/deployment.yaml` to the full image name before applying the manifests. Remove the deployment and service with `kubectl delete -f k8s/`.

## Automated tests

`npm test` runs three tests using Node.js's built-in `node:test` framework: health-check behavior, student create/list/delete, and required-field validation. No testing framework or npm dependency needs to be installed.
