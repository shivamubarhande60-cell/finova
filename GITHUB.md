# Put FINOVA on GitHub (for your interview)

Download **FINOVA.zip** from this chat, unzip it. You should see a folder named `finova` with `README.md` and `src` inside.

## Option A — Git (best)

In a terminal, inside the unzipped `finova` folder:

```bash
git init
git add .
git commit -m "Initial commit: FINOVA finance OS"
```

Then on [github.com/new](https://github.com/new):

- Repository name: **finova**
- Public
- Do **not** add a README
- Create repository

Copy the commands GitHub shows under **push an existing repository**, like:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/finova.git
git push -u origin main
```

Your link: `https://github.com/<your-username>/finova`

## Option B — no Git

1. Open [github.com/new](https://github.com/new) → name **finova** → Public → create
2. Click **uploading an existing file**
3. Drag the **contents** of the unzipped folder (README, src, docs, package.json, …)
4. If GitHub says too many files, upload in 3 batches: `src`, then `docs` + README, then the rest
5. Commit message: `Initial commit: FINOVA finance OS`

**Do not** upload `node_modules` or a `.env` file. They are not in this zip.

## Resume

Project: FINOVA — personal finance OS  
GitHub: `https://github.com/<your-username>/finova`

Paste the resume line from [README.md](README.md). Demo script: [INTERVIEW.md](INTERVIEW.md).
