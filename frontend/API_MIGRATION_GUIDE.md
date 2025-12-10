# 🔄 Migration Guide: Using Authenticated API Service

## Overview

All API calls in the application should use the authenticated API service (`api` from `src/api/axiosConfig.ts`) or the helper functions from `src/api/apiHelpers.ts` instead of raw `fetch()` calls.

## Why Migrate?

Using the authenticated API service provides:
- ✅ **Automatic authentication** - Access token added to all requests
- ✅ **Auto token refresh** - Seamlessly handles expired tokens
- ✅ **Request queuing** - Prevents race conditions during refresh
- ✅ **Auto-logout** - Redirects to login when refresh token expires
- ✅ **Error handling** - Consistent error responses
- ✅ **Type safety** - Full TypeScript support

## Migration Patterns

### Pattern 1: Simple GET Request

**❌ Before (using fetch):**
```typescript
const response = await fetch('/api/products')
const data = await response.json()
```

**✅ After (using API service):**
```typescript
import api from '../services/api'

const response = await api.get('/products')
const data = response.data
```

**✅ Alternative (using helper):**
```typescript
import { apiGet } from '../api/apiHelpers'

const data = await apiGet('/products')
```

---

### Pattern 2: POST Request with Body

**❌ Before:**
```typescript
const response = await fetch('/api/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // Manual token management
  },
  body: JSON.stringify({ productId: 123, quantity: 1 })
})
const data = await response.json()
```

**✅ After:**
```typescript
import api from '../services/api'

const response = await api.post('/cart/items', {
  productId: 123,
  quantity: 1
})
const data = response.data
```

**✅ Alternative:**
```typescript
import { apiPost } from '../api/apiHelpers'

const data = await apiPost('/cart/items', {
  productId: 123,
  quantity: 1
})
```

---

### Pattern 3: DELETE Request

**❌ Before:**
```typescript
const response = await fetch(`/api/cart/items/${id}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**✅ After:**
```typescript
import api from '../services/api'

await api.delete(`/cart/items/${id}`)
```

**✅ Alternative:**
```typescript
import { apiDelete } from '../api/apiHelpers'

await apiDelete(`/cart/items/${id}`)
```

---

### Pattern 4: PUT/PATCH Request

**❌ Before:**
```typescript
const response = await fetch(`/api/cart/items/${id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ quantity: 2 })
})
```

**✅ After:**
```typescript
import api from '../services/api'

await api.put(`/cart/items/${id}`, { quantity: 2 })
```

**✅ Alternative:**
```typescript
import { apiPut } from '../api/apiHelpers'

await apiPut(`/cart/items/${id}`, { quantity: 2 })
```

---

### Pattern 5: With Error Handling

**❌ Before:**
```typescript
try {
  const response = await fetch('/api/orders')
  if (!response.ok) {
    throw new Error('Failed to fetch')
  }
  const data = await response.json()
  setOrders(data)
} catch (error) {
  console.error(error)
}
```

**✅ After:**
```typescript
import api from '../services/api'

try {
  const response = await api.get('/orders')
  setOrders(response.data)
} catch (error) {
  console.error(error)
  // Axios interceptor already handles 401 errors and token refresh
}
```

---

### Pattern 6: Public Endpoints (No Auth Required)

For public endpoints that don't require authentication, you can still use the API service:

```typescript
import api from '../services/api'

