import psutil
import subprocess
import json
from utils.powershell_helper import run_ps


def parse_net_use():
    out = run_ps("net use")
    return out

def get_shares():
    out = run_ps('Get-SmbShare | Select Name,Path,Description,ShareType,AvailabilityType | ConvertTo-Json')
    return out

def get_firewall_rules():
    out = run_ps('Get-NetFirewallRule | Select Name,DisplayName,Enabled,Profile,Direction,Action | ConvertTo-Json')
    return out

def get_nic():
    out = run_ps("Get-NetIPConfiguration | ConvertTo-Json")
    return out


def get_network_info():
    data = {}
    try:
        # Adapters and addresses
        if_addrs = psutil.net_if_addrs()
        interfaces = {}
        for name, addrs in if_addrs.items():
            interfaces[name] = []
            for a in addrs:
                interfaces[name].append({'family': str(a.family), 'address': a.address, 'netmask': a.netmask, 'broadcast': a.broadcast})
        data['adapters'] = interfaces

        # Active connections
        cons = []
        for c in psutil.net_connections(kind='inet'):
            laddr = f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else None
            raddr = f"{c.raddr.ip}:{c.raddr.port}" if c.raddr else None
            cons.append({'pid': c.pid, 'laddr': laddr, 'raddr': raddr, 'status': c.status})
        data['connections'] = cons

        # Mapped network drives
        data['mapped_drives'] = parse_net_use()

        # Network shares (server-side): net share
        data['shares'] = get_shares()

        # Firewall rules
        data['firewall_rules'] = get_firewall_rules()

        # NIC configuration
        data['nic_config'] = get_nic()

    except Exception as e:
        data['error'] = str(e)
    return data

