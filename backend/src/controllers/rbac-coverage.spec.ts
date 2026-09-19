import { describe, it } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const CONTROLLERS_DIR = path.resolve(__dirname);
const MUTATION_DECORATOR = /@(Post|Patch|Put|Delete)\s*\(/;
const ROLES_DECORATOR = /@Roles\s*\(/;
const REQUIRES_PERMISSION_DECORATOR = /@RequiresPermission\s*\(/;
const AGENT_GUARD = /AgentGuard/;
const ALLOW_PUBLIC_MARKER = /@AllowPublicMutation/;

type Finding = {
  file: string;
  method: string;
  decorator: string;
};

function listControllerFiles(): string[] {
  return fs
    .readdirSync(CONTROLLERS_DIR)
    .filter((f) => f.endsWith('.controller.ts'))
    .map((f) => path.join(CONTROLLERS_DIR, f));
}

function controllerHasClassLevelRoles(content: string): boolean {
  const idx = content.indexOf('@Controller');
  if (idx < 0) return false;
  const head = content.slice(Math.max(0, idx - 800), idx);
  return ROLES_DECORATOR.test(head) || REQUIRES_PERMISSION_DECORATOR.test(head);
}

function controllerHasClassLevelAgentGuard(content: string): boolean {
  const idx = content.indexOf('@Controller');
  if (idx < 0) return false;
  const head = content.slice(Math.max(0, idx - 800), idx);
  return AGENT_GUARD.test(head);
}

function findUnprotectedMutations(filePath: string): Finding[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const classLevelRoles = controllerHasClassLevelRoles(content);
  const classLevelAgentGuard = controllerHasClassLevelAgentGuard(content);
  const findings: Finding[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('//')) continue;
    const match = line.match(MUTATION_DECORATOR);
    if (!match) continue;

    // Walking backward/forward from the mutation decorator to gather the
    // full decorator block. A plain "does this line start with @" check
    // isn't enough once a decorator's argument list gets line-wrapped by
    // prettier (e.g. a multi-code @RequiresPermission(...) call, or
    // @UseInterceptors(FileInterceptor(...))) -- those continuation lines
    // don't start with @. Recognize the narrow set of shapes such a
    // continuation line actually takes (a lone closing paren, a quoted
    // string argument, or an inner factory call like "FileInterceptor(...")
    // rather than tracking paren balance generically, which false-positives
    // on stray parens inside // comments (e.g. "(see navigation.ts)").
    // The trailing [,)] requirement on the last alternative is what keeps
    // this from also matching a real (bare, no-modifier) method signature
    // like "createTag(@Body() body: Dto) {" -- that ends in "{", a
    // decorator argument line never does.
    const DECORATOR_CONTINUATION =
      /^(?:\)+,?|'[^']*'\s*,?|"[^"]*"\s*,?|[A-Za-z_]\w*\(.*[,)])$/;

    let lookbackStart = i;
    for (let j = i - 1; j >= 0 && j >= i - 20; j--) {
      const trimmed = lines[j].trim();
      if (
        trimmed.startsWith('@') ||
        trimmed === '' ||
        trimmed.startsWith('//') ||
        DECORATOR_CONTINUATION.test(trimmed)
      ) {
        lookbackStart = j;
        continue;
      }
      break;
    }

    let methodLineIdx = -1;
    let lookaheadEnd = i;
    for (let j = i + 1; j < lines.length && j <= i + 15; j++) {
      const trimmed = lines[j].trim();
      if (
        trimmed.startsWith('@') ||
        trimmed === '' ||
        trimmed.startsWith('//') ||
        DECORATOR_CONTINUATION.test(trimmed)
      ) {
        lookaheadEnd = j;
        continue;
      }
      methodLineIdx = j;
      lookaheadEnd = j;
      break;
    }

    const block = lines.slice(lookbackStart, lookaheadEnd + 1).join('\n');

    const hasMethodRoles =
      ROLES_DECORATOR.test(block) || REQUIRES_PERMISSION_DECORATOR.test(block);
    const hasMethodAgentGuard = AGENT_GUARD.test(block);
    const hasPublicMarker = ALLOW_PUBLIC_MARKER.test(block);

    if (
      classLevelRoles ||
      hasMethodRoles ||
      classLevelAgentGuard ||
      hasMethodAgentGuard ||
      hasPublicMarker
    ) {
      continue;
    }

    let methodName = '<unknown>';
    if (methodLineIdx >= 0) {
      const methodLine = lines[methodLineIdx].trim();
      const m = methodLine.match(/(?:async\s+)?(\w+)\s*\(/);
      if (m) methodName = m[1];
    }
    findings.push({
      file: path.basename(filePath),
      method: methodName,
      decorator: match[1],
    });
  }

  return findings;
}

describe('RBAC coverage on mutation endpoints', () => {
  const KNOWN_PUBLIC_MUTATIONS: Record<string, string[]> = {
    'tickets.controller.ts': [
      'createTicket',
      'createComment',
      'createCommentWithAttachment',
      'updateApproval',
    ],
    'forms.controller.ts': ['create', 'delete'],
    'settings.controller.ts': ['updateUserSettings'],
    'slaRuntime.controller.ts': ['pause', 'resume'],
    // Pre-existing gap (predates the RBAC migration): any authenticated user
    // can hit these today (@UseGuards(AuthGuard), no role check at all) --
    // used while composing a ticket, so restricting to staff-only
    // permissions would be a real behavior change, not a like-for-like
    // @RequiresPermission translation. Allow-listed to preserve current
    // behavior; revisit if AI-assist should actually be staff-only.
    'ai.controller.ts': ['ticketAssist', 'analyzeLogs'],
    // enrollAgent uses EnrollmentGuard (fleet HMAC bootstrap token) instead of @Roles
    'devices.controller.ts': ['enrollAgent'],
    // create/update/remove gate on ShiftsService.assertCanManage — the target
    // employee's manager (or an admin), a data-dependent check @Roles can't
    // express since it isn't a static role.
    'shift.controller.ts': ['create', 'update', 'remove'],
  };

  it('every POST/PATCH/PUT/DELETE has @Roles, @RequiresPermission, AgentGuard, or explicit allow-list entry', () => {
    const files = listControllerFiles().filter(
      (f) => path.basename(f) !== 'rbac-coverage.spec.ts',
    );
    const allFindings: Finding[] = [];

    for (const file of files) {
      const findings = findUnprotectedMutations(file);
      for (const finding of findings) {
        const allowList = KNOWN_PUBLIC_MUTATIONS[finding.file] ?? [];
        if (allowList.includes(finding.method)) continue;
        allFindings.push(finding);
      }
    }

    if (allFindings.length > 0) {
      const summary = allFindings
        .map(
          (f) =>
            `  - ${f.file}:${f.method} (@${f.decorator}) — missing @Roles(...) / @RequiresPermission(...)`,
        )
        .join('\n');
      throw new Error(
        `Found ${allFindings.length} mutation endpoint(s) without RBAC protection:\n${summary}\n\n` +
          `Either add @Roles(...) or @RequiresPermission(...) (preferred for new code), use AgentGuard for HMAC-authenticated agent endpoints, ` +
          `or add the method to KNOWN_PUBLIC_MUTATIONS in rbac-coverage.spec.ts with justification.`,
      );
    }
  });
});
