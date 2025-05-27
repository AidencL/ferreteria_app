'use client'; 

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Minus, Trash, Check, X, Search } from "lucide-react";
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type SaleItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type Sale = {
  id: string;
  items: SaleItem[];
  total: number;
  paymentMethod: string;
  date: Date;
  change?: number;
};

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export default function FerreteriaSalesSystem() {
  // Inventory state
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Martillo', price: 10000, quantity: 20 },
    { id: '2', name: 'Destornillador', price: 5000, quantity: 30 },
    { id: '3', name: 'Clavos (1kg)', price: 100, quantity: 50 },
    { id: '4', name: 'Pintura Blanca', price: 250000, quantity: 15 },
  ]);

  // New product form state
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    quantity: 0
  });

  // Sales state
  const [currentSale, setCurrentSale] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Cash register state
  const [cashRegister, setCashRegister] = useState({
    initialAmount: 100000,
    currentAmount: 100000,
    salesTotal: 0
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'cash'>('sales');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('ferreteriaData');
    if (savedData) {
      const { products, sales, cashRegister } = JSON.parse(savedData);
      setProducts(products);
      setSales(sales.map((sale: any) => ({
        ...sale,
        date: new Date(sale.date)
      })));
      setCashRegister(cashRegister);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    const dataToSave = {
      products,
      sales,
      cashRegister
    };
    localStorage.setItem('ferreteriaData', JSON.stringify(dataToSave));
  }, [products, sales, cashRegister]);

  // Inventory management functions
  const addProduct = () => {
    if (!newProduct.name.trim()) {
      toast.error('El nombre del producto es requerido');
      return;
    }
    if (newProduct.price <= 0) {
      toast.error('El precio debe ser mayor que cero');
      return;
    }
    if (newProduct.quantity <= 0) {
      toast.error('La cantidad debe ser mayor que cero');
      return;
    }
    
    const product: Product = {
      id: Date.now().toString(),
      ...newProduct
    };
    
    setProducts([...products, product]);
    setNewProduct({ name: '', price: 0, quantity: 0 });
    toast.success('Producto agregado correctamente');
  };

  const startEditingProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditingProduct({...product});
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setEditingProduct(null);
  };

  const saveEditedProduct = () => {
    if (!editingProduct) return;
    
    if (editingProduct.quantity < 0) {
      toast.error('La cantidad no puede ser negativa');
      return;
    }
    
    if (editingProduct.price <= 0) {
      toast.error('El precio debe ser mayor que cero');
      return;
    }
    
    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      price: editingProduct.price,
      quantity: editingProduct.quantity
    });
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
    setEditingProductId(null);
    setEditingProduct(null);
    toast.success('Producto actualizado correctamente');
  };

  const deleteProduct = (id: string) => {
    const productInSale = currentSale.some(item => item.productId === id);
    if (productInSale) {
      toast.error('No puedes eliminar un producto que está en la venta actual');
      return;
    }
    
    setProducts(products.filter(p => p.id !== id));
    toast.success('Producto eliminado correctamente');
  };

  // Sales functions
  const addToSale = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error('No hay suficiente stock de este producto');
      return;
    }
    
    const existingItem = currentSale.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCurrentSale(currentSale.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCurrentSale([
        ...currentSale,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1
        }
      ]);
    }
    
    // Update inventory
    setProducts(products.map(p => 
      p.id === product.id 
        ? { ...p, quantity: p.quantity - 1 } 
        : p
    ));
  };

  const removeFromSale = (productId: string) => {
    const itemToRemove = currentSale.find(item => item.productId === productId);
    if (!itemToRemove) return;
    
    if (itemToRemove.quantity > 1) {
      setCurrentSale(currentSale.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      ));
    } else {
      setCurrentSale(currentSale.filter(item => item.productId !== productId));
    }
    
    // Return to inventory
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, quantity: p.quantity + 1 } 
        : p
    ));
  };

  const completeSale = () => {
    if (currentSale.length === 0) {
      toast.error('No hay productos en la venta');
      return;
    }
    
    const total = calculateSaleTotal();
    
    if (paymentMethod === 'efectivo' && cashReceived < total) {
      toast.error('El efectivo recibido es menor que el total');
      return;
    }
    
    const change = paymentMethod === 'efectivo' ? cashReceived - total : undefined;
    
    const newSale: Sale = {
      id: Date.now().toString(),
      items: [...currentSale],
      total,
      paymentMethod,
      date: new Date(),
      change
    };
    
    setSales([...sales, newSale]);
    setCurrentSale([]);
    setCashReceived(0);
    setCashRegister({
      ...cashRegister,
      currentAmount: cashRegister.currentAmount + total,
      salesTotal: cashRegister.salesTotal + total
    });
    
    toast.success('Venta completada correctamente');
  };

  // Cash register functions
  const resetCashRegister = () => {
    if (!confirm('¿Estás seguro de que quieres reiniciar la caja? Esto borrará el historial de ventas.')) {
      return;
    }
    
    setCashRegister({
      initialAmount: cashRegister.currentAmount,
      currentAmount: cashRegister.currentAmount,
      salesTotal: 0
    });
    setSales([]);
    toast.success('Caja reiniciada correctamente');
  };

  // Calculate totals
  const calculateSaleTotal = () => {
    return currentSale.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableProducts = filteredProducts.filter(p => p.quantity > 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Sistema de Ventas - Ferretería</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 mb-6">
              <Button 
                variant={activeTab === 'inventory' ? 'default' : 'outline'}
                onClick={() => setActiveTab('inventory')}
              >
                Inventario
              </Button>
              <Button 
                variant={activeTab === 'sales' ? 'default' : 'outline'}
                onClick={() => setActiveTab('sales')}
              >
                Ventas
              </Button>
              <Button 
                variant={activeTab === 'cash' ? 'default' : 'outline'}
                onClick={() => setActiveTab('cash')}
              >
                Caja
              </Button>
            </div>

            {/* Inventory Management */}
            {activeTab === 'inventory' && (
              <div>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Agregar Producto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="product-name">Nombre</Label>
                        <Input
                          id="product-name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          placeholder="Nombre del producto"
                        />
                      </div>
                      <div>
                        <Label htmlFor="product-price">Precio</Label>
                        <Input
                          id="product-price"
                          type="number"
                          min="0"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                          placeholder="Precio"
                        />
                      </div>
                      <div>
                        <Label htmlFor="product-quantity">Cantidad</Label>
                        <Input
                          id="product-quantity"
                          type="number"
                          min="0"
                          value={newProduct.quantity}
                          onChange={(e) => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                          placeholder="Cantidad"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={addProduct}>
                      <Plus className="mr-2 h-4 w-4" /> Agregar Producto
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Inventario Actual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar productos..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              {editingProductId === product.id ? (
                                <Input
                                  value={editingProduct?.name || ''}
                                  onChange={(e) => setEditingProduct(editingProduct ? {...editingProduct, name: e.target.value} : null)}
                                />
                              ) : (
                                product.name
                              )}
                            </TableCell>
                            <TableCell>
                              {editingProductId === product.id ? (
                                <Input
                                  type="number"
                                  min="1"
                                  value={editingProduct?.price || 0}
                                  onChange={(e) => setEditingProduct(editingProduct ? {...editingProduct, price: Number(e.target.value)} : null)}
                                />
                              ) : (
                                `$${product.price.toLocaleString()}`
                              )}
                            </TableCell>
                            <TableCell>
                              {editingProductId === product.id ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={editingProduct?.quantity || 0}
                                  onChange={(e) => setEditingProduct(editingProduct ? {...editingProduct, quantity: Number(e.target.value)} : null)}
                                />
                              ) : (
                                product.quantity
                              )}
                            </TableCell>
                            <TableCell className="flex space-x-2">
                              {editingProductId === product.id ? (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={cancelEditing}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={saveEditedProduct}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => startEditingProduct(product)}
                                  >
                                    Editar
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => deleteProduct(product.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sales Processing */}
            {activeTab === 'sales' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Productos Disponibles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar productos..."
                          className="pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {availableProducts.length > 0 ? (
                          availableProducts.map((product) => (
                            <Card key={product.id}>
                              <CardHeader>
                                <CardTitle className="text-lg">{product.name}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-lg font-bold">${product.price.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Disponibles: {product.quantity}</p>
                              </CardContent>
                              <CardFooter>
                                <Button 
                                  className="w-full"
                                  onClick={() => addToSale(product)}
                                >
                                  <Plus className="mr-2 h-4 w-4" /> Agregar
                                </Button>
                              </CardFooter>
                            </Card>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-4 text-muted-foreground">
                            {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Venta Actual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentSale.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No hay productos en la venta</p>
                      ) : (
                        <div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead>Subtotal</TableHead>
                                <TableHead>Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentSale.map((item) => (
                                <TableRow key={item.productId}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>${(item.price * item.quantity).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => removeFromSale(item.productId)}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>

                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Subtotal:</span>
                              <span>${calculateSaleTotal().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Total:</span>
                              <span className="font-bold">${calculateSaleTotal().toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            <Label>Método de Pago</Label>
                            <div className="flex space-x-2">
                              <Button
                                variant={paymentMethod === 'efectivo' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('efectivo')}
                              >
                                Efectivo
                              </Button>
                              <Button
                                variant={paymentMethod === 'tarjeta' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('tarjeta')}
                              >
                                Tarjeta
                              </Button>
                              <Button
                                variant={paymentMethod === 'transferencia' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('transferencia')}
                              >
                                Transferencia
                              </Button>
                            </div>
                          </div>

                          {paymentMethod === 'efectivo' && (
                            <div className="mt-4 space-y-2">
                              <Label htmlFor="cash-received">Efectivo Recibido</Label>
                              <Input
                                id="cash-received"
                                type="number"
                                min={calculateSaleTotal()}
                                value={cashReceived}
                                onChange={(e) => setCashReceived(Number(e.target.value))}
                                placeholder="Ingrese el monto recibido"
                              />
                              {cashReceived > 0 && cashReceived < calculateSaleTotal() && (
                                <p className="text-sm text-red-500">El monto recibido es menor que el total</p>
                              )}
                              {cashReceived >= calculateSaleTotal() && (
                                <div className="flex justify-between font-medium">
                                  <span>Cambio:</span>
                                  <span>${(cashReceived - calculateSaleTotal()).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        disabled={currentSale.length === 0 || (paymentMethod === 'efectivo' && cashReceived < calculateSaleTotal())}
                        onClick={completeSale}
                      >
                        Completar Venta (${calculateSaleTotal().toLocaleString()})
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            )}

            {/* Cash Register */}
            {activeTab === 'cash' && (
              <div>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Cuadratura de Caja</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h3 className="font-medium">Fondo Inicial</h3>
                        <p className="text-2xl font-bold">${cashRegister.initialAmount.toLocaleString()}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium">Ventas Totales</h3>
                        <p className="text-2xl font-bold">${cashRegister.salesTotal.toLocaleString()}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium">Total en Caja</h3>
                        <p className="text-2xl font-bold">${cashRegister.currentAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={resetCashRegister}
                    >
                      Reiniciar Caja
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Ventas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sales.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No hay ventas registradas</p>
                    ) : (
                      <div className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha/Hora</TableHead>
                              <TableHead>Productos</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Método</TableHead>
                              <TableHead>Cambio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sales.map((sale) => (
                              <TableRow key={sale.id}>
                                <TableCell>
                                  {sale.date.toLocaleDateString()} {sale.date.toLocaleTimeString()}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {sale.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                </TableCell>
                                <TableCell>${sale.total.toLocaleString()}</TableCell>
                                <TableCell>
                                  <span className="capitalize">{sale.paymentMethod}</span>
                                </TableCell>
                                <TableCell>
                                  {sale.change ? `$${sale.change.toLocaleString()}` : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}