# Source from 
FROM node:19-alpine
WORKDIR /app

# Copy the dependency requirements
COPY package*.json ./

# Clean-install the dependencies
RUN npm ci --omit=dev

# Copy the rest of the source
COPY . ./

ENTRYPOINT [ "node", "/app/app.js" ]