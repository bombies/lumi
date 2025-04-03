# Lumi

![Lumi Logo](./packages/frontend/public/web-app-manifest-192x192.png)

Lumi is a Progressive Web App (PWA) designed to enhance and personalize relationships through shared experiences. Originally built as a birthday gift, Lumi is now an open-source project that enables couples to stay connected through multimedia sharing, music interactions, affirmations, and more.

## 🚀 Motivation

In today's fast-paced world, it's easy to lose track of the small things that make relationships special—songs shared, movies watched, or little affirmations that bring joy. Lumi provides a dedicated space to cherish these moments, ensuring meaningful interactions stay at the forefront.

## ✨ Features

- **Moments** - A shared media hub for videos with tags for people, places, and events.
- **Music Sharing** - Share music recommendations with your partner (via Spotify).
- **Daily Affirmations** - Send and receive affirmations everyday.

## 🛠 Tech Stack

Lumi is built using the following technologies:

- **Bun** - A fast JavaScript runtime for efficient package management and development.
- **SST (Serverless Stack)** - Simplifies deploying serverless applications on AWS.
- **TypeScript** - Ensures type safety and maintainability.
- **AWS** - Powers Lumi's cloud infrastructure.
- **PostgreSQL** - Manages relational data storage.
- **Redis** - Used for caching and real-time features.

## 📦 Setup Guide

### Prerequisites

Ensure the following are set up on your machine before proceeding:

- AWS IAM credentials configured locally
- PostgreSQL database
- Redis cluster

### Installation

1. **Clone the repository**
    ```sh
    git clone https://github.com/bombies/lumi.git
    cd lumi
    ```
2. **Install dependencies**

    ```sh
    bun i
    ```

3. **Set up environment variables**

    - Copy the example secrets file for your stage (e.g., `dev`, `prod`, `staging`).
    - Rename it to `[stage].secrets.env`.

    ```sh
    cp [stage].secrets.env.example dev.secrets.env
    ```

    - Fill in the values from `[stage].secrets.env.example`.
    - Ensure **all** PostgreSQL keys exist (either with connection string or host/port setup):
        ```sh
        PostgresHost=
        PostgresDatabase=
        PostgresUsername=
        PostgresPassword=
        PostgresPort=
        PostgresConnectionString=CONNECTION_STRING_HERE
        ```

4. **Load secrets into SST**
    ```sh
    bunx sst secret load --stage <stage> <stage>.secrets.env
    ```

### 🔐 Generating Keys for CDN

1. **Generate private keys**
    ```sh
    openssl genrsa -out ./cdn-keys/<stage>.private_key.pem 2048
    ```
2. **Generate public keys**
    ```sh
    openssl rsa -in ./cdn-keys/<stage>.private_key.pem -out ./cdn-keys/<stage>.public_key.pem -outform PEM -pubout
    ```
3. **Configure AWS CloudFront**
    - Navigate to **AWS Management Console > CloudFront**.
    - Create a **Public Key** with the generated public key.
    - Create a **Key Group** and link it to the public key.
    - Ensure names follow this format:
        - **Public Key**: `lumi-<stage>-cdn-public-key`
        - **Key Group**: `lumi-<stage>-cdn-key-group`
    - Retrieve the IDs for these resources and update `infra/storage.ts`:
        ```ts
        contentCdnPublicKey = 'YOUR_PUBLIC_KEY_ID';
        contentCdnKeyGroup = 'YOUR_KEY_GROUP_ID';
        ```

### 🚀 Running Lumi Locally

Start the development environment:

```sh
bun run dev
```

To specify a custom stage:

```sh
bun run dev -- --stage <stage>
```

### 🌍 Deploying Lumi

To deploy to a specific stage, run:

```sh
bunx sst deploy --stage <stage>
```

And that's it! 🎉
