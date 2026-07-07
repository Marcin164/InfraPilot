; Inno Setup script for the InfraPilot Windows agent.
;
; Silent install: the operator runs the installer with either
;   /CONFIGFILE=<path to a JSON config file>            (preferred -- see
;                                                          CurStepChanged)
;   /BACKENDURL=... /TOKEN=...                           (legacy, kept for
;                                                          compatibility)
; from the admin UI's copy-paste snippet. Installer copies the agent,
; registers a SYSTEM scheduled task, and performs the initial enrollment
; in the background.

#define MyAppName       "InfraPilot Agent"
#define MyAppVersion    "0.1.0"
#define MyAppPublisher  "InfraPilot"
#define MyAppURL        "https://infrapilot.example.com"
#define MyAppExeName    "infrapilot-agent.exe"

[Setup]
AppId={{8D5C8A66-2E2C-4F87-9F9B-1B5C6D3B41A1}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\InfraPilot\agent
DefaultGroupName=InfraPilot Agent
DisableProgramGroupPage=yes
DisableDirPage=yes
UninstallDisplayIcon={app}\{#MyAppExeName}
OutputBaseFilename=InfraPilotAgentSetup-{#MyAppVersion}
OutputDir=Output
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"

[Dirs]
Name: "{commonappdata}\InfraPilot\agent"; \
    Permissions: admins-full system-full; Flags: uninsneveruninstall

[Files]
Source: "..\dist\{#MyAppExeName}"; DestDir: "{app}"; \
    Flags: ignoreversion restartreplace uninsrestartdelete
Source: "..\dist\infrapilot-agent-gui.exe"; DestDir: "{app}"; \
    Flags: ignoreversion restartreplace uninsrestartdelete

[Icons]
; Start Menu folder gives the operator something visible after install.
; The agent runs headless via Task Scheduler -- these shortcuts are just
; for operators to inspect state, connect/reconnect, and uninstall cleanly.
Name: "{group}\InfraPilot Agent"; \
    Filename: "{app}\infrapilot-agent-gui.exe"; \
    IconFilename: "{app}\infrapilot-agent-gui.exe"
Name: "{group}\View agent log"; \
    Filename: "{win}\system32\notepad.exe"; \
    Parameters: """{commonappdata}\InfraPilot\agent\agent.log"""; \
    IconFilename: "{app}\{#MyAppExeName}"
Name: "{group}\Open agent data folder"; \
    Filename: "{commonappdata}\InfraPilot\agent"; \
    IconFilename: "{app}\{#MyAppExeName}"
Name: "{group}\Run a scan now"; \
    Filename: "schtasks.exe"; Parameters: "/Run /TN InfraPilotAgent"; \
    IconFilename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall InfraPilot Agent"; \
    Filename: "{uninstallexe}"

[Run]
Filename: "{app}\{#MyAppExeName}"; Parameters: "--register-task --interval 60"; \
    StatusMsg: "Registering scheduled task..."; Flags: runhidden waituntilterminated

Filename: "{app}\{#MyAppExeName}"; Parameters: "--enroll-only"; \
    StatusMsg: "Enrolling with backend..."; \
    Flags: runhidden waituntilterminated; \
    Check: ConfigPresent

; Interactive installs only (skipifsilent): if the operator double-clicked
; the installer without /BACKENDURL= /TOKEN=, offer the GUI on the Finish
; page instead of leaving them to go find the PowerShell snippet.
Filename: "{app}\infrapilot-agent-gui.exe"; \
    Description: "Otwórz InfraPilot Agent i połącz z backendem"; \
    Flags: postinstall nowait skipifsilent; \
    Check: NoConfigYet

[UninstallRun]
Filename: "{app}\{#MyAppExeName}"; Parameters: "--unregister-task"; \
    Flags: runhidden waituntilterminated

[Code]
const
  ConfigFile = '{commonappdata}\InfraPilot\agent\config.json';

function ConfigPath: String;
begin
  Result := ExpandConstant(ConfigFile);
end;

function GetCmdParam(const Name: String): String;
var
  I: Integer;
  S, Prefix: String;
begin
  Result := '';
  Prefix := '/' + Uppercase(Name) + '=';
  for I := 1 to ParamCount do begin
    S := ParamStr(I);
    if (Pos(Prefix, Uppercase(S)) = 1) then begin
      Result := Copy(S, Length(Prefix) + 1, MaxInt);
      Exit;
    end;
  end;
end;

function JsonEscape(const S: String): String;
begin
  Result := S;
  { Backslash first -- escaping the quote below introduces new backslashes
    that must not themselves get re-escaped by a second pass. }
  StringChangeEx(Result, '\', '\\', True);
  StringChangeEx(Result, '"', '\"', True);
end;

procedure WriteCliConfig(const BackendUrl, Token: String);
var
  Lines: TArrayOfString;
begin
  ForceDirectories(ExpandConstant('{commonappdata}\InfraPilot\agent'));
  SetArrayLength(Lines, 8);
  Lines[0] := '{';
  Lines[1] := '  "backend_url": "' + JsonEscape(BackendUrl) + '",';
  Lines[2] := '  "enrollment_token": "' + JsonEscape(Token) + '",';
  Lines[3] := '  "interval_minutes": 60,';
  Lines[4] := '  "verify_tls": true,';
  Lines[5] := '  "ca_bundle": null,';
  Lines[6] := '  "log_path": "C:\\ProgramData\\InfraPilot\\agent\\agent.log"';
  Lines[7] := '}';
  SaveStringsToUTF8File(ConfigPath, Lines, False);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  BackendUrl, Token, ConfigFileParam: String;
begin
  if CurStep = ssPostInstall then begin
    if not FileExists(ConfigPath) then begin
      // Preferred silent path: /CONFIGFILE=<path to a JSON file the caller
      // already wrote>. Keeps the backend URL + enrollment token out of
      // this process's own command line (Task Manager / Process Explorer
      // show installer.exe's argv to anyone with access to the host) --
      // the caller is expected to write that file to a per-user temp
      // location and delete it right after this run.
      ConfigFileParam := GetCmdParam('CONFIGFILE');
      if (ConfigFileParam <> '') and FileExists(ConfigFileParam) then begin
        ForceDirectories(ExpandConstant('{commonappdata}\InfraPilot\agent'));
        FileCopy(ConfigFileParam, ConfigPath, False);
      end else begin
        // Legacy path: /BACKENDURL=... /TOKEN=... directly on the command
        // line. Kept for backward compatibility with existing snippets.
        BackendUrl := GetCmdParam('BACKENDURL');
        Token      := GetCmdParam('TOKEN');
        if (BackendUrl <> '') and (Token <> '') then begin
          WriteCliConfig(BackendUrl, Token);
        end;
      end;
    end;
  end;

  // After everything's wired up: if there's still no config (user
  // double-clicked .exe without /BACKENDURL= /TOKEN=), tell them where
  // to get those values. The agent is installed and scheduled but
  // cannot do anything useful until config.json exists. The Finish page
  // (see [Run]) also offers to open the GUI directly for interactive
  // installs -- this MsgBox is the fallback for anyone who skips that.
  if CurStep = ssDone then begin
    if not FileExists(ConfigPath) then begin
      MsgBox(
        'InfraPilot Agent installed -- but NOT YET configured.' + #13#10 + #13#10 +
        'Easiest: click "InfraPilot Agent" in the Start Menu and paste the ' +
        'Backend URL + token there.' + #13#10 + #13#10 +
        'Or, from your InfraPilot web UI:' + #13#10 +
        '  1. Go to Settings -> Windows Agent' + #13#10 +
        '  2. Copy the PowerShell snippet shown there' + #13#10 +
        '  3. Run it on this host in an elevated PowerShell' + #13#10 + #13#10 +
        'The agent will then enroll automatically and start sending scans.',
        mbInformation, MB_OK);
    end;
  end;
end;

function ConfigPresent: Boolean;
begin
  Result := FileExists(ConfigPath);
end;

function NoConfigYet: Boolean;
begin
  Result := not FileExists(ConfigPath);
end;

function InitializeUninstall(): Boolean;
var
  Confirm: Integer;
begin
  Result := True;
  Confirm := MsgBox(
    'Also remove the agent state (device id + enrollment secret) under ' +
    ExpandConstant('{commonappdata}\InfraPilot') + ' ?' + #13#10 + #13#10 +
    'Click No to keep the state -- re-installing later will resume scanning ' +
    'against the same device record.',
    mbConfirmation, MB_YESNO);
  if Confirm = IDYES then
    DelTree(ExpandConstant('{commonappdata}\InfraPilot'), True, True, True);
end;
