# Use a Debian-based Node.js image as the base
FROM node:18-bookworm-slim

# Set the working directory inside the container
WORKDIR /src

# The rest of your Dockerfile remains the same
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]