#     {
#         "Detailed":  false,
#         "ComputerName":  "MARCINWRO",
#         "InterfaceAlias":  "Połączenie sieciowe Bluetooth",
#         "InterfaceIndex":  6,
#         "InterfaceDescription":  "Bluetooth Device (Personal Area Network)",
#         "CompartmentId":  1,
#         "NetAdapter":  {
#                            "CimClass":  "root/StandardCimv2:MSFT_NetAdapter",
#                            "CimInstanceProperties":  "Caption Description ElementName InstanceID = \"{44492B04-
# ED69-44D7-B349-8AC418F3BA2A}\" CommunicationStatus DetailedStatus HealthState InstallDate Name = \"Połączenie s
# ieciowe Bluetooth\" OperatingStatus OperationalStatus PrimaryStatus Status StatusDescriptions AvailableRequeste
# dStates EnabledDefault = 2 EnabledState = 5 OtherEnabledState RequestedState = 12 TimeOfLastStateChange Transit
# ioningToState = 12 AdditionalAvailability Availability CreationClassName = \"MSFT_NetAdapter\" DeviceID = \"{44
# 492B04-ED69-44D7-B349-8AC418F3BA2A}\" ErrorCleared ErrorDescription IdentifyingDescriptions LastErrorCode MaxQu
# iesceTime OtherIdentifyingInfo PowerManagementCapabilities PowerManagementSupported PowerOnHours StatusInfo Sys
# temCreationClassName = \"CIM_NetworkPort\" SystemName = \"MARCINWRO\" TotalPowerOnHours MaxSpeed OtherPortType 
# PortType RequestedSpeed Speed = 3000000 UsageRestriction ActiveMaximumTransmissionUnit = 1500 AutoSense FullDup
# lex = True LinkTechnology NetworkAddresses = ... OtherLinkTechnology OtherNetworkPortType PermanentAddress = \"
# 5CF3707C513C\" PortNumber = 0 SupportedMaximumTransmissionUnit AdminLocked = False ComponentID = \"BTH\\MS_BTHP
# AN\" ConnectorPresent = False DeviceName = \"\\Device\\{44492B04-ED69-44D7-B349-8AC418... DeviceWakeUpEnable = 
# False DriverDate = \"2006-06-21\" DriverDateData = 127953216000000000 DriverDescription = \"Bluetooth Device (P
# ersonal Area Network... DriverMajorNdisVersion = 6 DriverMinorNdisVersion = 30 DriverName = \"\\SystemRoot\\Sys
# tem32\\drivers\\bthpan.sys... DriverProvider = \"Microsoft\" DriverVersionString = \"10.0.19041.5848\" EndPoint
# Interface = False HardwareInterface = False Hidden = False HigherLayerInterfaceIndices IMFilter = False Interfa
# ceAdminStatus = 1 InterfaceDescription = \"Bluetooth Device (Personal Area Network... InterfaceGuid = \"{44492B
# 04-ED69-44D7-B349-8AC418F3BA2A}\" InterfaceIndex = 6 InterfaceName = \"ethernet_32770\" InterfaceOperationalSta
# tus = 2 InterfaceType = 6 iSCSIInterface = False LowerLayerInterfaceIndices MajorDriverVersion = 0 MediaConnect
# State = 2 MediaDuplexState = 2 MinorDriverVersion = 0 MtuSize = 1500 NdisMedium = 0 NdisPhysicalMedium = 10 Net
# Luid = 1689399649632256 NetLuidIndex = 32770 NotUserRemovable = False OperationalStatusDownDefaultPortNotAuthen
# ticated = False OperationalStatusDownInterfacePaused = False OperationalStatusDownLowPowerState = False Operati
# onalStatusDownMediaDisconnected = True PnPDeviceID = \"BTH\\MS_BTHPAN\\6\u0026296aa8f4\u00260\u00262\" Promiscu
# ousMode = False ReceiveLinkSpeed = 3000000 State = 2 TransmitLinkSpeed = 3000000 Virtual = True VlanID WdmInter
# face = True",
#                            "CimSystemProperties":  "Microsoft.Management.Infrastructure.CimSystemProperties"
#                        },
#         "NetCompartment":  {
#                                "CimClass":  "root/StandardCimv2:MSFT_NetCompartment",
#                                "CimInstanceProperties":  "Caption Description ElementName InstanceID = \";55;\"
#  CompartmentDescription = \"Default Compartment\" CompartmentGuid = \"{b1062982-2b18-4b4f-b3d5-a78ddb9cdd49}\" 
# CompartmentId = 1 CompartmentType = 1",
#                                "CimSystemProperties":  "Microsoft.Management.Infrastructure.CimSystemProperties
# "
#                            },
#         "NetIPv6Interface":  {
#                                  "CimClass":  "root/StandardCimv2:MSFT_NetIPInterface",
#                                  "CimInstanceProperties":  "Caption Description ElementName InstanceID Communic
# ationStatus DetailedStatus HealthState InstallDate Name = \"@55??55;\" OperatingStatus OperationalStatus Primar
# yStatus Status StatusDescriptions AvailableRequestedStates EnabledDefault = 2 EnabledState OtherEnabledState Re
# questedState = 12 TimeOfLastStateChange TransitioningToState = 12 CreationClassName = \"\" SystemCreationClassN
# ame = \"\" SystemName = \"\" NameFormat OtherTypeDescription ProtocolIFType ProtocolType AliasAddresses GroupAd
# dresses LANID LANType MACAddress MaxDataSize OtherLANType AddressFamily = 23 AdvertiseDefaultRoute = 0 Advertis
# edRouterLifetime = 00:30:00 Advertising = 0 AutomaticMetric = 1 BaseReachableTime = 30000 ClampMss = 0 Compartm
# entId = 1 ConnectionState = 0 CurrentHopLimit = 0 DadRetransmitTime = 1000 DadTransmits = 1 Dhcp = 0 DirectedMa
# cWolPattern = 0 EcnMarking = 3 ForceArpNdWolPattern = 0 Forwarding = 0 IgnoreDefaultRoutes = 0 InterfaceAlias =
#  \"Połączenie sieciowe Bluetooth\" InterfaceIndex = 6 InterfaceMetric = 65 IsolationId = 0 LowestIfNetLuid = 16
# 89399649632256 ManagedAddressConfiguration = 0 NeighborDiscoverySupported = 1 NeighborUnreachabilityDetection =
#  1 NlMtu = 1500 OtherStatefulConfiguration = 0 ReachableTime = 17000 RetransmitTime = 1000 RouterDiscovery = 1 
# Store = 1 WeakHostReceive = 0 WeakHostSend = 0",
#                                  "CimSystemProperties":  "Microsoft.Management.Infrastructure.CimSystemProperti
# es"
#                              },
#         "NetIPv4Interface":  {
#                                  "CimClass":  "root/StandardCimv2:MSFT_NetIPInterface",
#                                  "CimInstanceProperties":  "Caption Description ElementName InstanceID Communic
# ationStatus DetailedStatus HealthState InstallDate Name = \"@55?55;\" OperatingStatus OperationalStatus Primary
# Status Status StatusDescriptions AvailableRequestedStates EnabledDefault = 2 EnabledState OtherEnabledState Req
# uestedState = 12 TimeOfLastStateChange TransitioningToState = 12 CreationClassName = \"\" SystemCreationClassNa
# me = \"\" SystemName = \"\" NameFormat OtherTypeDescription ProtocolIFType ProtocolType AliasAddresses GroupAdd
# resses LANID LANType MACAddress MaxDataSize OtherLANType AddressFamily = 2 AdvertiseDefaultRoute = 0 Advertised
# RouterLifetime = 00:30:00 Advertising = 0 AutomaticMetric = 1 BaseReachableTime = 30000 ClampMss = 0 Compartmen
# tId = 1 ConnectionState = 0 CurrentHopLimit = 0 DadRetransmitTime = 1000 DadTransmits = 3 Dhcp = 1 DirectedMacW
# olPattern = 0 EcnMarking = 3 ForceArpNdWolPattern = 0 Forwarding = 0 IgnoreDefaultRoutes = 0 InterfaceAlias = \
# "Połączenie sieciowe Bluetooth\" InterfaceIndex = 6 InterfaceMetric = 65 IsolationId = 0 LowestIfNetLuid = 1689
# 399649632256 ManagedAddressConfiguration = 1 NeighborDiscoverySupported = 1 NeighborUnreachabilityDetection = 1
#  NlMtu = 1500 OtherStatefulConfiguration = 1 ReachableTime = 31500 RetransmitTime = 1000 RouterDiscovery = 2 St
# ore = 1 WeakHostReceive = 0 WeakHostSend = 0",
#                                  "CimSystemProperties":  "Microsoft.Management.Infrastructure.CimSystemProperti
# es"
#                              },
#         "NetProfile":  null,
#         "AllIPAddresses":  [
#                                "MSFT_NetIPAddress (Name = \";@C8???8C?8??@55@55;55;\", CreationClassName = \"\"
# , SystemCreationClassName = \"\", SystemName = \"\")",
#                                "MSFT_NetIPAddress (Name = \"poB:DDkol?DCl?Dn?@:DoB?o/@55@55;55;\", CreationClas
# sName = \"\", SystemCreationClassName = \"\", SystemName = \"\")"
#                            ],
#         "IPv6Address":  [

#                         ],
#         "IPv6TemporaryAddress":  [

#                                  ],
#         "IPv6LinkLocalAddress":  [
#                                      "MSFT_NetIPAddress (Name = \"poB:DDkol?DCl?Dn?@:DoB?o/@55@55;55;\", Creati
# onClassName = \"\", SystemCreationClassName = \"\", SystemName = \"\")"
#                                  ],
#         "IPv4Address":  [
#                             "MSFT_NetIPAddress (Name = \";@C8???8C?8??@55@55;55;\", CreationClassName = \"\", S
# ystemCreationClassName = \"\", SystemName = \"\")"
#                         ],
#         "IPv6DefaultGateway":  null,
#         "IPv4DefaultGateway":  null,
#         "DNSServer":  [
#                           "MSFT_DNSClientServerAddress (Name = \"6\", CreationClassName = \"\", SystemCreationC
# lassName = \"\", SystemName = \"23\")",
#                           "MSFT_DNSClientServerAddress (Name = \"6\", CreationClassName = \"\", SystemCreationC
# lassName = \"\", SystemName = \"2\")"
#                       ]
#     }