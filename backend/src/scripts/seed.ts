import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a default store
  const store = await prisma.store.create({
    data: {
      name: 'Magasin Principal',
      address: 'Bujumbura, Burundi',
      phone: '+257 22 123 456',
      email: 'contact@vukanet.bi',
      description: 'Magasin principal de démonstration',
    },
  });

  console.log('✅ Store created:', store.name);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@vukanet.bi',
      password: adminPassword,
      name: 'Administrateur',
      role: 'ADMIN',
      storeId: store.id,
      language: 'fr',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create seller user
  const sellerPassword = await bcrypt.hash('seller123', 12);
  const seller = await prisma.user.create({
    data: {
      email: 'vendeur@vukanet.bi',
      password: sellerPassword,
      name: 'Vendeur Principal',
      role: 'SELLER',
      storeId: store.id,
      language: 'fr',
    },
  });

  console.log('✅ Seller user created:', seller.email);

  // Create sample products
  const products = [
    {
      name: 'Écouteurs Bluetooth',
      description: 'Écouteurs sans fil de haute qualité',
      category: 'Électronique',
      barcode: '1234567890123',
      unitsPerPackage: 12,
      currentStock: 36,
      packagePurchasePrice: 60000,
      unitSalePrice: 6000,
      packageSalePrice: 70000,
      minStockAlert: 5,
    },
    {
      name: 'Chargeur USB-C',
      description: 'Chargeur rapide USB-C 25W',
      category: 'Électronique',
      barcode: '1234567890124',
      unitsPerPackage: 20,
      currentStock: 60,
      packagePurchasePrice: 40000,
      unitSalePrice: 2500,
      packageSalePrice: 48000,
      minStockAlert: 10,
    },
    {
      name: 'Câble HDMI',
      description: 'Câble HDMI 2.0 - 2 mètres',
      category: 'Électronique',
      barcode: '1234567890125',
      unitsPerPackage: 10,
      currentStock: 15,
      packagePurchasePrice: 25000,
      unitSalePrice: 3000,
      packageSalePrice: 28000,
      minStockAlert: 5,
    },
    {
      name: 'Souris sans fil',
      description: 'Souris optique sans fil',
      category: 'Électronique',
      barcode: '1234567890126',
      unitsPerPackage: 8,
      currentStock: 24,
      packagePurchasePrice: 32000,
      unitSalePrice: 4500,
      packageSalePrice: 35000,
      minStockAlert: 6,
    },
    {
      name: 'Clavier mécanique',
      description: 'Clavier mécanique RGB',
      category: 'Électronique',
      barcode: '1234567890127',
      unitsPerPackage: 5,
      currentStock: 10,
      packagePurchasePrice: 75000,
      unitSalePrice: 18000,
      packageSalePrice: 85000,
      minStockAlert: 3,
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.create({
      data: {
        ...productData,
        storeId: store.id,
      },
    });

    // Create initial stock movement
    await prisma.stockMovement.create({
      data: {
        type: 'IN',
        quantity: product.currentStock,
        unitPrice: product.packagePurchasePrice / product.unitsPerPackage,
        totalValue: product.packagePurchasePrice * (product.currentStock / product.unitsPerPackage),
        reason: 'Stock initial',
        productId: product.id,
        userId: admin.id,
        storeId: store.id,
      },
    });

    console.log('✅ Product created:', product.name);
  }

  // Create sample sales
  const sampleSales = [
    {
      productName: 'Écouteurs Bluetooth',
      quantity: 2,
      unitPrice: 6000,
      totalAmount: 12000,
      clientName: 'Marie Dubois',
      isDebt: false,
    },
    {
      productName: 'Chargeur USB-C',
      quantity: 1,
      unitPrice: 2500,
      totalAmount: 2500,
      clientName: 'Pierre Martin',
      isDebt: true,
    },
    {
      productName: 'Souris sans fil',
      quantity: 3,
      unitPrice: 4500,
      totalAmount: 13500,
      clientName: 'Jean Dupont',
      isDebt: false,
    },
  ];

  for (const saleData of sampleSales) {
    const product = await prisma.product.findFirst({
      where: { name: saleData.productName, storeId: store.id },
    });

    if (product) {
      const sale = await prisma.sale.create({
        data: {
          quantity: saleData.quantity,
          unitPrice: saleData.unitPrice,
          totalAmount: saleData.totalAmount,
          saleType: 'UNIT',
          paymentType: 'CASH',
          clientName: saleData.clientName,
          isDebt: saleData.isDebt,
          productId: product.id,
          sellerId: seller.id,
          storeId: store.id,
        },
      });

      // Update product stock
      await prisma.product.update({
        where: { id: product.id },
        data: {
          currentStock: {
            decrement: saleData.quantity,
          },
        },
      });

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          type: 'OUT',
          quantity: saleData.quantity,
          unitPrice: saleData.unitPrice,
          totalValue: saleData.totalAmount,
          reason: 'Vente',
          reference: sale.id,
          productId: product.id,
          userId: seller.id,
          storeId: store.id,
        },
      });

      // Create debt if needed
      if (saleData.isDebt) {
        await prisma.debt.create({
          data: {
            amount: saleData.totalAmount,
            remainingAmount: saleData.totalAmount,
            clientName: saleData.clientName,
            saleId: sale.id,
            storeId: store.id,
          },
        });
      }

      console.log('✅ Sale created for:', saleData.productName);
    }
  }

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Test accounts:');
  console.log('Admin: admin@vukanet.bi / admin123');
  console.log('Vendeur: vendeur@vukanet.bi / seller123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });