public with sharing class SalesCopilot_FindProject {

    static final String NO_RESULTS = 'I could not find any projects matching that search term.';

    @InvocableMethod(
        label='Find Project'
        description='Disambiguation helper. Returns up to 3 project matches for a search term, with project name, account name, and status. Use when the rep names a project and GetProjectSummary returns multiple matches.'
    )
    public static List<Output> execute(List<Input> inputs) {
        String term     = inputs[0].searchTerm.trim();
        String wildcard = '%' + term + '%';

        List<Project__c> results = [
            SELECT  Id, Name, Status__c,
                    Account__r.Name, Account__r.Industry,
                    Account__r.BillingCity, Account__r.BillingState
            FROM    Project__c
            WHERE   Name LIKE :wildcard
               OR   Account__r.Name LIKE :wildcard
            ORDER BY Name
            LIMIT   3
        ];

        Output out = new Output();
        out.matches = new List<ProjectMatch>();

        if (results.isEmpty()) {
            out.found          = false;
            out.voiceSummary   = NO_RESULTS;
            return new List<Output>{ out };
        }

        out.found = true;
        List<String> spokenNames = new List<String>();

        for (Project__c p : results) {
            ProjectMatch m   = new ProjectMatch();
            m.projectId      = p.Id;
            m.projectName    = p.Name;
            m.accountName    = p.Account__r.Name;
            m.accountIndustry = p.Account__r.Industry;
            m.accountLocation = p.Account__r.BillingCity
                + (String.isNotBlank(p.Account__r.BillingState)
                   ? ', ' + p.Account__r.BillingState : '');
            m.status         = p.Status__c;
            out.matches.add(m);
            spokenNames.add(p.Name + ' at ' + p.Account__r.Name);
        }

        out.voiceSummary = 'I found ' + results.size() + ' project'
            + (results.size() > 1 ? 's' : '') + ': '
            + String.join(spokenNames, '; ') + '. Which one did you mean?';

        return new List<Output>{ out };
    }

    public class Input {
        @InvocableVariable(label='Search Term' description='Project name or account name to search' required=true)
        public String searchTerm;
    }

    public class Output {
        @InvocableVariable(label='Found')         public Boolean            found;
        @InvocableVariable(label='Matches')       public List<ProjectMatch> matches;
        @InvocableVariable(label='Voice Summary') public String             voiceSummary;
    }

    public class ProjectMatch {
        @InvocableVariable(label='Project ID')        public String projectId;
        @InvocableVariable(label='Project Name')      public String projectName;
        @InvocableVariable(label='Account Name')      public String accountName;
        @InvocableVariable(label='Account Industry')  public String accountIndustry;
        @InvocableVariable(label='Account Location')  public String accountLocation;
        @InvocableVariable(label='Status')            public String status;
    }
}
