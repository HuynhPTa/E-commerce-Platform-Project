package com.ecommerce.service;

import com.ecommerce.dto.request.AddressRequest;
import com.ecommerce.dto.response.AddressResponse;
import com.ecommerce.entity.Address;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.AddressRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    // Khoá dòng user: mọi thao tác ghi địa chỉ của cùng một người chạy lần lượt.
    // Chỉ gọi trong method có @Transactional.
    private User currentUserForUpdate(String email) {
        return userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    // Chỉ tìm trong địa chỉ CỦA CHÍNH người dùng này; không có thì coi như không tồn tại
    private Address ownedAddress(int id, int userId) {
        return addressRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> list(String email) {
        User user = userRepository.findByEmailAndIsDelete(email, 0)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return addressRepository.findByUserIdOrderByDefaultAddressDescIdDesc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public AddressResponse create(String email, AddressRequest req) {
        User user = currentUserForUpdate(email);
        boolean isFirst = !addressRepository.existsByUserId(user.getId());
        Address a = Address.builder()
                .user(user)
                .recipientName(req.getRecipientName().trim())
                .phone(req.getPhone().trim())
                .fullAddress(req.getFullAddress().trim())
                .defaultAddress(isFirst)          // địa chỉ đầu tiên tự là mặc định
                .build();
        return toResponse(addressRepository.save(a));
    }

    @Transactional
    public AddressResponse update(String email, int id, AddressRequest req) {
        User user = currentUserForUpdate(email);
        Address a = ownedAddress(id, user.getId());
        a.setRecipientName(req.getRecipientName().trim());
        a.setPhone(req.getPhone().trim());
        a.setFullAddress(req.getFullAddress().trim());
        return toResponse(addressRepository.save(a));
    }

    @Transactional
    public AddressResponse setDefault(String email, int id) {
        User user = currentUserForUpdate(email);
        Address a = ownedAddress(id, user.getId());
        if (!a.isDefaultAddress()) {
            addressRepository.clearDefault(user.getId());
            a = ownedAddress(id, user.getId());   // nạp lại vì clearDefault làm mới cache JPA
            a.setDefaultAddress(true);
            addressRepository.save(a);
        }
        return toResponse(a);
    }

    @Transactional
    public void delete(String email, int id) {
        User user = currentUserForUpdate(email);
        Address a = ownedAddress(id, user.getId());
        boolean wasDefault = a.isDefaultAddress();
        addressRepository.delete(a);
        addressRepository.flush();
        if (wasDefault) {
            // vừa xoá địa chỉ mặc định: nâng địa chỉ mới nhất còn lại lên
            addressRepository.findFirstByUserIdOrderByIdDesc(user.getId()).ifPresent(next -> {
                next.setDefaultAddress(true);
                addressRepository.save(next);
            });
        }
    }

    private AddressResponse toResponse(Address a) {
        return AddressResponse.builder()
                .id(a.getId())
                .recipientName(a.getRecipientName())
                .phone(a.getPhone())
                .fullAddress(a.getFullAddress())
                .defaultAddress(a.isDefaultAddress())
                .build();
    }
}