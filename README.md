# Image Resizer — iLoveIMG Replica

A React + Vite app that batch-resizes images in the browser and optionally uploads the results to Amazon S3. Uses AWS Amplify v6 for Auth (Cognito User Pools) and Storage (S3).

## Quickstart

```bash
npm install
npm run dev
```

> Make sure your Cognito User Pool has at least one user or allow sign-ups. S3 bucket must exist in region `ap-south-1` and the app client should allow SRP auth.

## Notes

- No deprecated `Storage.put` — we use Amplify v6's `uploadData` and `getUrl` APIs.
- If you need Hosted UI instead of username/password, you can swap `signIn` for `signInWithRedirect` and configure a domain + callback URLs.
