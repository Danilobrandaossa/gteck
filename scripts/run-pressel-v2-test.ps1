$ErrorActionPreference = 'Stop'

param(
  [string]$SiteUrl = 'https://atlz.online',
  [string]$Username = 'pressel-bot',
  [string]$AppPassword,
  [string]$JsonPath = 'uploads/pressel-models/V1/modelo-teste.json'
)

if (-not $AppPassword) {
  Write-Host "Defina -AppPassword (Application Password do usuário do WP)" -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path $JsonPath)) {
  Write-Host "JSON não encontrado: $JsonPath" -ForegroundColor Red
  exit 1
}

Write-Host "▶ Preview" -ForegroundColor Cyan
Invoke-WebRequest -Method Post -Uri "$SiteUrl/wp-json/pressel-automation/v2/preview" `
  -Headers @{ 'Content-Type' = 'application/json' } `
  -Body (Get-Content $JsonPath -Raw) `
  -Authentication Basic -Credential (New-Object System.Management.Automation.PSCredential($Username,(ConvertTo-SecureString $AppPassword -AsPlainText -Force))) `
  -OutFile preview.json

$preview = Get-Content preview.json -Raw | ConvertFrom-Json
Write-Host ("  success={0} model={1} template={2} acf={3}" -f $preview.success,$preview.detected_model,$preview.template,$preview.acf_count)

Write-Host "▶ Publish" -ForegroundColor Cyan
Invoke-WebRequest -Method Post -Uri "$SiteUrl/wp-json/pressel-automation/v2/publish" `
  -Headers @{ 'Content-Type' = 'application/json' } `
  -Body (Get-Content $JsonPath -Raw) `
  -Authentication Basic -Credential (New-Object System.Management.Automation.PSCredential($Username,(ConvertTo-SecureString $AppPassword -AsPlainText -Force))) `
  -OutFile publish.json

$publish = Get-Content publish.json -Raw | ConvertFrom-Json
Write-Host ("  success={0} id={1} slug={2} template={3} update={4}" -f $publish.success,$publish.post_id,$publish.slug,$publish.template,$publish.is_update)

Write-Host "▶ Verify" -ForegroundColor Cyan
Invoke-WebRequest -Method Get -Uri "$SiteUrl/wp-json/pressel-automation/v2/verify?slug=$($publish.slug)" `
  -Authentication Basic -Credential (New-Object System.Management.Automation.PSCredential($Username,(ConvertTo-SecureString $AppPassword -AsPlainText -Force))) `
  -OutFile verify.json

$verify = Get-Content verify.json -Raw | ConvertFrom-Json
Write-Host ("  post_id={0} template={1} acf_keys={2}" -f $verify.post_id,$verify.template,($verify.acf_keys | Measure-Object).Count)

Write-Host "✔ Concluído. Arquivos: preview.json, publish.json, verify.json" -ForegroundColor Green



