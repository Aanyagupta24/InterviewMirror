package com.interviewmirror.backend.model;

public class InterviewRequest {

    private String prompt;

    public InterviewRequest() {
    }

    public InterviewRequest(String prompt) {
        this.prompt = prompt;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }
}