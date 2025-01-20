import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dolphinCanteen = await prisma.canteen.create({
    data: {
      name: "Dolphin Canteen",
      password: "$2b$10$195nw6jCzG8m1sIcXnNgmu687qCWhDSNNFv.T2CovT1Unu2rymrWS",
      canteenImage: "https://www.dolphinproject.com/wp-content/uploads/2020/07/Wild-copy.jpg",
      menuItems: {
        create: [
          {
            name: "Dosa",
            description: "Crispy and savory rice pancake served with chutney and sambar",
            price: 40.0,
            avilableLimit: 2,
            category: "dosas",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/8vl5ccoBqeSy.webp?o=1",
          },
          {
            name: "Idli",
            description: "Steamed rice cakes served with coconut chutney and sambar",
            price: 30.0,
            category: "idlys",
            avilableLimit: 3,
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/p7Pmz4ru5ZoT.webp?o=1",
          },
          {
            name: "Samosa",
            description: "Crispy fried pastry with potato filling",
            price: 12.0,
            category: "snacks",
            type: "Instant",
            avilableLimit: 5,
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/20G7TdWsSmtQ.webp?o=1",
          },
          {
            name: "Egg Noodles",
            description: "Stir-fried noodles with egg and vegetables",
            price: 50.0,
            avilableLimit: 10,
            category: "noodles",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Chicken Noodles",
            description: "Stir-fried noodles with chicken and vegetables",
            price: 70.0,
            avilableLimit: 10,
            category: "noodles",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Egg Fried Rice",
            description: "Fried rice with scrambled eggs and vegetables",
            price: 50.0,
            avilableLimit: 10,
            category: "rice",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Chicken Fried Rice",
            description: "Fried rice with chicken and vegetables",
            price: 70.0,
            avilableLimit: 10,
            category: "rice",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Parotha Egg Curry",
            description: "Flatbread served with egg curry",
            price: 50.0,
            avilableLimit: 10,
            category: "parothas",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Parotha Paneer",
            description: "Flatbread served with paneer curry",
            price: 60.0,
            avilableLimit: 10,
            category: "parothas",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Masala Dosa",
            description: "Crispy dosa stuffed with spiced potato filling",
            price: 50.0,
            avilableLimit: 10,
            category: "dosas",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Poori Channa",
            description: "Deep-fried bread served with spiced chickpea curry",
            price: 50.0,
            avilableLimit: 10,
            category: "breakfast",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Chicken Burger",
            description: "Burger with crispy chicken patty and veggies",
            price: 70.0,
            avilableLimit: 10,
            category: "snacks",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Rice Bath",
            description: "Flavorful rice cooked with spices and vegetables",
            price: 45.0,
            avilableLimit: 10,
            category: "rice",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Bread Omelet",
            description: "Toasted bread with egg omelet filling",
            price: 50.0,
            avilableLimit: 10,
            category: "snacks",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Ghee Masala Dosa",
            description: "Crispy dosa cooked in ghee and stuffed with spiced potato filling",
            price: 80.0,
            avilableLimit: 10,
            category: "dosas",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Boiled Egg",
            description: "Simple and nutritious boiled egg",
            price: 10.0,
            avilableLimit: 20,
            category: "snacks",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Fruit Bowl",
            description: "Assorted seasonal fruits served fresh",
            price: 35.0,
            avilableLimit: 10,
            category: "healthy",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Tea",
            description: "Hot and refreshing cup of tea",
            price: 10.0,
            avilableLimit: 30,
            category: "beverages",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
          },
          {
            name: "Coffee",
            description: "Hot and energizing cup of coffee",
            price: 10.0,
            avilableLimit: 30,
            category: "beverages",
            status: "AVAILABLE",
            itemImage: "https://gcdnb.pbrd.co/images/DNaAt61Ur4RR.webp?o=1",
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
    console.log("Seeding the database completed");
    await prisma.$disconnect();
  });