import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dolphinCanteen = await prisma.canteen.create({
    data: {
      name: "Dolphin Canteen",
      canteenImage: "https://www.dolphinproject.com/wp-content/uploads/2020/07/Wild-copy.jpg",  
      menuItems: {
        create: [
          {
            name: "Dosa",
            description:
              "Crispy and savory rice pancake served with chutney and sambar",
            price: 40.0,
            avilableLimit: 2,
            status: "AVAILABLE",
            itemImage: "https://pub-4c4ca315ecae4f0bb055b6a7886c8eef.r2.dev/dosa.png",  // Dosa image URL
          },
          {
            name: "Idli",
            description:
              "Steamed rice cakes served with coconut chutney and sambar",
            price: 30.0,
            avilableLimit: 3,
            status: "AVAILABLE",
            itemImage: "https://pub-4c4ca315ecae4f0bb055b6a7886c8eef.r2.dev/idli.png",  // Idli image URL
          },
          {
            name: "Samosa",
            description: "Crispy fried pastry with potato filling",
            price: 12.0,
            avilableLimit: 5,
            status: "AVAILABLE",
            itemImage: "https://pub-4c4ca315ecae4f0bb055b6a7886c8eef.r2.dev/samosa.png",  // Samosa image URL
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
