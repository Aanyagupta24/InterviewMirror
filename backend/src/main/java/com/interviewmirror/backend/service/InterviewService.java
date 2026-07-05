package com.interviewmirror.backend.service;

import org.springframework.stereotype.Service;

@Service
public class InterviewService {

    private final OllamaService ollamaService;

    public InterviewService(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }

    public String startInterview(String role, String experience) {

        String prompt = """
                You are a professional %s interviewer.

                The candidate has %s of experience.

                Ask ONLY ONE interview question.

                Do not explain.
                Do not greet the candidate.
                Return only the interview question.
                """.formatted(role, experience);

        return ollamaService.generateQuestion(prompt);
    }

    public String nextQuestion(String previousQuestion, String answer) {

    String prompt = """
            You are a professional technical interviewer.

            The previous interview question was:
            %s

            The candidate answered:
            %s

            Ask ONE natural follow-up interview question based on the candidate's answer.

            Do not evaluate.
            Do not explain.
            Return only the next interview question.
            """
            .formatted(previousQuestion, answer);

    return ollamaService.generateQuestion(prompt);
}
}