Get-ChildItem -Recurse -Include *.mjs | ForEach-Object {
  $content = Get-Content $_.FullName
  $updatedContent = $content -replace "../../opt", "../../../layers/services"
  Set-Content $_.FullName $updatedContent
}
