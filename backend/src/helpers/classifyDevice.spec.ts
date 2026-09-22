import { classifyDiscoveredHost } from './classifyDevice';

const CISCO_MAC = '00:1B:D4:11:22:33';
const DELL_MAC = '18:34:AF:11:22:33';
const UNKNOWN_MAC = 'AA:BB:CC:11:22:33';

describe('classifyDiscoveredHost', () => {
  it('classifies a printer by IPP port regardless of vendor', () => {
    expect(classifyDiscoveredHost({ mac: UNKNOWN_MAC, openPorts: [631] })).toEqual({
      group: 'Peripherals',
      subgroup: 'Printer',
    });
  });

  it('classifies a printer by JetDirect port', () => {
    expect(classifyDiscoveredHost({ mac: CISCO_MAC, openPorts: [9100] })).toEqual({
      group: 'Peripherals',
      subgroup: 'Printer',
    });
  });

  it('classifies Windows ports (445/3389) as Computers/PC, taking priority over a network vendor', () => {
    expect(classifyDiscoveredHost({ mac: CISCO_MAC, openPorts: [22, 445] })).toEqual({
      group: 'Computers',
      subgroup: 'PC',
    });
    expect(classifyDiscoveredHost({ mac: DELL_MAC, openPorts: [3389] })).toEqual({
      group: 'Computers',
      subgroup: 'PC',
    });
  });

  it('classifies a known network vendor with a management port (22/80/443) as Network/Switch', () => {
    expect(classifyDiscoveredHost({ mac: CISCO_MAC, openPorts: [22] })).toEqual({
      group: 'Network',
      subgroup: 'Switch',
    });
    expect(classifyDiscoveredHost({ mac: CISCO_MAC, openPorts: [80, 443] })).toEqual({
      group: 'Network',
      subgroup: 'Switch',
    });
  });

  it('classifies a known network vendor with no open ports as Network with no subgroup guess', () => {
    expect(classifyDiscoveredHost({ mac: CISCO_MAC, openPorts: [] })).toEqual({
      group: 'Network',
      subgroup: null,
    });
    expect(classifyDiscoveredHost({ mac: CISCO_MAC })).toEqual({
      group: 'Network',
      subgroup: null,
    });
  });

  it('falls back to Other/Other when nothing is conclusive', () => {
    expect(classifyDiscoveredHost({ mac: UNKNOWN_MAC, openPorts: [] })).toEqual({
      group: 'Other',
      subgroup: 'Other',
    });
    expect(classifyDiscoveredHost({})).toEqual({ group: 'Other', subgroup: 'Other' });
  });

  it('does not misfire Network/Switch for an unknown vendor even with port 22 open', () => {
    expect(classifyDiscoveredHost({ mac: UNKNOWN_MAC, openPorts: [22] })).toEqual({
      group: 'Other',
      subgroup: 'Other',
    });
  });
});
