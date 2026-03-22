import { prisma } from "../config/prisma";
import { UserRepository } from "../repositories/userRepository";
import { NotFoundError, ValidationError } from "../utils/AppError";

export const userService = {
  userRepository: new UserRepository(prisma),

  async me(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return user;
  },

  async updateMe(userId: string, payload: { name?: string; phone?: string; defaultAddressId?: string | null }) {
    if (payload.defaultAddressId) {
      const address = await this.userRepository.findAddressById(payload.defaultAddressId);
      if (!address || address.userId !== userId) {
        throw new ValidationError("Invalid defaultAddressId");
      }
    }
    return this.userRepository.updateProfile(userId, payload);
  },

  async addAddress(
    userId: string,
    payload: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      label?: string;
      setAsDefault?: boolean;
    }
  ) {
    const address = await this.userRepository.createAddress({
      userId,
      line1: payload.line1,
      line2: payload.line2,
      city: payload.city,
      state: payload.state,
      postalCode: payload.postalCode,
      country: payload.country,
      label: payload.label,
    });
    if (payload.setAsDefault) {
      await this.userRepository.updateProfile(userId, { defaultAddressId: address.id });
    }
    return address;
  },

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.userRepository.findAddressById(addressId);
    if (!address || address.userId !== userId) throw new NotFoundError("Address not found");
    await this.userRepository.deleteAddress(addressId);
    const user = await this.userRepository.findById(userId);
    if (user?.defaultAddressId === addressId) {
      await this.userRepository.updateProfile(userId, { defaultAddressId: null });
    }
    return { id: addressId };
  },
};
