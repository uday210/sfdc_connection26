public with sharing class SalesCopilot_GetProjectSummary {

    static final String NO_PROJECT_FOUND  = 'I could not find a project matching that name. Could you try again with a different name?';
    static final String MULTIPLE_MATCHES  = 'I found more than one project matching that name. Could you be more specific?';
    static final String NO_ACTIVITY       = 'No recent activity on record.';
    static final String SUMMARY_TEMPLATE  = '{0} is currently {1}, running from {2} to {3}. Owner is {4}. {5}{6}';
    static final String RISK_PREFIX       = ' Open risk: ';

    @InvocableMethod(
        label='Get Project Summary'
        description='Retrieves a voice-friendly summary of a project by name or partial name. Returns status, dates, owner, account details, last activity, and any open risks.'
    )
    public static List<Output> execute(List<Input> inputs) {
        String identifier = inputs[0].projectIdentifier.trim();
        String wildcard   = '%' + identifier + '%';

        List<Project__c> matches = [
            SELECT  Id, Name, Status__c, Start_Date__c, End_Date__c,
                    OwnerId, Owner.Name, Description__c, Risks__c,
                    Account__r.Name, Account__r.Industry, Account__r.Type,
                    Account__r.Phone, Account__r.BillingCity, Account__r.BillingState,
                    Account__r.AnnualRevenue, Account__r.NumberOfEmployees,
                    Account__r.Website
            FROM    Project__c
            WHERE   Name LIKE :wildcard
               OR   Account__r.Name LIKE :wildcard
            ORDER BY Name
            LIMIT   5
        ];

        Output out = new Output();

        if (matches.isEmpty()) {
            out.found        = false;
            out.voiceSummary = NO_PROJECT_FOUND;
            return new List<Output>{ out };
        }

        if (matches.size() > 1) {
            out.found          = false;
            out.multipleMatches = true;
            out.voiceSummary   = MULTIPLE_MATCHES;
            return new List<Output>{ out };
        }

        Project__c p   = matches[0];
        out.found      = true;
        out.projectId  = p.Id;
        out.projectName     = p.Name;
        out.status          = p.Status__c;
        out.startDate       = p.Start_Date__c   != null ? p.Start_Date__c.format()  : 'not set';
        out.endDate         = p.End_Date__c     != null ? p.End_Date__c.format()    : 'not set';
        out.ownerName       = p.Owner.Name;
        out.riskText        = String.isBlank(p.Risks__c) ? '' : p.Risks__c;
        out.accountName     = p.Account__r.Name;
        out.accountIndustry = p.Account__r.Industry;
        out.accountType     = p.Account__r.Type;
        out.accountPhone    = p.Account__r.Phone;
        out.accountCity     = p.Account__r.BillingCity;
        out.accountState    = p.Account__r.BillingState;
        out.accountRevenue  = p.Account__r.AnnualRevenue != null
            ? String.valueOf(p.Account__r.AnnualRevenue.setScale(0)) : '';
        out.accountEmployees = p.Account__r.NumberOfEmployees != null
            ? String.valueOf(p.Account__r.NumberOfEmployees) : '';
        out.accountWebsite  = p.Account__r.Website;

        List<Task> recentTasks = [
            SELECT Subject, ActivityDate
            FROM   Task
            WHERE  WhatId = :p.Id
            ORDER BY CreatedDate DESC
            LIMIT  1
        ];
        out.lastActivityText = recentTasks.isEmpty() ? NO_ACTIVITY
            : 'Last activity: ' + recentTasks[0].Subject
              + (recentTasks[0].ActivityDate != null
                 ? ' on ' + recentTasks[0].ActivityDate.format() : '');

        String riskClause = String.isBlank(out.riskText) ? '' : RISK_PREFIX + out.riskText + '.';
        out.voiceSummary = String.format(
            SUMMARY_TEMPLATE,
            new List<Object>{ p.Name, p.Status__c, out.startDate, out.endDate,
                              out.ownerName, out.lastActivityText, riskClause }
        );

        return new List<Output>{ out };
    }

    public class Input {
        @InvocableVariable(label='Project Identifier' description='Project name or partial name to look up' required=true)
        public String projectIdentifier;
    }

    public class Output {
        @InvocableVariable(label='Found')            public Boolean found;
        @InvocableVariable(label='Multiple Matches') public Boolean multipleMatches;
        @InvocableVariable(label='Project ID')       public String  projectId;
        @InvocableVariable(label='Project Name')     public String  projectName;
        @InvocableVariable(label='Status')           public String  status;
        @InvocableVariable(label='Start Date')       public String  startDate;
        @InvocableVariable(label='End Date')         public String  endDate;
        @InvocableVariable(label='Owner Name')       public String  ownerName;
        @InvocableVariable(label='Risk Text')        public String  riskText;
        @InvocableVariable(label='Last Activity')    public String  lastActivityText;
        @InvocableVariable(label='Account Name')     public String  accountName;
        @InvocableVariable(label='Account Industry') public String  accountIndustry;
        @InvocableVariable(label='Account Type')     public String  accountType;
        @InvocableVariable(label='Account Phone')    public String  accountPhone;
        @InvocableVariable(label='Account City')     public String  accountCity;
        @InvocableVariable(label='Account State')    public String  accountState;
        @InvocableVariable(label='Annual Revenue')   public String  accountRevenue;
        @InvocableVariable(label='Employees')        public String  accountEmployees;
        @InvocableVariable(label='Account Website')  public String  accountWebsite;
        @InvocableVariable(label='Voice Summary')    public String  voiceSummary;
    }
}
