package com.interviewmirror.backend.controller;

import com.interviewmirror.backend.dto.StartInterviewRequest;
import com.interviewmirror.backend.dto.StartInterviewResponse;
import com.interviewmirror.backend.service.InterviewService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interview")
@CrossOrigin(origins = "*")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping("/start")
    public StartInterviewResponse startInterview(
            @RequestBody StartInterviewRequest request) {

        String question = interviewService.startInterview(
                request.getRole(),
                request.getExperience());

        return new StartInterviewResponse(question);
    }
}