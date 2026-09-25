import { Test, TestingModule } from '@nestjs/testing';

// customRoles.controller.ts pulls in AuthGuard (@UseGuards class decorator),
// which imports propelAuthClient.ts -- that module throws at import time
// unless PROPELAUTH_AUTH_URL/PROPELAUTH_API_KEY are set. Mocking the whole
// module (same technique as customRoles.service.spec.ts) sidesteps that
// without needing real PropelAuth env vars in the test environment.
jest.mock('src/helpers/propelAuthClient', () => ({
  validateAccessTokenAndGetUserClass: jest.fn(),
}));

import { CustomRolesController } from './customRoles.controller';
import { CustomRolesService } from 'src/services/customRoles.service';
import { AuditService } from 'src/services/audit.service';
import { CustomRole } from 'src/entities/customRole.entity';

const makeRole = (overrides: Partial<CustomRole> = {}): CustomRole =>
  ({
    id: 'role-1',
    name: 'Helpdesk',
    description: null,
    isBuiltIn: false,
    grantsAllPermissions: false,
    permissions: ['helpdesk.tickets.access'],
    ...overrides,
  }) as CustomRole;

const makeReq = (actorId: string | null) => ({
  user: actorId ? { properties: { metadata: { id: actorId } } } : undefined,
});

describe('CustomRolesController', () => {
  let controller: CustomRolesController;
  let customRolesService: jest.Mocked<any>;
  let auditService: jest.Mocked<any>;

  beforeEach(async () => {
    customRolesService = {
      createRole: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
      getRole: jest.fn(),
      assignRole: jest.fn(),
      unassignRole: jest.fn(),
    };
    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomRolesController],
      providers: [
        { provide: CustomRolesService, useValue: customRolesService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    controller = module.get<CustomRolesController>(CustomRolesController);
  });

  it('audits role creation with the actor, name and permission set', async () => {
    const role = makeRole();
    customRolesService.createRole.mockResolvedValue(role);

    await controller.create({ name: 'Helpdesk', permissions: role.permissions } as any, makeReq('actor-1'));

    expect(auditService.log).toHaveBeenCalledWith('CustomRole', 'role-1', 'created', {
      actor: 'actor-1',
      name: 'Helpdesk',
      grantsAllPermissions: false,
      permissions: ['helpdesk.tickets.access'],
    });
  });

  it('audits role updates', async () => {
    const role = makeRole({ name: 'Helpdesk L2', permissions: ['helpdesk.tickets.access', 'helpdesk.approver'] });
    customRolesService.updateRole.mockResolvedValue(role);

    await controller.update('role-1', { name: 'Helpdesk L2' } as any, makeReq('actor-2'));

    expect(auditService.log).toHaveBeenCalledWith('CustomRole', 'role-1', 'updated', {
      actor: 'actor-2',
      name: 'Helpdesk L2',
      grantsAllPermissions: false,
      permissions: ['helpdesk.tickets.access', 'helpdesk.approver'],
    });
  });

  it('audits role deletion, capturing the name before it is gone', async () => {
    const role = makeRole({ name: 'Temp role' });
    customRolesService.getRole.mockResolvedValue(role);
    customRolesService.deleteRole.mockResolvedValue({ success: true });

    await controller.delete('role-1', makeReq('actor-3'));

    expect(customRolesService.getRole).toHaveBeenCalledWith('role-1');
    expect(auditService.log).toHaveBeenCalledWith('CustomRole', 'role-1', 'deleted', {
      actor: 'actor-3',
      name: 'Temp role',
    });
  });

  it('audits assigning a role to a user', async () => {
    customRolesService.assignRole.mockResolvedValue({ success: true });

    await controller.assign('role-1', 'user-9', makeReq('actor-4'));

    expect(auditService.log).toHaveBeenCalledWith('CustomRole', 'role-1', 'user_assigned', {
      actor: 'actor-4',
      userId: 'user-9',
    });
  });

  it('audits unassigning a role from a user', async () => {
    customRolesService.unassignRole.mockResolvedValue({ success: true });

    await controller.unassign('role-1', 'user-9', makeReq('actor-5'));

    expect(auditService.log).toHaveBeenCalledWith('CustomRole', 'role-1', 'user_unassigned', {
      actor: 'actor-5',
      userId: 'user-9',
    });
  });

  it('records a null actor when the request has no resolvable user id', async () => {
    const role = makeRole();
    customRolesService.createRole.mockResolvedValue(role);

    await controller.create({ name: 'Helpdesk', permissions: [] } as any, makeReq(null));

    expect(auditService.log).toHaveBeenCalledWith(
      'CustomRole',
      'role-1',
      'created',
      expect.objectContaining({ actor: null }),
    );
  });
});
