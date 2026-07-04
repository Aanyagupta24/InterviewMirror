package com.interviewmirror.backend.controller;

import com.interviewmirror.backend.model.InterviewRequest;
import com.interviewmirror.backend.model.InterviewResponse;
import com.interviewmirror.backend.service.OllamaService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interview")
@CrossOrigin(origins = "*")
public class InterviewController {

    private final OllamaService ollamaService;

    public InterviewController(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }

    @PostMapping("/question")
    public InterviewResponse generateQuestion(@RequestBody InterviewRequest request) {

        String response = ollamaService.generateQuestion(request.getPrompt());

        return new InterviewResponse(response);
    }
}