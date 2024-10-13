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
            itemImage: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Dosa.jpg",  // Dosa image URL
          },
          {
            name: "Idli",
            description:
              "Steamed rice cakes served with coconut chutney and sambar",
            price: 30.0,
            avilableLimit: 3,
            status: "AVAILABLE",
            itemImage: "https://upload.wikimedia.org/wikipedia/commons/4/42/Idli.jpg",  // Idli image URL
          },
          {
            name: "Samosa",
            description: "Crispy fried pastry with potato filling",
            price: 12.0,
            avilableLimit: 5,
            status: "AVAILABLE",
            itemImage: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Samosa.jpg",  // Samosa image URL
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
