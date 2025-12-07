package com.fascinito.pos.repository;

import com.fascinito.pos.entity.CartItem;
import com.fascinito.pos.entity.Product;
import com.fascinito.pos.entity.ProductVariantCombination;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.entity.VariationOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByUser(User user);
    
    Optional<CartItem> findByUserAndProductId(User user, Long productId);
    
    // Find cart item by user, product and variation option (for products with variations)
    Optional<CartItem> findByUserAndProductIdAndVariationOption(User user, Long productId, VariationOption variationOption);
    
    // Find cart item by user and product where variation option is null (for products without variations)
    Optional<CartItem> findByUserAndProductIdAndVariationOptionIsNull(User user, Long productId);
    
    // Find cart item by user, product and variant combination (for products with multiple variations)
    Optional<CartItem> findByUserAndProductAndVariantCombination(User user, Product product, ProductVariantCombination variantCombination);
    
    void deleteByUser(User user);
}
