package com.movieticket.app.controller;

import com.movieticket.app.dto.refund.RefundResponse;
import com.movieticket.app.repository.RefundRepository;
import com.movieticket.app.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundRepository refundRepository;
    private final CurrentUser currentUser;

    /** Refunds issued to the signed-in customer. */
    @GetMapping("/me")
    @Transactional(readOnly = true)
    public List<RefundResponse> myRefunds() {
        return refundRepository.findByUser_IdOrderByRefundedAtDesc(currentUser.id())
                .stream().map(RefundResponse::from).toList();
    }
}
