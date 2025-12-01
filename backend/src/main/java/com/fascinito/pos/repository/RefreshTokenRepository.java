package com.fascinito.pos.repository;

import com.fascinito.pos.entity.RefreshToken;
import com.fascinito.pos.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    Optional<RefreshToken> findByToken(String token);
    
    void deleteByUser(User user);
    
    void deleteByExpiryDateBefore(LocalDateTime date);
    
    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);
}
