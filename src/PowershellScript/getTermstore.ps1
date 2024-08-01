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
    $TaxonomySession=[Microsoft.SharePoint.Client.Taxonomy.TaxonomySession]::GetTaxonomySession($Ctx) 
    $TermStore =$TaxonomySession.GetDefaultSiteCollectionTermStore()
    $Ctx.Load($TaxonomySession)
    $Ctx.Load($TermStore)
    $Ctx.ExecuteQuery()
 
    #Get all term groups   
    $TermGroups = $TermStore.Groups
    $Ctx.Load($TermGroups)
    $Ctx.ExecuteQuery()
 
    #Iterate through each term group
    Foreach($Group in $TermGroups)
    {

        If($Group.Name -eq "Global Data"){
                
            #TermStore Group Name
            Write-Output 'Group Name :' $Group 

            #Get all Term sets in the Term group
            $TermSets = $Group.TermSets
            $Ctx.Load($TermSets)
            $Ctx.ExecuteQuery()
 
            #Iterate through each termset
            Foreach($TermSet in $TermSets){
            #Term Set Name
            Write-Output 'Ter Set Name :' $TermSet 

            #Get all Terms from the term set
            $Terms = $TermSet.Terms
            $Ctx.Load($Terms)
            $Ctx.ExecuteQuery()
 
            #Iterate through each term
            Foreach($Term in $Terms)
            {
                 $TermData = new-object PSObject
                 $TermData | Add-member -membertype NoteProperty -name "Group" -Value $Group.Name
                 $TermData | Add-member -membertype NoteProperty -name "TermSet" -Value $Termset.Name
                 $TermData | Add-member -membertype NoteProperty -name "Term" -Value $Term.Name    
                 $ResultCollection += $TermData
            }
           }
        }
    }
    #export term store sharepoint online powershell
    $ResultCollection | Export-csv $ReportOutput -notypeinformation
 
    Write-host "Term Store Data Successfully Exported!" -ForegroundColor Green   
}
Catch {
    write-host -f Red "Error Exporting Termstore Data!" $_.Exception.Message
}