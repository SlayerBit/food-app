import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ConflictError, UnauthorizedError } from "../utils/AppError";
import { UserRepository } from "../repositories/userRepository";
import { prisma } from "../config/prisma";
import { AuthUser } from "../types/request";

export const authService = {
  userRepository: new UserRepository(prisma),
  async signup(name: string, email: string, password: string) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new ConflictError("Email already in use");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userRepository.create({
      name,
      email,
      passwordHash,
      role: "USER",
    });
    const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
      expiresIn: "7d",
    });
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },
  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedError("Invalid credentials");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid credentials");
    const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
      expiresIn: "7d",
    });
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },
  verifyToken(token: string): AuthUser {
    try {
      return jwt.verify(token, env.jwtSecret) as AuthUser;
    } catch {
      throw new UnauthorizedError();
    }
  },
};
