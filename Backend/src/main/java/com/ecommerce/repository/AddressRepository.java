package com.ecommerce.repository;

import com.ecommerce.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Integer> {

    List<Address> findByUserIdOrderByDefaultAddressDescIdDesc(int userId);

    Optional<Address> findByIdAndUserId(int id, int userId);

    // Bước 7: kiểm tra tài khoản đã có địa chỉ nào chưa (địa chỉ đầu tiên sẽ là mặc định)
    boolean existsByUserId(int userId);

    // Bước 7: sau khi xoá địa chỉ mặc định, chọn địa chỉ mới nhất còn lại để nâng lên
    Optional<Address> findFirstByUserIdOrderByIdDesc(int userId);

    // Bước 7: bỏ cờ mặc định của mọi địa chỉ thuộc người dùng này
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Address a set a.defaultAddress = false where a.user.id = :userId and a.defaultAddress = true")
    int clearDefault(@Param("userId") int userId);
}