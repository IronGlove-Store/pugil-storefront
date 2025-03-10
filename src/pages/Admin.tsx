import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Package, 
  ShoppingBag, 
  Settings,
  PlusCircle,
  Edit,
  Trash,
  RefreshCw,
  CheckCircle,
  XCircle,
  Search,
  User
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import customizableProducts from "@/data/customizableProducts.json";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  colors?: string[];
  sizes?: string[];
  created_at: string;
  original_price?: number;
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  phone: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  payment_method: string;
  shipping_method: string;
  shipping_days: string;
  user_id?: string;
  delivery_code?: string;
  personal_info?: PersonalInfo;
}

const initialProducts: Product[] = [
  {
    id: "prod_1",
    name: "Sapatos de Corrida",
    description: "Sapatos leves e confortáveis para corrida",
    price: 89.99,
    category: "calçados",
    image_url: "/placeholder.svg",
    created_at: new Date().toISOString()
  },
  {
    id: "prod_2",
    name: "Camiseta Sports",
    description: "Camiseta respirável para prática esportiva",
    price: 29.99,
    category: "roupas",
    image_url: "/placeholder.svg",
    created_at: new Date().toISOString()
  }
];

const initialOrders: Order[] = [
  {
    id: "ord_1",
    status: "completed",
    total_amount: 119.98,
    created_at: new Date().toISOString(),
    payment_method: "card",
    shipping_method: "Entrega Padrão",
    shipping_days: "3-5 dias úteis"
  }
];

