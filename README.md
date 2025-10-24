# SlotChain Frontend

React + Vite interface for the SlotChain scheduling dApp. This project provides wallet-aware booking flows, profile management, and integrations with the SlotChain smart contracts and NestJS backend.

## Tech Stack
- React 18 with TypeScript
- Vite 5 build tool
- Tailwind CSS for styling
- Wagmi + Viem for wallet and contract interactions
- Headless UI components

## Prerequisites
- Node.js 18 or newer (LTS recommended)
- npm 9+
- Access to the SlotChain backend API and deployed smart contracts

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (see below).
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The app runs on `http://localhost:5173` by default.

## Environment Variables
Create a `.env` file in the project root. These values should match your deployed contracts and services:

| Variable | Description |
| --- | --- |
| `VITE_SLOCTCHAIN_CONTRACT` | Address of the SlotChain smart contract. |
| `VITE_USDT_TOKEN_ADDRESS` | ERC-20 token address used for payments. |
| `VITE_BACKEND_API_URL` | Base URL of the SlotChain backend (e.g. `https://api.example.com`). |
| `VITE_FRONTEND_BASE_URL` | (Optional) Absolute base URL for generating booking links. Falls back to `window.location.origin` when omitted. |

> Note: Vite exposes variables prefixed with `VITE_` to the client bundle. Do not store secrets here.

## npm Scripts
- `npm run dev` – Start the Vite dev server with hot reloading.
- `npm run build` – Create a production build in `dist/`.
- `npm run preview` – Preview the production build locally.
- `npm run lint` – Run ESLint.
- `npm run typecheck` – Run the TypeScript compiler without emitting files.

## Integration Tips
- Ensure the backend CORS configuration allows the frontend origin (update `slotchain-backend/src/main.ts` if needed).
- Contract ABIs are stored in `contractABI`. Update them when contracts change.
- Booking links use `VITE_FRONTEND_BASE_URL` when set; configure this in Vercel or other hosting providers for accurate shareable URLs.

## Deployment
1. Build the project: `npm run build`.
2. Deploy the contents of the `dist/` folder to your host (Vercel, Netlify, static bucket, etc.).
3. Configure the environment variables in your hosting provider before deploying.
