# Image Resizer — iLoveIMG Replica

A small React + Vite app for batch image resizing in the browser with optional cloud storage via AWS S3 (Amplify v6 for Auth + Storage).

The app resizes images client-side (OffscreenCanvas), creates a ZIP for download, and can save resized images to S3 under a per-user `resized/` prefix.

## 🚀 Features

- Batch resize images in-browser (OffscreenCanvas)
- Export as ZIP (client-side using JSZip + FileSaver)
- Save resized images to AWS S3 (Amplify v6 `uploadData` / `getUrl`)
- Authentication via AWS Cognito (Amplify Auth)
- Recent images viewer (lists signed URLs for user's private files)
- Simple, responsive UI (React + Tailwind + Vite)

## 🏗️ Project structure

```
iloveimg-resizer-clone/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── src/
│   ├── App.jsx                # Main app + upload/save logic
│   ├── main.jsx               # App bootstrap
│   ├── auth/
│   │   ├── auth.js            # Amplify auth helpers
│   │   └── authController.js  # Auth controller / hooks
│   ├── components/
│   │   ├── AuthModal.jsx      # Sign-in / Sign-up modal
│   │   ├── RecentImages.jsx   # Lists recent private images
│   │   └── AuthModal.html
│   └── lib/
│       ├── aws.js             # Amplify.configure() (region, bucket, prefixes)
│       └── storageHelper.js   # Helpers to list/get signed URLs
├── styles/
│   └── globals.css
└── README.md
```

## 🧩 Quickstart

1. Install dependencies

```powershell
npm install
```

2. Run in development

```powershell
npm run dev
```

3. Open the app (Vite will print the local URL, typically `http://localhost:5173`)

## ⚙️ AWS / Amplify setup (summary)

This project uses Amplify v6 programmatic APIs. The minimal AWS pieces you need:

- Cognito User Pool (for user authentication)
- An Identity Pool (if you use federated identities / unauthenticated access)
- S3 bucket for storage (the app expects a bucket name configured in `src/lib/aws.js`)

Steps (high level):

1. Create a Cognito User Pool and an App Client (SRP enabled if using username/password flows used here).
2. Create an S3 bucket (for example `img-resizer-app`) in the same region.
3. Configure your Identity Pool roles so authenticated users can put/get objects in the bucket (allow limited S3 access to the `private/` prefix).
4. Update `src/lib/aws.js` values (user pool IDs, client id, identity pool id, bucket name, region) — the project already contains a sample config you can adapt.

### Example S3 CORS configuration

Add this to your S3 bucket's CORS settings (Permissions → Cross-origin resource sharing (CORS)) to allow the app origin and localhost during development:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["HEAD", "GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://main.d14tfuf0x0ra68.amplifyapp.com", "http://localhost:5173", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

> Note: replace `https://main.d14tfuf0x0ra68.amplifyapp.com` with your deployed Amplify domain.

### Minimal IAM policy example (attach to the authenticated role)

Limit access to the bucket prefixes the app uses (private/ and protected/):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::img-resizer-app",
        "arn:aws:s3:::img-resizer-app/private/*",
        "arn:aws:s3:::img-resizer-app/protected/*",
        "arn:aws:s3:::img-resizer-app/public/*"
      ]
    }
  ]
}
```

Adjust `img-resizer-app` to match your bucket name.

## 📦 How 'Save to Cloud' works (implementation notes)

- When the user clicks "Save to Cloud", the app:
  - Resizes images client-side (OffscreenCanvas) and converts to a Blob
  - Builds a key using a per-user prefix: `resized/<username_or_email>/TIMESTAMP_random.ext`
  - Calls Amplify's `uploadData` with `level: 'private'` so the object is scoped to the authenticated user
  - Calls `getUrl` to get a temporary signed URL for display

- The `storageHelper.fetchUserPrivateFiles` helper lists the last N items and normalizes signed URL shapes from Amplify.

## 🐞 Troubleshooting — Network / CORS errors

- Symptom (browser console):

  - "Network Error" in Amplify XHR handler
  - Browser error: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present

- Cause: S3 bucket CORS or IAM permissions are not configured for the app origin.

- Fix checklist:
  1. Add the CORS configuration (see section above) to the S3 bucket and include your Amplify domain.
  2. Ensure the authenticated IAM role (Identity Pool) has permission to call S3 PutObject/GetObject on the bucket prefixes.
  3. If you use `public` prefix in the key, make sure the object ACL and bucket policy allow cross-origin access for that prefix.
  4. Sign out and sign back in after changing IAM/CORS so credentials and cached policies refresh.

If you still see an error, open DevTools → Network and inspect the failing OPTIONS / PUT request. The response headers must include `Access-Control-Allow-Origin` matching your frontend origin.

## 🔧 Local development / build

Start dev server:

```powershell
npm run dev
```

Build for production:

```powershell
npm run build
npm run preview
```

## ✅ Additional tips

- Add a `.gitattributes` with `* text=auto` to normalize LF/CRLF on Windows and avoid Git warnings.
- If you prefer SSH for Git pushes, switch remote to `git@github.com:skzaki/Image-resizer.git`.

## 📝 Notes

- This project uses Amplify v6 APIs (`uploadData`, `getUrl`) instead of older `Storage.put`/`Storage.get` signatures — check `src/lib/storageHelper.js` for helper usage and compatibility fallbacks.
- The sample AWS configuration lives in `src/lib/aws.js` — update it with your Cognito & bucket IDs before deploying.

---

## License

MIT
