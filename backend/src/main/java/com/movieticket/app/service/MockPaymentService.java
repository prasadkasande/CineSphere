package com.movieticket.app.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Stand-in for a real payment gateway. Always succeeds - swap the body of
 * charge() for a real gateway call (e.g. Stripe PaymentIntent) later without
 * touching BookingService.
 */
@Service
public class MockPaymentService {

    public String charge(BigDecimal amount, String description) {
        return "MOCK-" + UUID.randomUUID();
    }

    /**
     * Reverses a charge. A real gateway would take the original payment
     * reference; the signature is shaped for that so only the body changes.
     */
    public String refund(BigDecimal amount, String description) {
        return "MOCK-REFUND-" + UUID.randomUUID();
    }
}
