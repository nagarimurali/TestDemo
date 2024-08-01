#Load SharePoint CSOM Assemblies
Add-Type -Path "C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\16\ISAPI\Microsoft.SharePoint.Client.dll"
Add-Type -Path "C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\16\ISAPI\Microsoft.SharePoint.Client.Runtime.dll"
Add-Type -Path "C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\16\ISAPI\Microsoft.SharePoint.Client.Taxonomy.dll"
   
#Variables for Processing
$AdminURL = "https://dhruvwebstack-admin.sharepoint.com/"
$ReportOutput="D:\Gopi Avala\PowerShell\TermStoreData3.csv"
 
Try {
    #Get Credentials to connect
    $Cred = Get-Credential
    $Credentials = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($Cred.Username, $Cred.Password)
 
    #Setup the context
    $Ctx = New-Object Microsoft.SharePoint.Client.ClientContext($AdminURL)
    $Ctx.Credentials = $Credentials
 
    #Array to Hold Result - PSObjects
    $ResultCollection = @()
 
    #Get the term store
    $TaxonomySession = [Microsoft.SharePoint.Client.Taxonomy.TaxonomySession]::GetTaxonomySession($Ctx) 
    $TermStore = $TaxonomySession.GetDefaultSiteCollectionTermStore()
    $Ctx.Load($TaxonomySession)
    $Ctx.Load($TermStore)
    $Ctx.ExecuteQuery()
 
    #Get all term groups   
    $TermGroups = $TermStore.Groups
    $Ctx.Load($TermGroups)
    $Ctx.ExecuteQuery()

    #Recursive function to process terms
    function Process-Terms($Terms, $GroupName, $TermSetName) {
        foreach ($Term in $Terms) {
            $TermData = New-Object PSObject
            $TermData | Add-Member -MemberType NoteProperty -Name "Group" -Value $GroupName
            $TermData | Add-Member -MemberType NoteProperty -Name "TermSet" -Value $TermSetName
            $TermData | Add-Member -MemberType NoteProperty -Name "Term" -Value $Term.Name    
            $ResultCollection += $TermData

            # Load and process child terms
            $ChildTerms = $Term.Terms
            $Ctx.Load($ChildTerms)
            $Ctx.ExecuteQuery()
            if ($ChildTerms.Count -gt 0) {
                Process-Terms -Terms $ChildTerms -GroupName $GroupName -TermSetName $TermSetName
            }
        }
    }
 
    #Iterate through each term group
    foreach ($Group in $TermGroups) {
        if ($Group.Name -eq "Global Data") {
            # Get all Term sets in the Term group
            $TermSets = $Group.TermSets
            $Ctx.Load($TermSets)
            $Ctx.ExecuteQuery()
 
            # Iterate through each termset
            foreach ($TermSet in $TermSets) {
                # Get all Terms from the term set
                $Terms = $TermSet.Terms
                $Ctx.Load($Terms)
                $Ctx.ExecuteQuery()
 
                # Process terms and their children
                Process-Terms -Terms $Terms -GroupName $Group.Name -TermSetName $TermSet.Name
            }
        }
    }

    # Export term store data
    $ResultCollection | Export-Csv $ReportOutput -NoTypeInformation
    Write-Host "Term Store Data Successfully Exported!" -ForegroundColor Green
}
Catch {
    Write-Host -ForegroundColor Red "Error Exporting Termstore Data!" $_.Exception.Message
}
