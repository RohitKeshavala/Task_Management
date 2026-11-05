import crypto from 'crypto';
import { getDatabase } from '../db/database.js';
import {
  User,
  UserWithCredentials,
  RegisterDto,
  LoginDto,
  AuthResponse,
  UserRole,
  AppError,
  NotFoundError,
} from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-super-secret-jwt-key-2026';

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const chosenSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, chosenSalt, 64).toString('hex');
  return { hash, salt: chosenSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculatedHash = crypto.scryptSync(password, salt, 64).toString('hex');
  const bufferA = Buffer.from(calculatedHash, 'hex');
  const bufferB = Buffer.from(hash, 'hex');
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

export function generateToken(user: User): string {
  const payload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');
  return `${payloadStr}.${signature}`;
}

export function verifyToken(token: string): { sub: string; email: string; username: string; role: UserRole } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadStr, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export class AuthService {
  static sanitizeUser(raw: any): User {
    return {
      id: raw.id,
      username: raw.username,
      email: raw.email,
      role: raw.role as UserRole,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  static register(dto: RegisterDto): AuthResponse {
    const db = getDatabase();
    const existing = db
      .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE')
      .get(dto.email, dto.username);

    if (existing) {
      throw new AppError('User with this email or username already exists', 409);
    }

    const { hash, salt } = hashPassword(dto.password);
    const id = `user-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const role: UserRole = dto.role || 'MEMBER';

    db.prepare(`
      INSERT INTO users (id, username, email, passwordHash, salt, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, dto.username, dto.email, hash, salt, role, now, now);

    const user: User = {
      id,
      username: dto.username,
      email: dto.email,
      role,
      createdAt: now,
      updatedAt: now,
    };

    const token = generateToken(user);
    return { user, token };
  }

  static login(dto: LoginDto): AuthResponse {
    const db = getDatabase();
    const raw = db
      .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
      .get(dto.email) as UserWithCredentials | undefined;

    if (!raw) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = verifyPassword(dto.password, raw.passwordHash, raw.salt);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = this.sanitizeUser(raw);
    const token = generateToken(user);
    return { user, token };
  }

  static getUserById(id: string): User | null {
    const db = getDatabase();
    const raw = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!raw) return null;
    return this.sanitizeUser(raw);
  }

  static getAllUsers(): User[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM users ORDER BY createdAt ASC').all();
    return rows.map((r) => this.sanitizeUser(r));
  }

  static updateUserRole(userId: string, newRole: UserRole): User {
    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      throw new NotFoundError(`User with id ${userId} not found`);
    }

    // Demotion safeguard: if demoting an ADMIN, check that at least one other ADMIN remains
    if (user.role === 'ADMIN' && newRole !== 'ADMIN') {
      const adminCountRow = db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'")
        .get() as { count: number };
      if (adminCountRow.count <= 1) {
        throw new AppError('Cannot demote the sole remaining administrator.', 400);
      }
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET role = ?, updatedAt = ? WHERE id = ?').run(newRole, now, userId);

    return {
      ...this.sanitizeUser(user),
      role: newRole,
      updatedAt: now,
    };
  }
}
