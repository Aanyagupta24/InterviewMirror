package com.interviewmirror.backend.dto;

public class StartInterviewRequest {

    private String role;
    private String experience;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }
}