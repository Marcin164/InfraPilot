import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { SshScrapeDriver } from './sshScrape.driver';
import { NetworkDeviceCredential } from 'src/entities/networkDeviceCredential.entity';
import { Devices } from 'src/entities/devices.entity';
import { DhcpDriverType, DhcpServer } from 'src/entities/dhcpServer.entity';

const mockConnect = jest.fn();
const mockExecCommand = jest.fn();
const mockDispose = jest.fn();

jest.mock('node-ssh', () => ({
  NodeSSH: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    execCommand: mockExecCommand,
    dispose: mockDispose,
  })),
}));

jest.mock('src/helpers/crypto', () => ({
  encrypt: jest.fn((v: string) => `gcm:enc:${v}`),
  decrypt: jest.fn((v: string) => v.replace('gcm:enc:', '')),
}));

describe('SshScrapeDriver.fetchLeases', () => {
  let driver: SshScrapeDriver;
  let credentialsRepo: jest.Mocked<any>;
  let devicesRepo: jest.Mocked<any>;

  const SOURCE: DhcpServer = {
    id: 'src-1',
    name: 'Core MikroTik',
    driverType: DhcpDriverType.SSH_SCRAPE,
    deviceId: 'dev-1',
    config: { command: '/ip dhcp-server lease print', lineTemplate: '{ip} {mac} {hostname} {expiry}' },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    devicesRepo = { findOneBy: jest.fn().mockResolvedValue({ id: 'dev-1', managementIp: '10.0.0.1' }) };
    credentialsRepo = {
      findOneBy: jest.fn().mockResolvedValue({
        deviceId: 'dev-1',
        sshUsername: 'gcm:enc:admin',
        sshPassword: 'gcm:enc:pass',
        sshPort: 22,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SshScrapeDriver,
        { provide: getRepositoryToken(NetworkDeviceCredential), useValue: credentialsRepo },
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
      ],
    }).compile();

    driver = module.get(SshScrapeDriver);
  });

  it('connects with decrypted creds and parses the command output per the line template', async () => {
    mockExecCommand.mockResolvedValue({
      stdout: '192.168.1.10 aa:bb:cc:dd:ee:ff host-a 1d\n192.168.1.11 11:22:33:44:55:66 host-b 2d',
      code: 0,
    });

    const records = await driver.fetchLeases(SOURCE);

    expect(mockConnect).toHaveBeenCalledWith(expect.objectContaining({
      host: '10.0.0.1',
      username: 'admin',
      password: 'pass',
      port: 22,
    }));
    expect(mockExecCommand).toHaveBeenCalledWith('/ip dhcp-server lease print');
    expect(records).toEqual([
      { ip: '192.168.1.10', mac: 'aa:bb:cc:dd:ee:ff', hostname: 'host-a', expiry: '1d' },
      { ip: '192.168.1.11', mac: '11:22:33:44:55:66', hostname: 'host-b', expiry: '2d' },
    ]);
    expect(mockDispose).toHaveBeenCalled();
  });

  it('disposes the SSH connection even when execCommand throws', async () => {
    mockExecCommand.mockRejectedValue(new Error('boom'));

    await expect(driver.fetchLeases(SOURCE)).rejects.toThrow('boom');
    expect(mockDispose).toHaveBeenCalled();
  });

  it('rejects when the source has no linked device', async () => {
    await expect(driver.fetchLeases({ ...SOURCE, deviceId: null } as any)).rejects.toThrow(BadRequestException);
  });

  it('rejects when the device has no management IP', async () => {
    devicesRepo.findOneBy.mockResolvedValue({ id: 'dev-1', managementIp: null });
    await expect(driver.fetchLeases(SOURCE)).rejects.toThrow('management IP');
  });

  it('rejects when no SSH credential is configured', async () => {
    credentialsRepo.findOneBy.mockResolvedValue(null);
    await expect(driver.fetchLeases(SOURCE)).rejects.toThrow('No SSH credential');
  });

  it('rejects when config is missing command/lineTemplate', async () => {
    await expect(driver.fetchLeases({ ...SOURCE, config: {} } as any)).rejects.toThrow('missing command/lineTemplate');
  });
});
