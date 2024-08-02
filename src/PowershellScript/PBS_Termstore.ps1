Write-Host "Importing from CSV..." -ForegroundColor Yellow

# Get the current script directory
$ScriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path

# Construct the path to the input file relative to the script directory
$inputFilePath = Join-Path $ScriptDirectory "InputData.csv"

# Construct the dynamic output file path relative to the script directory
$outputFilePath = Join-Path $ScriptDirectory ("Output_" + (Get-Date).ToString('dd_MMM_yyyy__HH_mm_ss') + ".csv")

# Read the input CSV file
$inputData = Import-Csv -Path $inputFilePath

# Initialize a hashtable to keep track of the counts
$countHashTable = @{}

# Calculate the counts for each code
foreach ($row in $inputData) {
    $codeParts = $row.Code -split '\.'
    $depth = $codeParts.Length
    $countHashTable[$row.Code] = $depth
}

# Display the counts in the console
Write-Host "Code counts:" -ForegroundColor Yellow
foreach ($key in $countHashTable.Keys) {
    Write-Host "$key = $($countHashTable[$key])" -ForegroundColor Black
}

# Identify the highest value and store it in a global variable
$global:highestValue = ($countHashTable.Values | Measure-Object -Maximum).Maximum

# Display the highest value in the console with a specific color (e.g., Cyan)
Write-Host "Highest value: $global:highestValue" -ForegroundColor Cyan

# Initialize an array to store the processed output data
$outputData = @()

# Initialize a hashtable to keep track of the current hierarchy
$currentHierarchy = @{}

# Process the input data
foreach ($row in $inputData) {
    $codeParts = $row.Code -split '\.'

    # Reset the current hierarchy
    $currentHierarchy.Clear()

    # Build the current hierarchy dynamically
    for ($i = 0; $i -lt $codeParts.Length; $i++) {
        $code = -join ($codeParts[0..$i] -join ".")
        $currentHierarchy["Level$i"] = $inputData | Where-Object { $_.Code -eq $code } | Select-Object -ExpandProperty Name
    }

    # Create the output object dynamically based on the highest value
    $outputObject = New-Object PSObject
    $outputObject | Add-Member -MemberType NoteProperty -Name "Term Set Name" -Value $currentHierarchy["Level0"]

    for ($j = 1; $j -le $global:highestValue; $j++) {
        $levelKey = "Level$j Term"
        if ($currentHierarchy.ContainsKey("Level$j")) {
            $outputObject | Add-Member -MemberType NoteProperty -Name $levelKey -Value $currentHierarchy["Level$j"]
        } else {
            $outputObject | Add-Member -MemberType NoteProperty -Name $levelKey -Value ""
        }
    }

    # Add the output object to the output data array
    $outputData += $outputObject
}

# Filter out empty rows where "Term" is empty and "Level 1 Term" is not
$outputData = $outputData | Where-Object { -not ([string]::IsNullOrWhiteSpace($_.Term) -and -not [string]::IsNullOrWhiteSpace($_.{"Level 1 Term"})) }

# Export the processed data to a new CSV file
$outputData | Export-Csv -Path $outputFilePath -NoTypeInformation

Write-Host "Processing completed. Output saved to $outputFilePath" -ForegroundColor Green
