package com.ecommerce.exception;

public class InsufficientStockException extends AppException {
    public InsufficientStockException() {
        super(ErrorCode.INSUFFICIENT_STOCK);
    }
}
