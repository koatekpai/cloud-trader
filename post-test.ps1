Get-ChildItem -Recurse -Include *.mjs | ForEach-Object {
  $content = Get-Content $_.FullName
  $updatedContent = $content -replace "../../../layers/services", "../../opt"
  Set-Content $_.FullName $updatedContent
}
