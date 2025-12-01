package com.fascinito.pos.repository;

import com.fascinito.pos.entity.User;
import com.fascinito.pos.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByUser(User user);

    Optional<Wishlist> findByUserAndProductId(User user, Long productId);

    void deleteByUserAndProductId(User user, Long productId);

    boolean existsByUserAndProductId(User user, Long productId);

    long countByUser(User user);
}
