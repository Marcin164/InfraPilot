"""Security section -- matches Antivirus/Bitlocker/Firewall/RDP/TPM.tsx."""

from __future__ import annotations

from typing import Any

from .helpers import as_list, run_powershell, safe


_AV_PS = r"""
Get-CimInstance -Namespace 'root\SecurityCenter2' -ClassName AntiVirusProduct -ErrorAction SilentlyContinue |
  ForEach-Object {
    [pscustomobject]@{
      displayName = $_.displayName; productState = $_.productState
      pathToSignedProductExe = $_.pathToSignedProductExe
    }
  }
"""

_BITLOCKER_PS = r"""
try {
  Get-BitLockerVolume -ErrorAction Stop | ForEach-Object {
    [pscustomobject]@{
      MountPoint = $_.MountPoint; CapacityGB = [double]$_.CapacityGB
      VolumeType = [int]$_.VolumeType
      LockStatus = if ($_.LockStatus -eq 'Locked') { 1 } else { 0 }
      ProtectionStatus = [int]$_.ProtectionStatus
      EncryptionMethod = [int]$_.EncryptionMethod
      VolumeStatus = "$($_.VolumeStatus)"
      KeyProtector = @($_.KeyProtector | ForEach-Object { "$($_.KeyProtectorType)" })
    }
  }
} catch { @() }
"""

_FIREWALL_PROFILE_PS = r"""
function Resolve-FirewallAction([string]$action) {
  switch ($action) {
    'Block' { 0 }
    'Allow' { 1 }
    default { 2 }
  }
}
Get-NetFirewallProfile -ErrorAction SilentlyContinue | ForEach-Object {
  [pscustomobject]@{
    Name = "$($_.Name)"
    Enabled = if ($_.Enabled -eq 'True') { 1 } else { 0 }
    AllowUserApps = if ($_.AllowUserApps -eq 'True') { 1 } else { 0 }
    AllowUserPorts = if ($_.AllowUserPorts -eq 'True') { 1 } else { 0 }
    AllowInboundRules = if ($_.AllowInboundRules -eq 'True') { 1 } else { 0 }
    DefaultInboundAction = Resolve-FirewallAction "$($_.DefaultInboundAction)"
    DefaultOutboundAction = Resolve-FirewallAction "$($_.DefaultOutboundAction)"
    AllowLocalFirewallRules = if ($_.AllowLocalFirewallRules -eq 'True') { 1 } else { 0 }
    EnableStealthModeForIPSec = if ($_.EnableStealthModeForIPSec -eq 'True') { 1 } else { 0 }
    AllowUnicastResponseToMulticast = if ($_.AllowUnicastResponseToMulticast -eq 'True') { 1 } else { 0 }
  }
}
"""

_RDP_PS = r"""
$reg = Get-ItemProperty 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -ErrorAction SilentlyContinue
$enabled = if ($reg -and $reg.fDenyTSConnections -eq 0) { $true } else { $false }
[pscustomobject]@{ RDP_Enabled = $enabled }
"""

_TPM_PS = r"""
try {
  $tpm = Get-CimInstance -Namespace 'root\cimv2\Security\MicrosoftTpm' -ClassName Win32_Tpm -ErrorAction Stop | Select-Object -First 1
  if ($tpm) {
    [pscustomobject]@{
      SpecVersion = $tpm.SpecVersion
      ManufacturerIDTxt = $tpm.ManufacturerIdTxt
      ManufacturerVersion = $tpm.ManufacturerVersion
      IsOwned_InitialValue = $tpm.IsOwned_InitialValue
      IsEnabled_InitialValue = $tpm.IsEnabled_InitialValue
      IsActivated_InitialValue = $tpm.IsActivated_InitialValue
    }
  }
} catch {}
"""

_UPDATES_PS = r"""
Get-HotFix -ErrorAction SilentlyContinue | ForEach-Object {
  [pscustomobject]@{
    hotfix_id = $_.HotFixID; description = $_.Description
    installedOn = if ($_.InstalledOn) { $_.InstalledOn.ToString('yyyy-MM-dd') } else { $null }
  }
}
"""

_UAC_PS = r"""
$reg = Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System' -ErrorAction SilentlyContinue
function YesNo($v) {
  if ($null -eq $v) { 'Unknown' } elseif ([int]$v -ne 0) { 'Enabled' } else { 'Disabled' }
}
$consentLevels = @{
  0 = 'Elevate without prompting'
  1 = 'Prompt for credentials on secure desktop'
  2 = 'Prompt for consent on secure desktop'
  3 = 'Prompt for credentials'
  4 = 'Prompt for consent'
  5 = 'Prompt for consent for non-Windows binaries'
}
[pscustomobject]@{
  uac_enabled           = YesNo $reg.EnableLUA
  admin_approval_mode   = if ($null -ne $reg.ConsentPromptBehaviorAdmin -and $consentLevels.ContainsKey([int]$reg.ConsentPromptBehaviorAdmin)) { $consentLevels[[int]$reg.ConsentPromptBehaviorAdmin] } else { 'Unknown' }
  secure_desktop_prompt = YesNo $reg.PromptOnSecureDesktop
  installer_detection   = YesNo $reg.EnableInstallerDetection
  virtualization        = YesNo $reg.EnableVirtualization
}
"""

_STARTUP_APPS_PS = r"""
Get-CimInstance Win32_StartupCommand -ErrorAction SilentlyContinue | ForEach-Object {
  [pscustomobject]@{
    name = $_.Name; location = $_.Location; command = $_.Command; user = $_.User
  }
}
"""


def collect_security() -> dict[str, Any]:
    return {
        "antivirus":        as_list(safe(run_powershell, [], _AV_PS)),
        "bitlocker":        as_list(safe(run_powershell, [], _BITLOCKER_PS)),
        "firewall_profile": as_list(safe(run_powershell, [], _FIREWALL_PROFILE_PS)),
        "rdp_status":       safe(run_powershell, None, _RDP_PS) or {"RDP_Enabled": False},
        "tpm":              safe(run_powershell, None, _TPM_PS) or {},
        "uac_status":       safe(run_powershell, None, _UAC_PS) or {},
        "updates":          as_list(safe(run_powershell, [], _UPDATES_PS, timeout=120)),
        "startup_apps":     as_list(safe(run_powershell, [], _STARTUP_APPS_PS, timeout=60)),
    }
