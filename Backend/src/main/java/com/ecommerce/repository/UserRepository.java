package com.ecommerce.repository;

import com.ecommerce.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmailAndIsDelete(String email, int isDelete);

    boolean existsByEmailAndIsDelete(String email, int isDelete);

    // khoá dòng user trong transaction (SELECT ... FOR UPDATE).
    // Các thao tác địa chỉ của cùng một người sẽ chạy lần lượt, không chạy song song.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.email = :email and u.isDelete = 0")
    Optional<User> findByEmailForUpdate(@Param("email") String email);
}