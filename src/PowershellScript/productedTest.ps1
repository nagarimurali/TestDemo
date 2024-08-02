Write-Host "Importing CSV" -ForegroundColor Yellow
 
# Get the current script directory
$ScriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
 
# Construct the path to the input file relative to the script directory
$inputFilePath = Join-Path $ScriptDirectory "InputData.csv"
 
# Construct the dynamic output file path relative to the script directory
$outputFilePath = Join-Path $ScriptDirectory ("Output_" + (Get-Date).ToString('dd_MMM_yyyy__HH_mm_ss') + ".csv")
 
# Read the input CSV file
$inputData = Import-Csv -Path $inputFilePath
 
# Initialize an array to store the processed output data
$outputData = @()
 
# Initialize variables to keep track of the current term set and term
$currentTermSet = ""
$currentTerm = ""
 
# Process the input data
foreach ($row in $inputData) {
    $codeParts = $row.Code -split '\.'
 
    # Check the length of code parts to determine the level
    switch ($codeParts.Length) {
        1 {
            $currentTermSet = $row.Name
            $currentTerm = ""
            $level1Term = ""
        }
        2 {
            $currentTermSet = $inputData | Where-Object { $_.Code -eq $codeParts[0] } | Select-Object -ExpandProperty Name
            $currentTerm = $row.Name
            $level1Term = ""
        }
        3 {
            $currentTermSet = $inputData | Where-Object { $_.Code -eq $codeParts[0] } | Select-Object -ExpandProperty Name
            $currentTerm = $inputData | Where-Object { $_.Code -eq "$($codeParts[0]).$($codeParts[1])" } | Select-Object -ExpandProperty Name
            $level1Term = $row.Name
        }
    }
 
    # Create the output object
    $outputObject = [pscustomobject]@{
        "Term Set Name" = $currentTermSet
        "Term" = $currentTerm
        "Level 1 Term" = $level1Term
    }
 
    # Add the output object to the output data array
    $outputData += $outputObject
}
 
# Filter out empty rows where "Term" is empty and "Level 1 Term" is not
$outputData = $outputData | Where-Object { -not ([string]::IsNullOrWhiteSpace($_.Term) -and -not [string]::IsNullOrWhiteSpace($_.{"Level 1 Term"})) }
 
# Export the processed data to a new CSV file
$outputData | Export-Csv -Path $outputFilePath -NoTypeInformation
 
Write-Output "Processing completed. Output saved to $outputFilePath"