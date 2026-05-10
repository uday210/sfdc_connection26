public with sharing class SalesCopilot_UpdateProjectDate {

    static final String ERR_NOT_FOUND      = 'Project not found or you do not have access to update it.';
    static final String ERR_INVALID_FIELD  = 'Date field must be either start or end.';
    static final String ERR_DATE_ORDER     = 'The new end date cannot be before the start date. Please choose a later date.';
    static final String ERR_DATE_PAST      = 'The new start date cannot be after the existing end date. Please adjust accordingly.';
    static final String SUCCESS_TEMPLATE   = 'Done. {0} {1} date updated from {2} to {3}.';

    @InvocableMethod(
        label='Update Project Date'
        description='Updates the start or end date of a project. Always confirm with the rep before calling — restate project name, field, old value, and new value, then wait for verbal yes.'
    )
    public static List<Output> execute(List<Input> inputs) {
        Input req = inputs[0];
        Output out = new Output();

        String fieldKey = req.dateField != null ? req.dateField.trim().toLowerCase() : '';
        if (fieldKey != 'start' && fieldKey != 'end') {
            out.success = false;
            out.voiceConfirmation = ERR_INVALID_FIELD;
            return new List<Output>{ out };
        }

        List<Project__c> projects = [
            SELECT  Id, Name, Start_Date__c, End_Date__c,
                    Account__r.Name, OwnerId
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
        Date oldValue;
        Date newDate = req.newDate;

        if (fieldKey == 'start') {
            oldValue = p.Start_Date__c;
            if (p.End_Date__c != null && newDate > p.End_Date__c) {
                out.success = false;
                out.voiceConfirmation = ERR_DATE_PAST;
                return new List<Output>{ out };
            }
            p.Start_Date__c = newDate;
        } else {
            oldValue = p.End_Date__c;
            if (p.Start_Date__c != null && newDate < p.Start_Date__c) {
                out.success = false;
                out.voiceConfirmation = ERR_DATE_ORDER;
                return new List<Output>{ out };
            }
            p.End_Date__c = newDate;
        }

        update p;

        out.success      = true;
        out.projectName  = p.Name;
        out.accountName  = p.Account__r.Name;
        out.dateField    = fieldKey;
        out.oldDateValue = oldValue != null ? oldValue.format() : 'not set';
        out.newDateValue = newDate.format();
        out.voiceConfirmation = String.format(
            SUCCESS_TEMPLATE,
            new List<Object>{ p.Name, fieldKey, out.oldDateValue, out.newDateValue }
        );

        return new List<Output>{ out };
    }

    public class Input {
        @InvocableVariable(label='Project ID'  description='Salesforce ID of the project to update' required=true)
        public String projectId;

        @InvocableVariable(label='Date Field'  description='Which date to update: start or end'       required=true)
        public String dateField;

        @InvocableVariable(label='New Date'    description='The new date value'                        required=true)
        public Date newDate;
    }

    public class Output {
        @InvocableVariable(label='Success')             public Boolean success;
        @InvocableVariable(label='Project Name')        public String  projectName;
        @InvocableVariable(label='Account Name')        public String  accountName;
        @InvocableVariable(label='Date Field Updated')  public String  dateField;
        @InvocableVariable(label='Previous Date')       public String  oldDateValue;
        @InvocableVariable(label='New Date')            public String  newDateValue;
        @InvocableVariable(label='Voice Confirmation')  public String  voiceConfirmation;
    }
}
