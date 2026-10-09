export interface User { id: number; name: string; email: string; role: 'user' | 'admin'; }
export interface AuthResponse { token: string; user: User; }
export interface Product {
  id: number; name: string; description: string; price: number; stock: number;
  imageUrl: string; categoryId: number | null; categoryName?: string; active: boolean;
}
export interface Category { id: number; name: string; slug: string; }
export interface Page<T> { data: T[]; page: number; limit: number; total: number; totalPages: number; }
export interface CartItem { id: number; productId: number; name: string; price: number; imageUrl: string; stock: number; quantity: number; subtotal: number; }
export interface Cart { items: CartItem[]; total: number; count: number; }
export interface OrderItem { productId: number; name: string; price: number; quantity: number; }
export interface Order { id: number; total: number; status: 'pending' | 'paid' | 'shipped' | 'cancelled'; shippingAddress: string; createdAt: string; items: OrderItem[]; }
