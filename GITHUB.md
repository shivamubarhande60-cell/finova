# Publish FINOVA on GitHub

Create an empty repository on [GitHub](https://github.com/new). From the project root, run:

```bash
git init
git add .
git commit -m "Add FINOVA finance dashboard"
git branch -M main
```

Copy the repository's HTTPS URL from GitHub. In PowerShell, add it as the remote and push:

```powershell
$repoUrl = Read-Host "Paste the GitHub repository HTTPS URL"
git remote add origin $repoUrl
git push -u origin main
```

If this project already has a Git remote, keep using that remote instead of adding another one.

Do not commit `.env`, provider keys, database credentials, or `node_modules`. The repository includes `.env.example` as a list of required configuration names.

For setup instructions, see [README.md](README.md). For a product walkthrough, see [INTERVIEW.md](INTERVIEW.md).
