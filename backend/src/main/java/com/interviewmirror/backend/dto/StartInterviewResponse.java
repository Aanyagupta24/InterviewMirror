package com.interviewmirror.backend.dto;

public class StartInterviewResponse {

    private String question;

    public StartInterviewResponse() {
    }

    public StartInterviewResponse(String question) {
        this.question = question;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }
}