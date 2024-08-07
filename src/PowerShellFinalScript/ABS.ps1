# Display message about importing from CSV
Write-Host "Importing from CSV..." -ForegroundColor Yellow

# Get the current script directory
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path

# Construct the path to the input file relative to the script directory
$inputFilePath = Join-Path $scriptDirectory "InpudataABs.csv"

# Construct the dynamic output file path relative to the script directory
$outputFilePath = Join-Path $scriptDirectory ("Output_" + (Get-Date).ToString('dd_MMM_yyyy__HH_mm_ss') + ".csv")

# Read the input CSV file
$inputData = Import-Csv -Path $inputFilePath

# Create an array to hold the output data
$outputData = @()

# Define the Term Set Name, Term Set Description, and LCID
$termSetName = "ABS"
$termSetDescription = ""
$lcid = ""
$availableForTagging = "TRUE"

# Initialize a flag to track the first row
$isFirstRow = $true

# Process each row in the input data
foreach ($row in $inputData) {
    # Determine the Term Set Name value
    $currentTermSetName = if ($isFirstRow) { $termSetName } else { "" }

    # Create a new PSObject for each row with the required structure
    $outputRow = New-Object PSObject -Property @{
        "Term Set Name"        = $currentTermSetName
        "Term Set Description" = $termSetDescription
        "LCID"                 = $lcid
        "Available for Tagging"= $availableForTagging
        "Term Description"     = ""
        "Level 1 Term"         = "$($row.Name) ($($row.Code))"
    }
    # Add the new row to the output data array
    $outputData += $outputRow

    # Mark that the first row has been processed
    $isFirstRow = $false
}

# Export the output data to the output CSV file with the correct header order
$outputData | Select-Object "Term Set Name", "Term Set Description", "LCID", "Available for Tagging", "Term Description", "Level 1 Term" | Export-Csv -Path $outputFilePath -NoTypeInformation

Write-Host "Output file created at: $outputFilePath"
