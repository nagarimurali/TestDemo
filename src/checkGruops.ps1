# -----------------------
# CONFIGURATION
# -----------------------
$onPremSiteUrl = "http://your-onprem-site"  # <-- Update this
$targetSiteUrl = "https://yourtenant.sharepoint.com/sites/your-target-site"  # <-- Update this
$groupName = "JAC Department Head"

# -----------------------
# PNP MODULE FOR SPO
# -----------------------
if (-not (Get-Module -ListAvailable -Name "PnP.PowerShell")) {
    Write-Host "Installing PnP PowerShell module..." -ForegroundColor Yellow
    Install-Module -Name "PnP.PowerShell" -Force -Scope CurrentUser
}
Import-Module PnP.PowerShell

# -----------------------
# CONNECT TO SHAREPOINT ONLINE
# -----------------------
Write-Host "`n🔗 Connecting to SharePoint Online..." -ForegroundColor Cyan
Connect-PnPOnline -Url $targetSiteUrl -UseWebLogin

# Get SPO group members
try {
    $spoGroup = Get-PnPGroup -Identity $groupName
    $spoUsers = Get-PnPGroupMembers -Identity $groupName
    $spoUserLogins = $spoUsers.LoginName

    Write-Host "`n📋 Users in '$groupName' from SPO:" -ForegroundColor Green
    foreach ($user in $spoUsers) {
        Write-Host "• $($user.LoginName)"
    }
    Write-Host "✅ Total users in SPO group: $($spoUsers.Count)`n" -ForegroundColor Cyan
}
catch {
    Write-Error "❌ Could not retrieve users from SPO group: $_"
    exit
}

# -----------------------
# ON-PREM SP MODULE
# -----------------------
Write-Host "🔗 Connecting to On-Premises SharePoint..." -ForegroundColor Cyan
Add-PSSnapin Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue

try {
    $web = Get-SPWeb $onPremSiteUrl
    $onPremGroup = $web.SiteGroups[$groupName]
    $onPremUsers = $onPremGroup.Users | Select-Object -ExpandProperty LoginName

    Write-Host "`n📋 Users in '$groupName' from On-Prem:" -ForegroundColor Green
    foreach ($user in $onPremUsers) {
        Write-Host "• $user"
    }
    Write-Host "✅ Total users in On-Prem group: $($onPremUsers.Count)`n" -ForegroundColor Cyan
}
catch {
    Write-Error "❌ Could not retrieve users from On-Prem group: $_"
    exit
}

# -----------------------
# COMPARE AND SYNC USERS
# -----------------------
$missingUsers = $onPremUsers | Where-Object { $_ -notin $spoUserLogins }

if ($missingUsers.Count -eq 0) {
    Write-Host "✅ No missing users. The groups are already in sync." -ForegroundColor Green
} else {
    Write-Host "🔄 Syncing missing users to SPO group..." -ForegroundColor Yellow
    foreach ($user in $missingUsers) {
        try {
            Add-PnPGroupMember -Identity $groupName -User $user
            Write-Host "➕ Added: $user" -ForegroundColor Green
        } catch {
            Write-Warning "❌ Failed to add $user: $_"
        }
    }
    Write-Host "`n✅ Sync completed. Added $($missingUsers.Count) user(s)." -ForegroundColor Cyan
}
