Write-Host "Importing from CSV..." -ForegroundColor Yellow

# Get the current script directory
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path

# Construct the path to the input file relative to the script directory
$inputFilePath = Join-Path $scriptDirectory "InputData.csv"

# Construct the dynamic output file path relative to the script directory
$outputFilePath = Join-Path $scriptDirectory ("Output_" + (Get-Date).ToString('dd_MMM_yyyy__HH_mm_ss') + ".csv")

# Read the input CSV file
$inputData = Import-Csv -Path $inputFilePath

# Initialize a hashtable to keep track of the counts
$codeCountHashtable = @{}

# Calculate the counts for each code
foreach ($row in $inputData) {
    $codeParts = $row.Code -split '\.'
    $depth = $codeParts.Length
    $codeCountHashtable[$row.Code] = $depth
}

# Display the counts in the console
Write-Host "Code counts:" -ForegroundColor Yellow
foreach ($code in $codeCountHashtable.Keys) {
    Write-Host "$code = $($codeCountHashtable[$code])" -ForegroundColor Black
}

# Identify the highest value and store it in a global variable
$global:highestLevelCount = ($codeCountHashtable.Values | Measure-Object -Maximum).Maximum

# Display the highest value in the console with a specific color (e.g., Cyan)
Write-Host "Highest level count: $global:highestLevelCount" -ForegroundColor Cyan

# Initialize an array to store the processed output data
$outputDataArray = @()

# Initialize a hashtable to keep track of the current hierarchy
$currentHierarchy = @{}

# Process the input data
foreach ($row in $inputData) {
    $codeParts = $row.Code -split '\.'

    # Reset the current hierarchy
    $currentHierarchy.Clear()

    # Build the current hierarchy dynamically
    for ($index = 0; $index -lt $codeParts.Length; $index++) {
        $codeSegment = -join ($codeParts[0..$index] -join ".")
        $currentHierarchy["Level$index"] = $inputData | Where-Object { $_.Code -eq $codeSegment } | Select-Object -ExpandProperty Name
    }

    # Create the output object dynamically based on the highest level count
    $outputObject = New-Object PSObject
    $outputObject | Add-Member -MemberType NoteProperty -Name "Term Set Name" -Value $currentHierarchy["Level0"]

    # Only include levels less than the highest level count
    for ($level = 1; $level -lt $global:highestLevelCount; $level++) {
        $levelKey = "Level $level Term"
        if ($currentHierarchy.ContainsKey("Level$level")) {
            $outputObject | Add-Member -MemberType NoteProperty -Name $levelKey -Value $currentHierarchy["Level$level"]
        } else {
            $outputObject | Add-Member -MemberType NoteProperty -Name $levelKey -Value ""
        }
    }

    # Add the output object to the output data array
    $outputDataArray += $outputObject
}

# Filter out empty rows where "Term" is empty and "Level 1 Term" is not
$outputDataArray = $outputDataArray | Where-Object { -not ([string]::IsNullOrWhiteSpace($_.Term) -and -not [string]::IsNullOrWhiteSpace($_.{"Level 1 Term"})) }

# Export the processed data to a new CSV file
$outputDataArray | Export-Csv -Path $outputFilePath -NoTypeInformation

Write-Host "Processing completed. Output saved to $outputFilePath" -ForegroundColor Green
