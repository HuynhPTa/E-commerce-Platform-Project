package com.ecommerce.service.payment;

import com.ecommerce.entity.Payment;
import com.ecommerce.entity.PaymentMethod;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;

@Component
public class VnPayProvider implements PaymentProvider {
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;

    public VnPayProvider(
            @Value("${payment.vnpay.tmn-code:}") String tmnCode,
            @Value("${payment.vnpay.hash-secret:}") String hashSecret,
            @Value("${payment.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") String payUrl,
            @Value("${payment.vnpay.return-url:http://localhost:8080/api/payments/vnpay/return}") String returnUrl) {
        this.tmnCode = tmnCode;
        this.hashSecret = hashSecret;
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
    }

    @Override
    public PaymentMethod method() {
        return PaymentMethod.VNPAY;
    }

    @Override
    public boolean isConfigured() {
        return notBlank(tmnCode) && notBlank(hashSecret) && notBlank(payUrl) && notBlank(returnUrl);
    }

    @Override
    public String createPaymentUrl(Payment payment, String clientIp) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf((long) payment.getAmountMinor() * 100L));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", PaymentReference.create(payment.getCheckoutSession().getId()));
        params.put("vnp_OrderInfo", "Thanh toan don hang " + payment.getCheckoutSession().getId());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", normalizeIp(clientIp));
        params.put("vnp_CreateDate", now.format(DATE_FORMAT));
        params.put("vnp_ExpireDate", now.plusMinutes(15).format(DATE_FORMAT));

        params.put("vnp_SecureHash", sign(params));
        return payUrl + "?" + PaymentSignatures.query(params);
    }

    @Override
    public PaymentCallback verifyCallback(Map<String, String> params) {
        String received = params.get("vnp_SecureHash");
        boolean valid = PaymentSignatures.constantTimeEquals(sign(params), received);
        int checkoutSessionId = valid ? PaymentReference.parseSessionId(params.get("vnp_TxnRef")) : 0;
        boolean success = "00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.get("vnp_TransactionStatus"));
        return new PaymentCallback(valid, success, checkoutSessionId,
                params.get("vnp_TransactionNo"), parseAmount(params.get("vnp_Amount")),
                params.get("vnp_ResponseCode"), params.get("vnp_Message"));
    }

    /** Dùng cho test và cho chính provider; package-private để không lộ qua API. */
    String sign(Map<String, String> params) {
        Map<String, String> signed = new TreeMap<>(params);
        signed.remove("vnp_SecureHash");
        signed.remove("vnp_SecureHashType");
        return PaymentSignatures.hmacSha512(hashSecret, PaymentSignatures.query(signed));
    }

    private int parseAmount(String rawAmount) {
        if (rawAmount == null || rawAmount.isBlank()) {
            return -1;
        }
        try {
            long amount = Long.parseLong(rawAmount);
            if (amount < 0 || amount % 100 != 0 || amount / 100 > Integer.MAX_VALUE) {
                return -1;
            }
            return (int) (amount / 100);
        } catch (NumberFormatException ex) {
            return -1;
        }
    }

    private String normalizeIp(String clientIp) {
        if (clientIp == null || clientIp.isBlank() || "0:0:0:0:0:0:0:1".equals(clientIp)) {
            return "127.0.0.1";
        }
        return clientIp;
    }

    private boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
