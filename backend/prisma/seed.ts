import bcrypt from "bcryptjs";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@foodapp.com" },
    update: { phone: "9999999999" },
    create: {
      name: "Platform Admin",
      email: "admin@foodapp.com",
      phone: "9999999999",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const restaurants = [
    {
      name: "Spice Route",
      description: "North Indian curries, kebabs, and biryanis.",
      cuisine: "North Indian",
      imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe",
      menuItems: [
        { name: "Butter Chicken", description: "Creamy tomato gravy.", price: 349, imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398", isVeg: false, stock: 25 },
        { name: "Paneer Tikka", description: "Smoky cottage cheese cubes.", price: 279, imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8", isVeg: true, stock: 30 },
      ],
    },
    {
      name: "Coastal Bowl",
      description: "Fresh seafood and coastal flavors.",
      cuisine: "Seafood",
      imageUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae",
      menuItems: [
        { name: "Prawn Curry", description: "Coconut based spicy curry.", price: 399, imageUrl: "https://images.unsplash.com/photo-1625943555419-56a2cb596640", isVeg: false, stock: 15 },
        { name: "Fish Fry", description: "Crispy masala fish fillet.", price: 329, imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947", isVeg: false, stock: 18 },
      ],
    },
    {
      name: "Urban Greens",
      description: "Healthy salads, wraps, and bowls.",
      cuisine: "Healthy",
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
      menuItems: [
        { name: "Quinoa Bowl", description: "Avocado, chickpeas, quinoa.", price: 259, imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061", isVeg: true, stock: 28 },
        { name: "Falafel Wrap", description: "Hummus and fresh veggies.", price: 219, imageUrl: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6", isVeg: true, stock: 26 },
      ],
    },
    {
      name: "Pizza Forge",
      description: "Wood-fired artisan pizzas and pasta.",
      cuisine: "Italian",
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591",
      menuItems: [
        { name: "Margherita", description: "Classic basil and mozzarella.", price: 299, imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3", isVeg: true, stock: 22 },
        { name: "Chicken Pepperoni", description: "Loaded spicy pepperoni pizza.", price: 419, imageUrl: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e", isVeg: false, stock: 20 },
      ],
    },
  ];

  for (const r of restaurants) {
    const restaurant = await prisma.restaurant.upsert({
      where: { name: r.name },
      update: {
        description: r.description,
        cuisine: r.cuisine,
        imageUrl: r.imageUrl,
      },
      create: {
        name: r.name,
        description: r.description,
        cuisine: r.cuisine,
        imageUrl: r.imageUrl,
      },
    });

    for (const item of r.menuItems) {
      await prisma.menuItem.upsert({
        where: { id: `${restaurant.id}-${item.name}`.replace(/\s+/g, "-").toLowerCase() },
        update: { stock: item.stock },
        create: {
          id: `${restaurant.id}-${item.name}`.replace(/\s+/g, "-").toLowerCase(),
          restaurantId: restaurant.id,
          name: item.name,
          description: item.description,
          price: new Prisma.Decimal(item.price),
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          stock: item.stock,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
