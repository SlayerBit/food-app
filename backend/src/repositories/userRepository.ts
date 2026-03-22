import { Prisma, PrismaClient } from "@prisma/client";

export class UserRepository {
  constructor(private readonly db: PrismaClient | Prisma.TransactionClient) {}

  findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        defaultAddress: true,
      },
    });
  }

  create(data: { name: string; email: string; passwordHash: string; role: "USER" | "ADMIN"; phone?: string | null }) {
    return this.db.user.create({
      data,
      select: { id: true, name: true, email: true, role: true, phone: true },
    });
  }

  updateProfile(id: string, data: { name?: string; phone?: string; defaultAddressId?: string | null }) {
    return this.db.user.update({
      where: { id },
      data,
      include: { addresses: true, defaultAddress: true },
    });
  }

  createAddress(data: {
    userId: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    label?: string | null;
  }) {
    return this.db.address.create({ data });
  }

  findAddressById(id: string) {
    return this.db.address.findUnique({ where: { id } });
  }

  deleteAddress(id: string) {
    return this.db.address.delete({ where: { id } });
  }
}
