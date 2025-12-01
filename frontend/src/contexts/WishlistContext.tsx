import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface WishlistContextType {
  wishlistCount: number
  wishlistIds: Set<number>
  addToWishlist: (productId: number) => void
  removeFromWishlist: (productId: number) => void
  isInWishlist: (productId: number) => boolean
  syncWithServer: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider')
  }
  return context
}

interface WishlistProviderProps {
  children: ReactNode
}

// Local storage key for wishlist
const WISHLIST_STORAGE_KEY = 'wishlist_items'

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set())
  const { isAuthenticated } = useAuth()

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY)
    if (savedWishlist) {
      try {
        const ids = JSON.parse(savedWishlist)
        setWishlistIds(new Set(ids))
      } catch (error) {
        console.error('Error loading wishlist from localStorage:', error)
        setWishlistIds(new Set())
      }
    }
  }, [])

  // Sync localStorage whenever wishlist changes
  useEffect(() => {
    const wishlistArray = Array.from(wishlistIds)
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistArray))
  }, [wishlistIds])

  // On login, fetch server wishlist and merge with local
  const syncWithServer = async () => {
    if (!isAuthenticated) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const serverItems = data.data?.items || []
        const serverIds: number[] = serverItems.map((item: any) => item.productId)

        // Merge server items with local items (server takes precedence)
        setWishlistIds((prev) => {
          const merged = new Set<number>([...prev, ...serverIds])
          return merged
        })
      }
    } catch (error) {
      console.error('Error syncing wishlist with server:', error)
    }
  }

  // Sync on login
  useEffect(() => {
    if (isAuthenticated) {
      syncWithServer()
    }
  }, [isAuthenticated])

  const addToWishlist = (productId: number) => {
    setWishlistIds((prev) => {
      const newSet = new Set(prev)
      newSet.add(productId)
      return newSet
    })
  }

  const removeFromWishlist = (productId: number) => {
    setWishlistIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(productId)
      return newSet
    })
  }

  const isInWishlist = (productId: number): boolean => {
    return wishlistIds.has(productId)
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistCount: wishlistIds.size,
        wishlistIds,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        syncWithServer
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}
