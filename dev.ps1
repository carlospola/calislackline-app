Get-Content .env.local | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $p = $_ -split '=',2; Set-Item -Path "Env:$($p[0].Trim())" -Value ($p[1].Trim().Trim('"')) }
vercel dev --listen 3000