const Admin = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [availableColors, setAvailableColors] = useState<{name: string, value: string}[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    image_url: "/placeholder.svg",
    colors: [] as string[],
    sizes: [] as string[],
    original_price: undefined as number | undefined
  });
  
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryCodeInput, setDeliveryCodeInput] = useState("");
  const [deliveryCodeError, setDeliveryCodeError] = useState(false);
  
  useEffect(() => {
    setAvailableColors(customizableProducts.colors);
    
    const allSizes = customizableProducts.categories.flatMap(cat => cat.sizes);
    const uniqueSizes = [...new Set(allSizes)];
    setAvailableSizes(uniqueSizes);
  }, []);
  
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar autenticado para acessar o painel de administração.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const hasAdminName = user?.fullName?.toLowerCase() === "admin";
    const hasAdminUsername = user?.username?.toLowerCase() === "admin";
    const userEmail = user?.primaryEmailAddress?.emailAddress || "";
    const hasAdminEmail = userEmail.startsWith("admin") || userEmail.includes("admin");
    
    const userIsAdmin = hasAdminName || hasAdminUsername || hasAdminEmail;
    setIsAdmin(userIsAdmin);

    if (!userIsAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar o painel de administração. O acesso é restrito a usuários com nome ou username 'admin'.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    loadData();
  }, [isSignedIn, isLoaded, navigate, user, toast]);

  const loadData = () => {
    setIsLoading(true);
    try {
      const storedProducts = localStorage.getItem('admin_products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(initialProducts);
        localStorage.setItem('admin_products', JSON.stringify(initialProducts));
      }
      
      const storedOrders = localStorage.getItem('admin_orders');
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      } else {
        setOrders(initialOrders);
        localStorage.setItem('admin_orders', JSON.stringify(initialOrders));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Usando dados padrão.",
        variant: "destructive",
      });
      
      setProducts(initialProducts);
      setOrders(initialOrders);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveProducts = (updatedProducts: Product[]) => {
    localStorage.setItem('admin_products', JSON.stringify(updatedProducts));
    setProducts(updatedProducts);
  };
  
  const saveOrders = (updatedOrders: Order[]) => {
    localStorage.setItem('admin_orders', JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
  };
  
  const handleAddProduct = () => {
    if (!productForm.name || !productForm.price) {
      toast({
        title: "Erro",
        description: "Nome e preço são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    const newProduct: Product = {
      id: "prod_" + Date.now(),
      created_at: new Date().toISOString(),
      ...productForm
    };
    
    const updatedProducts = [...products, newProduct];
    saveProducts(updatedProducts);
    
    setProductForm({
      name: "",
      description: "",
      price: 0,
      category: "",
      image_url: "/placeholder.svg",
      colors: [],
      sizes: [],
      original_price: undefined
    });
    
    toast({
      title: "Sucesso",
      description: "Produto adicionado com sucesso! O produto já está disponível no catálogo.",
    });
  };
  
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category || "",
      image_url: product.image_url || "/placeholder.svg",
      colors: product.colors || [],
      sizes: product.sizes || [],
      original_price: product.original_price
    });
  };
  
  const handleSaveEdit = () => {
    if (!editingProduct) return;
    
    const updatedProducts = products.map(p => 
      p.id === editingProduct.id 
        ? { ...editingProduct, ...productForm } 
        : p
    );
    
    saveProducts(updatedProducts);
    
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      price: 0,
      category: "",
      image_url: "/placeholder.svg",
      colors: [],
      sizes: [],
      original_price: undefined
    });
    
    toast({
      title: "Sucesso",
      description: "Produto atualizado com sucesso! As alterações já estão disponíveis no catálogo.",
    });
  };
  
  const handleToggleColor = (colorName: string) => {
    setProductForm(prev => {
      const isSelected = prev.colors.includes(colorName);
      return {
        ...prev,
        colors: isSelected
          ? prev.colors.filter(c => c !== colorName)
          : [...prev.colors, colorName]
      };
    });
  };
  
  const handleToggleSize = (size: string) => {
    setProductForm(prev => {
      const sizes = prev.sizes || [];
      const isSelected = sizes.includes(size);
      return {
        ...prev,
        sizes: isSelected
          ? sizes.filter(s => s !== size)
          : [...sizes, size]
      };
    });
  };
  
  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    saveProducts(updatedProducts);
    
    toast({
      title: "Sucesso",
      description: "Produto excluído com sucesso! O produto foi removido do catálogo.",
    });
  };
  
  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus } 
        : order
    );
    
    saveOrders(updatedOrders);
    
    toast({
      title: "Sucesso",
      description: `Status do pedido atualizado para: ${newStatus}`,
    });
  };
  
  const handleVerifyOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDeliveryCodeInput("");
    setDeliveryCodeError(false);
    setShowVerifyDialog(true);
  };
  
  const handleConfirmDeliveryCode = () => {
    const order = orders.find(o => o.id === selectedOrderId);
    
    if (!order || !order.delivery_code) {
      setDeliveryCodeError(true);
      return;
    }
    
    if (order.delivery_code.trim() === deliveryCodeInput.trim()) {
      const updatedOrders = orders.map(o => 
        o.id === selectedOrderId 
          ? { ...o, status: 'completed' } 
          : o
      );
      
      saveOrders(updatedOrders);
      
      setShowVerifyDialog(false);
      setSelectedOrderId(null);
      setDeliveryCodeInput("");
      
      toast({
        title: "Pedido verificado",
        description: "Código de entrega confirmado. Pedido marcado como concluído.",
      });
    } else {
      setDeliveryCodeError(true);
    }
  };

  if (!isLoaded) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!isSignedIn) {
    return <div className="p-8 text-center">Redirecionando para autenticação...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Acesso restrito</h1>
        <p className="text-gray-600 mb-6">Seu usuário não tem permissão para acessar o painel de administração.</p>
        <p className="text-gray-600 mb-6">O acesso é restrito a usuários com nome ou username 'admin'.</p>
        <Button onClick={() => navigate("/")}>Voltar para a página inicial</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
          <p className="text-gray-500 mt-1">Gerencie seus produtos, pedidos e configurações</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 md:w-auto">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">Produtos</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden md:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gerenciar Produtos</h2>
              <Button 
                className="flex items-center gap-2"
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: "",
                    description: "",
                    price: 0,
                    category: "",
                    image_url: "/placeholder.svg",
                    colors: [],
                    sizes: [],
                    original_price: undefined
                  });
                }}
              >
                <PlusCircle className="h-4 w-4" />
                Adicionar Produto
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</CardTitle>
                <CardDescription>
                  {editingProduct 
                    ? `Editando: ${editingProduct.name}`
                    : 'Preencha os detalhes para adicionar um novo produto'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome*</label>
                    <input 
                      type="text"
                      className="w-full p-2 border rounded"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descrição</label>
                    <textarea 
                      className="w-full p-2 border rounded"
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Preço*</label>
                      <input 
                        type="number"
                        className="w-full p-2 border rounded"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Preço Original (opcional)</label>
                      <input 
                        type="number"
                        className="w-full p-2 border rounded"
                        value={productForm.original_price || ''}
                        onChange={(e) => setProductForm({
                          ...productForm, 
                          original_price: e.target.value ? Number(e.target.value) : undefined
                        })}
                        placeholder="Deixe em branco se não houver desconto"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoria</label>
                    <input 
                      type="text"
                      className="w-full p-2 border rounded"
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">URL da Imagem</label>
                    <input 
                      type="text"
                      className="w-full p-2 border rounded"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cores disponíveis</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                      {availableColors.map((color) => (
                        <div key={color.name} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`color-${color.name}`} 
                            checked={productForm.colors.includes(color.name)}
                            onCheckedChange={() => handleToggleColor(color.name)}
                          />
                          <label
                            htmlFor={`color-${color.name}`}
                            className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            <span 
                              className="inline-block w-4 h-4 rounded-full" 
                              style={{ backgroundColor: color.value }}
                            ></span>
                            {color.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tamanhos disponíveis</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                      {availableSizes.map((size) => (
                        <div key={size} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`size-${size}`} 
                            checked={(productForm.sizes || []).includes(size)}
                            onCheckedChange={() => handleToggleSize(size)}
                          />
                          <label
                            htmlFor={`size-${size}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {size}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Button 
                      onClick={editingProduct ? handleSaveEdit : handleAddProduct}
                      className="mr-2"
                    >
                      {editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
                    </Button>
                    {editingProduct && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({
                            name: "",
                            description: "",
                            price: 0,
                            category: "",
                            image_url: "/placeholder.svg",
                            colors: [],
                            sizes: [],
                            original_price: undefined
                          });
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Produtos ({products.length})</CardTitle>
                <CardDescription>Lista de todos os produtos disponíveis na loja</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-4">Carregando produtos...</div>
                ) : products.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">
                    Nenhum produto encontrado
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-2 text-left">Nome</th>
                          <th className="px-4 py-2 text-left">Preço</th>
                          <th className="px-4 py-2 text-left">Categoria</th>
                          <th className="px-4 py-2 text-left">Cores</th>
                          <th className="px-4 py-2 text-left">Tamanhos</th>
                          <th className="px-4 py-2 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product.id} className="border-b">
                            <td className="px-4 py-2">{product.name}</td>
                            <td className="px-4 py-2">€{product.price.toFixed(2)}</td>
                            <td className="px-4 py-2">{product.category}</td>
                            <td className="px-4 py-2">
                              <div className="flex gap-1">
                                {product.colors && product.colors.length > 0 ? (
                                  product.colors.map(colorName => {
                                    const colorObj = availableColors.find(c => c.name === colorName);
                                    return (
                                      <div 
                                        key={colorName}
                                        className="w-4 h-4 rounded-full border border-gray-300"
                                        style={{ backgroundColor: colorObj?.value || '#ccc' }}
                                        title={colorName}
                                      />
                                    );
                                  })
                                ) : (
                                  <span className="text-gray-400">Padrão</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex gap-1">
                                {product.sizes && product.sizes.length > 0 ? (
                                  product.sizes.map(size => (
                                    <span key={size} className="px-2 py-1 text-xs rounded-full bg-gray-200">
                                      {size}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400">Único</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gerenciar Pedidos</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes ({orders.length})</CardTitle>
                <CardDescription>Últimos pedidos realizados na loja</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-4">Carregando pedidos...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">
                    Nenhum pedido encontrado
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-2 text-left">ID</th>
                          <th className="px-4 py-2 text-left">Cliente</th>
                          <th className="px-4 py-2 text-left">Data</th>
                          <th className="px-4 py-2 text-left">Total</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => {
                          const date = new Date(order.created_at);
                          const formattedDate = date.toLocaleDateString('pt-PT');
                          
                          return (
                            <tr key={order.id} className="border-b">
                              <td className="px-4 py-2">#{order.id.substring(0, 8)}</td>
                              <td className="px-4 py-2">
                                {order.personal_info ? 
                                  `${order.personal_info.firstName} ${order.personal_info.lastName}` : 
                                  "Cliente"}
                              </td>
                              <td className="px-4 py-2">{formattedDate}</td>
                              <td className="px-4 py-2">€{order.total_amount.toFixed(2)}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {order.status === 'completed' ? 'Concluído' : 
                                  order.status === 'processing' ? 'Em processamento' :
                                  order.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleVerifyOrder(order.id)}
                                    title="Verificar código de entrega"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  
                                  <select 
                                    className="p-1 border rounded text-sm"
                                    value={order.status}
                                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  >
                                    <option value="pending">Pendente</option>
                                    <option value="processing">Em Processamento</option>
                                    <option value="completed">Concluído</option>
                                    <option value="cancelled">Cancelado</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Pedido</CardTitle>
                <CardDescription>Selecione um pedido acima para ver detalhes completos</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedOrderId ? (
                  <div>
                    {/* Order details will be displayed here */}
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    Nenhum pedido selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Loja</CardTitle>
                <CardDescription>Gerencie as configurações gerais da loja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Stripe</h3>
                    <p className="text-sm text-gray-500">
                      Configure a integração com o Stripe para processamento de pagamentos
                    </p>
                    <Button variant="outline" className="mt-2">
                      Configurar Stripe
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Clerk</h3>
                    <p className="text-sm text-gray-500">
                      Configure as opções de autenticação com Clerk
                    </p>
                    <Button variant="outline" className="mt-2">
                      Configurar Clerk
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Armazenamento Local</h3>
                    <p className="text-sm text-gray-500">
                      Gerenciar dados armazenados localmente
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => {
                        localStorage.removeItem('admin_products');
                        localStorage.removeItem('admin_orders');
                        localStorage.removeItem('latestOrder');
                        loadData();
                        toast({
                          title: "Dados resetados",
                          description: "Os dados locais foram resetados para os valores padrão.",
                        });
                      }}
                    >
                      Resetar Dados
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Código de Entrega</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Insira o código de entrega apresentado pelo cliente:</p>
            <Input
              placeholder="Ex: ENT12ABC"
              value={deliveryCodeInput}
              onChange={(e) => {
                setDeliveryCodeInput(e.target.value);
                setDeliveryCodeError(false);
              }}
              className={deliveryCodeError ? "border-red-500" : ""}
            />
            {deliveryCodeError && (
              <p className="text-red-500 text-sm mt-1">
                Código de entrega inválido. Verifique e tente novamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDeliveryCode}>
              Verificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
