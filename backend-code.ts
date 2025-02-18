// backend/src/index.ts
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import productRoutes from './routes/productRoutes';
import specialPriceRoutes from './routes/specialPriceRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://drenviochallenge:m1jWly3uw42cBwp6@drenvio challenge.2efc0.mongodb.net/tienda')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/special-prices', specialPriceRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// backend/src/models/Product.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  sku: string;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  sku: { type: String, required: true, unique: true }
});

export default mongoose.model<IProduct>('Product', ProductSchema, 'productos');

// backend/src/models/SpecialPrice.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISpecialPrice extends Document {
  userId: string;
  productSku: string;
  price: number;
}

const SpecialPriceSchema: Schema = new Schema({
  userId: { type: String, required: true },
  productSku: { type: String, required: true },
  price: { type: Number, required: true }
});

// Crear un índice compuesto para optimizar las consultas
SpecialPriceSchema.index({ userId: 1, productSku: 1 }, { unique: true });

export default mongoose.model<ISpecialPrice>('SpecialPrice', SpecialPriceSchema, 'preciosEspecialesPerez42');

// backend/src/controllers/productController.ts
import { Request, Response } from 'express';
import Product from '../models/Product';
import SpecialPrice from '../models/SpecialPrice';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const products = await Product.find();
    
    // Si no hay userId, devuelve los productos con precios normales
    if (!userId) {
      return res.status(200).json(products);
    }
    
    // Buscar precios especiales para este usuario
    const specialPrices = await SpecialPrice.find({ userId });
    
    // Mapear los productos para incluir precios especiales si existen
    const productsWithSpecialPrices = products.map(product => {
      const specialPrice = specialPrices.find(sp => sp.productSku === product.sku);
      return {
        ...product.toObject(),
        price: specialPrice ? specialPrice.price : product.price,
        hasSpecialPrice: !!specialPrice
      };
    });
    
    res.status(200).json(productsWithSpecialPrices);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error });
  }
};

// backend/src/controllers/specialPriceController.ts
import { Request, Response } from 'express';
import SpecialPrice from '../models/SpecialPrice';
import Product from '../models/Product';

export const createSpecialPrice = async (req: Request, res: Response) => {
  try {
    const { userId, productSku, price } = req.body;
    
    // Verificar que el producto existe
    const product = await Product.findOne({ sku: productSku });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Verificar que el precio especial es menor que el precio original
    if (price >= product.price) {
      return res.status(400).json({ message: 'El precio especial debe ser menor que el precio original' });
    }
    
    // Crear o actualizar el precio especial
    const specialPrice = await SpecialPrice.findOneAndUpdate(
      { userId, productSku },
      { price },
      { new: true, upsert: true }
    );
    
    res.status(201).json(specialPrice);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear precio especial', error });
  }
};

export const getSpecialPrices = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ message: 'Se requiere un userId' });
    }
    
    const specialPrices = await SpecialPrice.find({ userId });
    res.status(200).json(specialPrices);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener precios especiales', error });
  }
};

export const validateSpecialPrice = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const hasSpecialPrices = await SpecialPrice.exists({ userId });
    res.status(200).json({ hasSpecialPrices: !!hasSpecialPrices });
  } catch (error) {
    res.status(500).json({ message: 'Error al validar precio especial', error });
  }
};

// backend/src/routes/productRoutes.ts
import { Router } from 'express';
import { getAllProducts } from '../controllers/productController';

const router = Router();

router.get('/', getAllProducts);

export default router;

// backend/src/routes/specialPriceRoutes.ts
import { Router } from 'express';
import { createSpecialPrice, getSpecialPrices, validateSpecialPrice } from '../controllers/specialPriceController';

const router = Router();

router.post('/', createSpecialPrice);
router.get('/', getSpecialPrices);
router.get('/validate/:userId', validateSpecialPrice);

export default router;

// backend/package.json
{
  "name": "dr-envio-challenge-backend",
  "version": "1.0.0",
  "description": "Backend for Dr. Envio Challenge",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node-dev src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "mongoose": "^7.5.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/node": "^20.5.7",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.2.2"
  }
}

// backend/tsconfig.json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
