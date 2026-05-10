public with sharing class SalesCopilot_LogProjectNote {

    static final String ERR_NOT_FOUND     = 'Project not found or you do not have access to it.';
    static final String ERR_EMPTY_NOTE    = 'The note body cannot be empty. Please provide some text to log.';
    static final String SUCCESS_TEMPLATE  = 'Done. Note logged on {0} at {1}: {2}';
    static final String TASK_SUBJECT      = 'Voice note';

    @InvocableMethod(
        label='Log Project Note'
        description='Creates a Task (voice note) linked to a project. Always confirm the note text with the rep before calling — read it back and wait for verbal yes.'
    )
    public static List<Output> execute(List<Input> inputs) {
        Input req  = inputs[0];
        Output out = new Output();

        if (String.isBlank(req.noteBody)) {
            out.success = false;
            out.voiceConfirmation = ERR_EMPTY_NOTE;
            return new List<Output>{ out };
        }

        List<Project__c> projects = [
            SELECT  Id, Name, Account__r.Name, OwnerId
            FROM    Project__c
            WHERE   Id = :req.projectId
            LIMIT   1
        ];

        if (projects.isEmpty()) {
            out.success = false;
            out.voiceConfirmation = ERR_NOT_FOUND;
            return new List<Output>{ out };
        }

        Project__c p = projects[0];

        Task note = new Task(
            Subject      = TASK_SUBJECT,
            Description  = req.noteBody,
            WhatId       = p.Id,
            OwnerId      = UserInfo.getUserId(),
            Status       = 'Completed',
            ActivityDate = Date.today(),
            Priority     = 'Normal'
        );
        insert note;

        out.success     = true;
        out.taskId      = note.Id;
        out.projectName = p.Name;
        out.accountName = p.Account__r.Name;
        out.noteBody    = req.noteBody;
        out.voiceConfirmation = String.format(
            SUCCESS_TEMPLATE,
            new List<Object>{ p.Name, p.Account__r.Name, req.noteBody }
        );

        return new List<Output>{ out };
    }

    public class Input {
        @InvocableVariable(label='Project ID'  description='Salesforce ID of the project to log against' required=true)
        public String projectId;

        @InvocableVariable(label='Note Body'   description='The text of the voice note to log'            required=true)
        public String noteBody;
    }

    public class Output {
        @InvocableVariable(label='Success')            public Boolean success;
        @InvocableVariable(label='Task ID')            public String  taskId;
        @InvocableVariable(label='Project Name')       public String  projectName;
        @InvocableVariable(label='Account Name')       public String  accountName;
        @InvocableVariable(label='Note Body Logged')   public String  noteBody;
        @InvocableVariable(label='Voice Confirmation') public String  voiceConfirmation;
    }
}
