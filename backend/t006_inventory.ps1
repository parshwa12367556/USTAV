param([Parameter(Mandatory=$true)][string]$OutputDirectory, [switch]$NoWrite)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$output = (Resolve-Path -LiteralPath $OutputDirectory).Path
if (-not $output.StartsWith((Join-Path $repo 'backend\instance\'), [StringComparison]::OrdinalIgnoreCase)) { throw 'Evidence must stay in the private instance directory' }
$database = Join-Path $repo 'backend\instance\utsav.db'
$repoRegex = [regex]::Escape($repo) -replace '\\\\', '[\\/]'
$allProcesses = @(Get-CimInstance Win32_Process)
$processes = @($allProcesses | Where-Object {
    $_.Name -match '^(python|pythonw|node|waitress|gunicorn|uvicorn|celery|rq|redis-server|nginx|httpd|iisexpress|w3wp|esbuild)\.exe$'
} | ForEach-Object {
    [PSCustomObject]@{
        Pid=$_.ProcessId; ParentPid=$_.ParentProcessId; Name=$_.Name; Executable=$_.ExecutablePath
        Created=$_.CreationDate.ToUniversalTime().ToString('o'); RepositoryMention=($_.CommandLine -match $repoRegex)
        RunPy=($_.CommandLine -match '(?i)(?:^|[\\/\s"''])run\.py(?:\s|["'']|$)')
        Vite=($_.CommandLine -match '(?i)\bvite(?:[\\/.]|$)')
        ProductionRuntime=($_.CommandLine -match '(?i)waitress|gunicorn|uvicorn|celery')
    }
})
$allServices = @(Get-CimInstance Win32_Service)
$services = @($allServices | Where-Object {
    $_.PathName -match $repoRegex -or ($_.ProcessId -ne 0 -and $_.ProcessId -in $processes.Pid) -or $_.Name -match '^(utsav|waitress|gunicorn|celery|nginx|apache)'
} | Select-Object Name,DisplayName,State,StartMode,ProcessId)
$allTasks = @(Get-ScheduledTask)
$tasks = @($allTasks | Where-Object {
    @($_.Actions | Where-Object {
        $_.Execute -match $repoRegex -or $_.Arguments -match $repoRegex -or $_.WorkingDirectory -match $repoRegex -or $_.Execute -match '(?i)python|node|flask|waitress|celery'
    }).Count -gt 0
} | ForEach-Object {
    [PSCustomObject]@{TaskName=$_.TaskName;TaskPath=$_.TaskPath;State=[string]$_.State;RepositoryMention=(@($_.Actions | Where-Object {$_.Execute -match $repoRegex -or $_.Arguments -match $repoRegex -or $_.WorkingDirectory -match $repoRegex}).Count -gt 0)}
})
$startupMatches = @()
$startupFolderMatches = @()
$startupFolderItemCount = 0
foreach ($folder in @([Environment]::GetFolderPath('Startup'), [Environment]::GetFolderPath('CommonStartup'))) {
    if ($folder -and (Test-Path -LiteralPath $folder)) {
        foreach ($item in @(Get-ChildItem -LiteralPath $folder -File)) {
            $startupFolderItemCount++
            if ($item.Extension -eq '.lnk') {
                $shell = New-Object -ComObject WScript.Shell
                $link = $shell.CreateShortcut($item.FullName)
                if ($link.TargetPath -match $repoRegex -or $link.Arguments -match $repoRegex -or $link.WorkingDirectory -match $repoRegex) {
                    $startupFolderMatches += [PSCustomObject]@{Name=$item.Name;RepositoryMention=$true}
                }
            } elseif ($item.FullName -match $repoRegex -or ($item.Extension -in @('.cmd','.bat','.ps1') -and (Get-Content -LiteralPath $item.FullName -Raw) -match $repoRegex)) {
                $startupFolderMatches += [PSCustomObject]@{Name=$item.Name;RepositoryMention=$true}
            }
        }
    }
}
foreach ($key in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Run','HKLM:\Software\Microsoft\Windows\CurrentVersion\Run','HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce','HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce')) {
    if (Test-Path -LiteralPath $key) {
        $properties = Get-ItemProperty -LiteralPath $key
        foreach ($property in $properties.PSObject.Properties) {
            if ($property.Name -notmatch '^PS' -and [string]$property.Value -match $repoRegex) {
                $startupMatches += [PSCustomObject]@{RegistryKey=$key;ValueName=$property.Name}
            }
        }
    }
}
# Restart Manager query only: no shutdown/restart APIs are declared or called.
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class T006RestartManager {
 [StructLayout(LayoutKind.Sequential)] public struct UniqueProcess {
  public int Pid; public System.Runtime.InteropServices.ComTypes.FILETIME Started;
 }
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] public struct ProcessInfo {
  public UniqueProcess Process;
  [MarshalAs(UnmanagedType.ByValTStr, SizeConst=256)] public string AppName;
  [MarshalAs(UnmanagedType.ByValTStr, SizeConst=64)] public string ServiceName;
  public uint AppType; public uint Status; public uint SessionId;
  [MarshalAs(UnmanagedType.Bool)] public bool Restartable;
 }
 [DllImport("rstrtmgr.dll",CharSet=CharSet.Unicode)] public static extern int RmStartSession(out uint handle, uint flags, StringBuilder key);
 [DllImport("rstrtmgr.dll",CharSet=CharSet.Unicode)] public static extern int RmRegisterResources(uint handle,uint count,string[] files,uint apps,IntPtr processes,uint services,string[] serviceNames);
 [DllImport("rstrtmgr.dll")] public static extern int RmGetList(uint handle,out uint needed,ref uint count,[In,Out] ProcessInfo[] info,ref uint reasons);
 [DllImport("rstrtmgr.dll")] public static extern int RmEndSession(uint handle);
}
'@
$session = [uint32]0
$start = [T006RestartManager]::RmStartSession([ref]$session,0,(New-Object Text.StringBuilder 64))
if ($start -ne 0) { throw "Restart Manager session failed: $start" }
$owners = @()
try {
    $register = [T006RestartManager]::RmRegisterResources($session,1,[string[]]@($database),0,[IntPtr]::Zero,0,$null)
    if ($register -ne 0) { throw "Restart Manager registration failed: $register" }
    $needed=[uint32]0; $count=[uint32]0; $reasons=[uint32]0
    $result = [T006RestartManager]::RmGetList($session,[ref]$needed,[ref]$count,$null,[ref]$reasons)
    if ($result -eq 234) {
        $count=$needed
        $info=New-Object 'T006RestartManager+ProcessInfo[]' $count
        $result=[T006RestartManager]::RmGetList($session,[ref]$needed,[ref]$count,$info,[ref]$reasons)
        if ($result -ne 0) { throw "Restart Manager list failed: $result" }
        for ($index=0; $index -lt $count; $index++) {
            $owners += [PSCustomObject]@{Pid=$info[$index].Process.Pid;AppName=$info[$index].AppName;ServiceName=$info[$index].ServiceName;Restartable=$info[$index].Restartable}
        }
    } elseif ($result -ne 0) { throw "Restart Manager list failed: $result" }
} finally { [void][T006RestartManager]::RmEndSession($session) }
$listeners = @(Get-NetTCPConnection -State Listen | Where-Object {$_.OwningProcess -in $processes.Pid} | Select-Object LocalAddress,LocalPort,OwningProcess)
$parentIds = @($processes.ParentPid | Select-Object -Unique)
$parents = @($allProcesses | Where-Object {$_.ProcessId -in $parentIds} | Select-Object ProcessId,ParentProcessId,Name)
$inventory = [ordered]@{
    RecordedUtc=[DateTime]::UtcNow.ToString('o');Database=$database
    Processes=$processes;Parents=$parents;DatabaseOwners=$owners;Listeners=$listeners
    Services=$services;Tasks=$tasks;StartupRegistryMatches=$startupMatches;StartupFolderMatches=$startupFolderMatches;StartupFolderItemsExamined=$startupFolderItemCount
    EnumeratedProcesses=$allProcesses.Count;EnumeratedServices=$allServices.Count;EnumeratedTasks=$allTasks.Count
    Limits='Point-in-time local-host and current/common startup inspection; not a proof about other hosts, other user profiles or future transient connections. No raw command lines/arguments emitted.'
}
if (-not $NoWrite) { $inventory | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $output 'writer-inventory.json') -Encoding UTF8 }
$inventory | ConvertTo-Json -Depth 6
