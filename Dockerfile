# FROM node:20.14.0-alpine
FROM node:20.14.0-bullseye-slim

# Install necessary packages for headless Chrome/Chromium
RUN apt-get update && apt-get install -y \
  chromium \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libatspi2.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgtk-3-0 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  wget \
  gnupg \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Set environment variables for Chromium
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROME_PATH=/usr/lib/chromium/

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./
##COPY development.env /usr/src/app/config/env/development.env

# Copy the entire project directory into the container
COPY . .

# Install application dependencies
RUN npm i --legacy-peer-deps

# Build the Next.js application
RUN npm run build

# Set the PORT environment variable
#ENV PORT=3000

# Expose the port that the application will run on
EXPOSE 10000

# Start the applications
CMD ["npm", "start"]

