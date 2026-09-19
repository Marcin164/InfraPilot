import { Repository } from 'typeorm';
import { Users } from 'src/entities/users.entity';

/**
 * Resolves the internal `Users` row for the already-authenticated PropelAuth
 * principal on `req.user` (set either by AuthGuard or by a guard that
 * validated the token itself). Shared by every guard that needs the DB user
 * behind the token, so the internalId/authId/email fallback chain -- and the
 * authUserId backfill -- only lives in one place.
 */
export async function resolveRequestUser(
  req: any,
  usersRepository: Repository<Users>,
): Promise<Users | null> {
  const reqUser = req?.user;
  const internalId: string | undefined = reqUser?.properties?.metadata?.id;
  const authId: string | undefined =
    reqUser?.userId ?? reqUser?.id ?? reqUser?.user_id;
  const email: string | undefined = reqUser?.email;

  let user: Users | null = null;
  if (internalId) {
    user = await usersRepository.findOneBy({ id: internalId });
  }
  if (!user && authId) {
    user = await usersRepository.findOneBy({ authUserId: authId });
  }
  if (!user && email) {
    user = await usersRepository.findOneBy({ email });
  }

  if (user && authId && !user.authUserId) {
    await usersRepository.update(user.id, { authUserId: authId });
  }

  return user;
}
