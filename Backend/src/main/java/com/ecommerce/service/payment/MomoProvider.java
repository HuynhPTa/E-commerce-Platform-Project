package com.ecommerce.service.payment;

import com.ecommerce.entity.Payment;
import com.ecommerce.entity.PaymentMethod;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class MomoProvider implements PaymentProvider {
    private final String partnerCode;
    private final String accessKey;
    private final String secretKey;
    private final String endpoint;
    private final String returnUrl;
    private final String ipnUrl;
    private final RestClient restClient = RestClient.create();

    public MomoProvider(
            @Value("${payment.momo.partner-code:}") String partnerCode,
            @Value("${payment.momo.access-key:}") String accessKey,
            @Value("${payment.momo.secret-key:}") String secretKey,
            @Value("${payment.momo.endpoint:https://test-payment.momo.vn/v2/gateway/api/create}") String endpoint,
            @Value("${payment.momo.return-url:http://localhost:8080/api/payments/momo/return}") String returnUrl,
            @Value("${payment.momo.ipn-url:http://localhost:8080/api/payments/momo/ipn}") String ipnUrl) {
        this.partnerCode = partnerCode;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.endpoint = endpoint;
        this.returnUrl = returnUrl;
        this.ipnUrl = ipnUrl;
    }

    @Override
    public PaymentMethod method() {
        return PaymentMethod.MOMO;
    }

    @Override
    public boolean isConfigured() {
        return notBlank(partnerCode) && notBlank(accessKey) && notBlank(secretKey)
                && notBlank(endpoint) && notBlank(returnUrl) && notBlank(ipnUrl);
    }

    @Override
    public String createPaymentUrl(Payment payment, String clientIp) {
        int checkoutSessionId = payment.getCheckoutSession().getId();
        String orderId = PaymentReference.create(checkoutSessionId);
        String requestId = orderId + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String orderInfo = "Thanh toan don hang " + checkoutSessionId;
        String extraData = "";
        String requestType = "captureWallet";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", partnerCode);
        body.put("accessKey", accessKey);
        body.put("requestId", requestId);
        body.put("amount", payment.getAmountMinor());
        body.put("orderId", orderId);
        body.put("orderInfo", orderInfo);
        body.put("redirectUrl", returnUrl);
        body.put("ipnUrl", ipnUrl);
        body.put("extraData", extraData);
        body.put("requestType", requestType);
        body.put("lang", "vi");
        body.put("signature", signCreate(payment.getAmountMinor(), orderId, orderInfo,
                extraData, requestId, requestType));

        try {
            Map<?, ?> response = restClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (response == null) {
                throw new AppException(ErrorCode.PAYMENT_PROVIDER_ERROR);
            }
            int resultCode = Integer.parseInt(String.valueOf(response.get("resultCode")));
            String payUrl = response.get("payUrl") == null ? null : String.valueOf(response.get("payUrl"));
            if (resultCode != 0 || payUrl == null || payUrl.isBlank()) {
                throw new AppException(ErrorCode.PAYMENT_PROVIDER_ERROR);
            }
            return payUrl;
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AppException(ErrorCode.PAYMENT_PROVIDER_ERROR);
        }
    }

    @Override
    public PaymentCallback verifyCallback(Map<String, String> params) {
        String received = params.get("signature");
        boolean valid = PaymentSignatures.constantTimeEquals(signCallback(params), received);
        int checkoutSessionId = valid ? PaymentReference.parseSessionId(params.get("orderId")) : 0;
        boolean success = "0".equals(params.get("resultCode"));
        return new PaymentCallback(valid, success, checkoutSessionId,
                params.get("transId"), parseAmount(params.get("amount")),
                params.get("resultCode"), params.get("message"));
    }

    String signCallback(Map<String, String> params) {
        String rawHash = "accessKey=" + accessKey
                + "&amount=" + value(params, "amount")
                + "&extraData=" + value(params, "extraData")
                + "&message=" + value(params, "message")
                + "&orderId=" + value(params, "orderId")
                + "&orderInfo=" + value(params, "orderInfo")
                + "&orderType=" + value(params, "orderType")
                + "&partnerCode=" + value(params, "partnerCode")
                + "&payType=" + value(params, "payType")
                + "&requestId=" + value(params, "requestId")
                + "&responseTime=" + value(params, "responseTime")
                + "&resultCode=" + value(params, "resultCode")
                + "&transId=" + value(params, "transId");
        return PaymentSignatures.hmacSha256(secretKey, rawHash);
    }

    private String signCreate(int amount, String orderId, String orderInfo,
                              String extraData, String requestId, String requestType) {
        String rawHash = "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + returnUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;
        return PaymentSignatures.hmacSha256(secretKey, rawHash);
    }

    private int parseAmount(String rawAmount) {
        if (rawAmount == null || rawAmount.isBlank()) {
            return -1;
        }
        try {
            return Integer.parseInt(rawAmount);
        } catch (NumberFormatException ex) {
            return -1;
        }
    }

    private String value(Map<String, String> params, String key) {
        String value = params.get(key);
        return value == null ? "" : value;
    }

    private boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