// Even without a token, this works fine
const response = await api.get('/products?active=true&visibleToCustomers=true')
const data = response.data
```

The interceptor only adds the Authorization header if a token exists.

---

## Files That Need Migration

### Customer Pages (High Priority)
These files are currently using `fetch()` and need migration:

1. ✅ `src/pages/customer/Home.tsx`
2. ✅ `src/pages/customer/Products.tsx`
3. ✅ `src/pages/customer/ProductDetail.tsx`
4. ✅ `src/pages/customer/Cart.tsx`
5. ✅ `src/pages/customer/Wishlist.tsx`
6. ✅ `src/pages/customer/Checkout.tsx`
7. ✅ `src/pages/customer/OrderSuccess.tsx`
8. ✅ `src/pages/customer/Orders.tsx`
9. ✅ `src/pages/customer/Settings.tsx`

### Services (Already Migrated)
- ✅ `src/services/authService.ts` - Already using API service
- ✅ `src/services/razorpayService.ts` - Already using API service

---

## Quick Migration Checklist

For each file:

1. **Add import:**
   ```typescript
   import api from '../services/api'
   // OR
   import { apiGet, apiPost, apiPut, apiDelete } from '../api/apiHelpers'
   ```

2. **Replace fetch calls:**
   - `fetch(url)` → `api.get(url)`
   - `fetch(url, {method: 'POST', body: ...})` → `api.post(url, data)`
   - `fetch(url, {method: 'DELETE'})` → `api.delete(url)`
   - `fetch(url, {method: 'PUT', body: ...})` → `api.put(url, data)`

3. **Remove manual token handling:**
   - Delete `Authorization` header logic
   - Delete manual `localStorage.getItem('accessToken')` calls
   - Delete manual token refresh logic

4. **Update response handling:**
   - Change `await response.json()` to `response.data`
   - Remove `response.ok` checks (Axios throws on errors)

5. **Test the changes:**
   - Test with valid token
   - Test with expired token (auto-refresh should work)
   - Test with no token (should work for public endpoints)
   - Test with expired refresh token (should auto-logout)

---

## Example: Complete Migration

### Before (Home.tsx fragment):
```typescript
const loadCategories = async () => {
  try {
    const response = await fetch('/api/categories?page=0&size=6&active=true')
    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }
    const data = await response.json()
    setCategories(data.data?.content || [])
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}
```

### After:
```typescript
import api from '../services/api'

const loadCategories = async () => {
  try {
    const response = await api.get('/categories?page=0&size=6&active=true')
    setCategories(response.data?.content || [])
  } catch (error) {
    console.error('Error loading categories:', error)
    // Auto-refresh and auto-logout are handled by interceptor
  }
}
```

---

## Benefits After Migration

Once all files are migrated:

1. **Automatic Token Management**
   - No need to manually add Authorization headers
   - No need to check if token exists
   - No need to handle token refresh manually

2. **Better User Experience**
   - Seamless token refresh (user never notices)
   - Auto-logout when session expires
   - No API calls fail due to expired tokens

3. **Cleaner Code**
   - Less boilerplate
   - Consistent API call patterns
   - Better error handling

4. **Type Safety**
   - Full TypeScript support
   - Better IDE autocomplete
   - Fewer runtime errors

---

## Testing After Migration

1. **Test Login Flow:**
   - Login with valid credentials
   - Verify token is stored
   - Make API calls - should succeed

2. **Test Token Refresh:**
   - Wait for access token to expire (or delete it)
   - Make an API call
   - Should auto-refresh and succeed

3. **Test Auto-Logout:**
   - Delete refresh token cookie
   - Make an API call
   - Should redirect to login

4. **Test Public Endpoints:**
   - Logout completely
   - Browse products, categories
   - Should work without token

---

## Common Issues and Solutions

### Issue: "Cannot read property 'data' of undefined"
**Solution:** The API response structure changed. Use `response.data` instead of `response`.

### Issue: "401 Unauthorized" on every request
**Solution:** 
- Check if access token is being set after login
- Verify `withCredentials: true` in axiosConfig
- Check CORS configuration allows credentials

### Issue: Infinite redirect loop
**Solution:**
- Ensure login page is excluded from auth protection
- Check that `_retry` flag is set in interceptor
- Verify refresh endpoint is not protected

---

## Progress Tracking

Use this checklist to track migration progress:

- [ ] Home.tsx
- [ ] Products.tsx
- [ ] ProductDetail.tsx
- [ ] Cart.tsx
- [ ] Wishlist.tsx
- [ ] Checkout.tsx
- [ ] OrderSuccess.tsx
- [ ] Orders.tsx
- [ ] Settings.tsx

---

## Next Steps

1. Migrate one file at a time
2. Test thoroughly after each migration
3. Commit after each successful migration
4. Update this checklist as you progress

---

**Need Help?** Refer to:
- `TOKEN_AUTHENTICATION_GUIDE.md` - Complete auth guide
- `src/api/axiosConfig.ts` - Interceptor implementation
- `src/api/apiHelpers.ts` - Helper functions
