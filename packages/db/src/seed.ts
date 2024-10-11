import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dolphinCanteen = await prisma.canteen.create({
    data: {
      name: "Dolphin Canteen",
      canteenImage: `${process.env.CLOUDFLARE_R2_URL}/dolphin-canteen.png`,
      menuItems: {
        create: [
          {
            name: "Dosa",
            description:
              "Crispy and savory rice pancake served with chutney and sambar",
            price: 40.0,
            avilableLimit: 2,
            status: "AVAILABLE",
            itemImage: `${process.env.CLOUDFLARE_R2_URL}/dosa.png`,
          },
          {
            name: "Idli",
            description:
              "Steamed rice cakes served with coconut chutney and sambar",
            price: 30.0,
            avilableLimit: 3,
            status: "AVAILABLE",
            itemImage: `${process.env.CLOUDFLARE_R2_URL}/idli.png`,
          },
          {
            name: "Samosa",
            description: "Crispy fried pastry with potato filling",
            price: 12.0,
            avilableLimit: 5,
            status: "AVAILABLE",
            itemImage: `${process.env.CLOUDFLARE_R2_URL}/samosa.png`,
          },
        ],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("seeding the db completed");
    await prisma.$disconnect();
  });
