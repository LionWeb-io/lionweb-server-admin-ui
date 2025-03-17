# Use an official Node.js image as a base
FROM node:20 AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project source
COPY . .

# Build the Svelte app
RUN npm run setup
RUN npm install
RUN npm run build

# Use a smaller Node.js image for production
FROM node:20 AS runner

# Set working directory inside the container
WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.svelte-kit ./.svelte-kit
COPY --from=builder /app/static ./static
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/svelte.config.js ./svelte.config.js
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/vite.config.ts ./vite.config.ts

# Start the app
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]