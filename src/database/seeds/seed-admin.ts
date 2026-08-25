import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { UserEntity } from '../../entities/user.entity';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD ?? 'admin12345';
  const name = process.env.ADMIN_NAME ?? 'Admin';

  await AppDataSource.initialize();

  try {
    const users = AppDataSource.getRepository(UserEntity);
    const existing = await users.findOne({ where: { email } });

    if (existing) {
      console.log(
        JSON.stringify({
          status: 'exists',
          id: existing.id,
          email: existing.email,
          name: existing.name,
        }),
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = users.create({
      email,
      name,
      passwordHash,
    });

    const saved = await users.save(user);
    console.log(
      JSON.stringify({
        status: 'created',
        id: saved.id,
        email: saved.email,
        name: saved.name,
      }),
    );
  } finally {
    await AppDataSource.destroy();
  }
}

void seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
