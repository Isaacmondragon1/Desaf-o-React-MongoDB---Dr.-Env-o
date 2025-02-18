// frontend/src/types/index.ts
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  hasSpecialPrice?: boolean;
}

export interface SpecialPrice {
  _id: string;
  userId: string;
  productSku: string;
  price: number;
}

export interface User {
  id: string;
  name: string;
}

// frontend/src/api/api.ts
import axios from 'axios';
import { Product, SpecialPrice } from '../types';

const API_URL = 'http://localhost:5000/api';

export const getProducts = async (userId?: string) => {
  const response = await axios.get<Product[]>(`${API_URL}/products`, {
    params: { userId }
  });
  return response.data;
};

export const getSpecialPrices = async (userId: string) => {
  const response = await axios.get<SpecialPrice[]>(`${API_URL}/special-prices`, {
    params: { userId }
  });
  return response.data;
};

export const createSpecialPrice = async (userId: string, productSku: string, price: number) => {
  const response = await axios.post<SpecialPrice>(`${API_URL}/special-prices`, {
    userId,
    productSku,
    price
  });
  return response.data;
};

export const validateSpecialPrice = async (userId: string) => {
  const response = await axios.get<{ hasSpecialPrices: boolean }>(`${API_URL}/special-prices/validate/${userId}`);
  return response.data;
};

// frontend/src/context/UserContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types';

// Datos de muestra para simular usuarios logueados
const sampleUsers: User[] = [
  { id: 'user1', name: 'Usuario Normal' },
  { id: 'user2', name: 'Usuario con Precios Especiales' },
];

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  availableUsers: User[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, availableUsers: sampleUsers }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// frontend/src/components/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Navbar: React.FC = () => {
  const { currentUser, setCurrentUser, availableUsers } = useUser();

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    if (userId === '') {
      setCurrentUser(null);
    } else {
      const user = availableUsers.find(u => u.id === userId);
      if (user) setCurrentUser(user);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Dr. Envío Challenge</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Artículos</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/upload">Subida</Link>
            </li>
          </ul>
          <div className="d-flex">
            <select 
              className="form-select me-2" 
              value={currentUser?.id || ''} 
              onChange={handleUserChange}
            >
              <option value="">Seleccionar usuario</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            {currentUser && (
              <span className="navbar-text">
                Usuario: {currentUser.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

// frontend/src/pages/ArticlesPage.tsx
import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { getProducts } from '../api/api';
import { Product } from '../types';

const ArticlesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts(currentUser?.id);
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentUser]);

  if (loading) {
    return <div className="container mt-4">Cargando...</div>;
  }

  return (
    <div className="container mt-4">
      <h2>Artículos</h2>
      {!currentUser && (
        <div className="alert alert-info">
          Selecciona un usuario para ver precios personalizados
        </div>
      )}
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>SKU</th>
            <th>Precio</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product._id}>
              <td>{product.name}</td>
              <td>{product.description}</td>
              <td>{product.sku}</td>
              <td className={product.hasSpecialPrice ? 'text-danger fw-bold' : ''}>
                ${product.price.toFixed(2)}
              </td>
              <td>
                {product.hasSpecialPrice && (
                  <span className="badge bg-success">Precio Especial</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArticlesPage;

// frontend/src/pages/UploadPage.tsx
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getProducts, createSpecialPrice } from '../api/api';
import { Product } from '../types';

const UploadPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'danger' | 'info'} | null>(null);
  const { currentUser } = useUser();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setMessage({
        text: 'Debes seleccionar un usuario para agregar precios especiales',
        type: 'danger'
      });
      return;
    }
    
    if (!selectedProduct || !price) {
      setMessage({
        text: 'Por favor completa todos los campos',
        type: 'danger'
      });
      return;
    }
    
    try {
      const product = products.find(p => p._id === selectedProduct);
      if (!product) {
        setMessage({
          text: 'Producto no encontrado',
          type: 'danger'
        });
        return;
      }
      
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        setMessage({
          text: 'El precio debe ser un número positivo',
          type: 'danger'
        });
        return;
      }
      
      if (numericPrice >= product.price) {
        setMessage({
          text: 'El precio especial debe ser menor que el precio original',
          type: 'danger'
        });
        return;
      }
      
      await createSpecialPrice(currentUser.id, product.sku, numericPrice);
      
      setMessage({
        text: `Precio especial agregado correctamente para ${product.name}`,
        type: 'success'
      });
      
      // Limpiar el formulario
      setSelectedProduct('');
      setPrice('');
      
    } catch (error) {
      console.error('Error creating special price:', error);
      setMessage({
        text: 'Error al crear precio especial',
        type: 'danger'
      });
    }
  };

  if (loading) {
    return <div className="container mt-4">Cargando...</div>;
  }

  return (
    <div className="container mt-4">
      <h2>Agregar Precio Especial</h2>
      
      {!currentUser && (
        <div className="alert alert-warning">
          Debes seleccionar un usuario para agregar precios especiales
        </div>
      )}
      
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="product" className="form-label">Producto</label>
          <select
            id="product"
            className="form-select"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            disabled={!currentUser}
          >
            <option value="">Selecciona un producto</option>
            {products.map(product => (
              <option key={product._id} value={product._id}>
                {product.name} - ${product.price.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-3">
          <label htmlFor="price" className="form-label">Precio Especial</label>
          <input
            type="number"
            className="form-control"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0.01"
            step="0.01"
            disabled={!currentUser}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!currentUser}
        >
          Guardar Precio Especial
        </button>
      </form>
    </div>
  );
};

export default UploadPage;

// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ArticlesPage from './pages/ArticlesPage';
import UploadPage from './pages/UploadPage';
import { UserProvider } from './context/UserContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const App: React.FC = () => {
  return (
    <UserProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<ArticlesPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </Router>
    </UserProvider>
  );
};

export default App;

// frontend/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// frontend/package.json
{
  "name": "dr-envio-challenge-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@types/node": "^16.18.39",
    "@types/react": "^18.2.17",
    "@types/react-dom": "^18.2.7",
    "axios": "^1.4.0",
    "bootstrap": "^5.3.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.2",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

// frontend/tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "src"
  ]
}
